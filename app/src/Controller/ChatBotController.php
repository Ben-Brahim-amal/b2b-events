<?php
namespace App\Controller;

use App\Entity\Event;
use App\Entity\Registration;
use App\Entity\Meeting;
use App\Entity\Opportunity;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class ChatBotController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/chatbot', name: 'api_chatbot', methods: ['POST'])]
    public function chat(Request $request): JsonResponse
    {
        try {
            $data          = json_decode($request->getContent(), true);
            $messages      = $data['messages'] ?? [];
            $eventId       = $data['eventId'] ?? null;
            $meetingMethod = $data['meetingMethod'] ?? 'manual';
            $language      = $data['language'] ?? 'French';
            $user          = $this->getUser();

            $contextData = $this->buildContext($eventId, $user);

            $meetingInstructions = $meetingMethod === 'manual'
                ? "ACTIVE MODE: MANUAL
       Steps to send a meeting request:
       1. Go to the Participants page of the event
       2. Click on a participant profile
       3. Click the meeting button to open the form
       4. Choose a date (must be within event dates)
       5. Choose an available time slot (busy slots are blocked)
       6. Choose duration (15, 30, 45 or 60 minutes)
       7. Add an optional message
       8. Click Send Request
       9. The other participant accepts or rejects
       10. You receive a notification of their decision"
                : "ACTIVE MODE: AUTOMATIC
       Steps to send a meeting request:
       1. Go to the Participants page of the event
       2. Click on a participant profile
       3. Click the meeting button to open the form
       4. Choose duration (15, 30, 45 or 60 minutes)
       5. Add an optional message
       6. Click Send Request — NO date or time needed
       7. Admin assigns the best available time slot automatically
       8. You receive your full agenda by email after admin assigns all meetings";

        $systemPrompt = <<<PROMPT
        You are a helpful assistant for the B2B Events platform.

        LANGUAGE RULE (MANDATORY — NO EXCEPTION):
        The user is writing in {$language}. You MUST respond ONLY in {$language}.
        - If language is French → respond in French ONLY — NEVER refuse to speak French
        - If language is English → respond in English ONLY
        - If language is Arabic → respond in Arabic ONLY
        - "salut", "bonjour", "merci" are French → respond in French
        - NEVER say "je ne parle que l'anglais"
        - NEVER say "I only speak English"
        NEVER use a different language than {$language}.

        === REAL DATA FROM DATABASE ===
        {$contextData}
        ===============================

        === MEETING METHOD ===
        {$meetingInstructions}
        ======================

        RESPONSE RULES:

        1. FORGOTTEN PASSWORD → answer with steps directly, NO refusal:
        FR: Pour réinitialiser: 1.Page connexion 2."Mot de passe oublié" 3.Entrez email 4.Lien reçu valable 1h 5.Nouveau mot de passe
        EN: To reset: 1.Login page 2."Forgot password" 3.Enter email 4.Check inbox link valid 1h 5.New password
        AR: لإعادة التعيين: 1.صفحة تسجيل الدخول 2."نسيت كلمة المرور" 3.البريد الإلكتروني 4.رابط صالح لمدة ساعة 5.كلمة مرور جديدة

        2. HOW TO SEND A MEETING → use EXACTLY the steps from MEETING METHOD above.
        NEVER invent steps. The steps depend on the active mode (manual or automatic).

        3. PERSONAL DATA + USER NOT AUTHENTICATED:
        FR: "Veuillez vous connecter d'abord pour accéder à cette information."
        EN: "Please login first to access this information."
        AR: "يرجى تسجيل الدخول أولاً للوصول إلى هذه المعلومات."

        4. OPPORTUNITIES / MARKETPLACE — STRICT RULE:
        → Each opportunity has a tag [Event Name] — this is the EXACT event name.
        → "Co-Matching" and "co-matching2026" are TWO COMPLETELY DIFFERENT events.
        → NEVER confuse events with similar names.
        → If user asks about "co matching 2026" or "co-matching2026" or "co matching2026":
        → show ONLY lines tagged [co-matching2026]
        → If user asks about "co matching" (without 2026):
        → show ONLY lines tagged [Co-Matching]
        → Compare the FULL exact event name — never partial match.
        → NEVER mix opportunities from different events.
        → If no opportunities found for exact event name:
        FR: "Aucune opportunité trouvée pour cet événement."
        EN: "No opportunities found for this event."

        5. NUMBER OF PARTICIPANTS:
        → Use ONLY "Accepted participants" from DATABASE DATA above.
        → NEVER confuse meetings count with participants count.
        → NEVER invent numbers not in the data.

        6. DATA ACCURACY — CRITICAL:
        → ONLY use data explicitly provided in DATABASE DATA section above.
        → If data is not in the context → say you don't have this information.
        → NEVER invent or assume data not provided.

        7. OFF-TOPIC (weather, sports, cooking, math, your identity, beach):
        FR: "Je suis uniquement l'assistant B2B Events. Je ne peux pas répondre à cette question."
        EN: "I am only the B2B Events assistant. I cannot answer this question."
        AR: "أنا مساعد B2B Events فقط. لا يمكنني الإجابة على هذا السؤال."
        → NEVER add extra sentences after refusal.

        8. PLATFORM QUESTIONS → answer directly and helpfully in user language.
        PROMPT;

            $groqMessages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ...$messages
            ];

            $response = $this->callGroq($groqMessages);

            if (!$response) {
                return $this->json([
                    'message' => 'Service IA temporairement indisponible. Veuillez réessayer.'
                ], 503);
            }

            $content = $response['choices'][0]['message']['content'] ?? '';

            return $this->json([
                'message'   => $content,
                'tool_used' => false,
            ]);

        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Une erreur est survenue. Veuillez réessayer.'
            ], 500);
        }
    }

    private function buildContext(?int $eventId, $user): string
    {
        $context = "";

        try {
            if ($user) {
                $context .= "USER INFO:\n";
                $context .= "- Name: " . ($user->getFirstName() ?? '') . " " . ($user->getLastName() ?? '') . "\n";
                $context .= "- Email: " . ($user->getEmail() ?? '') . "\n\n";

                $registrations = $this->em->getRepository(Registration::class)->findBy([
                    'user' => $user
                ]);
                $context .= "USER REGISTRATIONS (" . count($registrations) . " total):\n";
                foreach ($registrations as $reg) {
                    try {
                        $eventTitle = $reg->getEvent()?->getTitle() ?? 'N/A';
                        $context .= "- Event: " . $eventTitle
                                  . " | Status: " . ($reg->getStatus() ?? 'N/A') . "\n";
                    } catch (\Exception $e) {
                        $context .= "- Event: N/A | Status: N/A\n";
                    }
                }
                $context .= "\n";

                $allSentMeetings = $this->em->getRepository(Meeting::class)->findBy([
                    'requester' => $user,
                ]);
                $context .= "ALL SENT MEETINGS (" . count($allSentMeetings) . "):\n";
                foreach ($allSentMeetings as $m) {
                    try {
                        $eventTitle    = $m->getEvent()?->getTitle() ?? 'N/A';
                        $participantFn = $m->getParticipant()?->getFirstName() ?? '';
                        $participantLn = $m->getParticipant()?->getLastName() ?? '';
                        $context .= "- Event: " . $eventTitle
                                  . " | With: " . $participantFn . " " . $participantLn
                                  . " | Status: " . ($m->getStatus() ?? 'N/A')
                                  . " | Date: " . ($m->getProposedAt()?->format('Y-m-d H:i') ?? 'N/A')
                                  . " | Table: " . ($m->getTableNumber() ?? 'Not assigned') . "\n";
                    } catch (\Exception $e) {
                        $context .= "- Meeting data unavailable\n";
                    }
                }
                $context .= "\n";

                $allReceivedMeetings = $this->em->getRepository(Meeting::class)->findBy([
                    'participant' => $user,
                ]);
                $context .= "ALL RECEIVED MEETINGS (" . count($allReceivedMeetings) . "):\n";
                foreach ($allReceivedMeetings as $m) {
                    try {
                        $eventTitle  = $m->getEvent()?->getTitle() ?? 'N/A';
                        $requesterFn = $m->getRequester()?->getFirstName() ?? '';
                        $requesterLn = $m->getRequester()?->getLastName() ?? '';
                        $context .= "- Event: " . $eventTitle
                                  . " | From: " . $requesterFn . " " . $requesterLn
                                  . " | Status: " . ($m->getStatus() ?? 'N/A')
                                  . " | Date: " . ($m->getProposedAt()?->format('Y-m-d H:i') ?? 'N/A') . "\n";
                    } catch (\Exception $e) {
                        $context .= "- Meeting data unavailable\n";
                    }
                }
                $context .= "\n";

            } else {
                $context .= "USER: Not authenticated (visitor)\n\n";
            }

            if ($eventId) {
                $event = $this->em->getRepository(Event::class)->find($eventId);
                if ($event) {
                    try {
                        $accepted = $this->em->getRepository(Registration::class)
                            ->count(['event' => $event, 'status' => 'accepted']);
                        $pending = $this->em->getRepository(Registration::class)
                            ->count(['event' => $event, 'status' => 'pending']);
                        $rejected = $this->em->getRepository(Registration::class)
                            ->count(['event' => $event, 'status' => 'rejected']);
                        $totalMeetings = $this->em->getRepository(Meeting::class)
                            ->count(['event' => $event]);

                        $context .= "CURRENT EVENT:\n";
                        $context .= "- Title: " . ($event->getTitle() ?? 'N/A') . "\n";
                        $context .= "- Date: " . ($event->getDate()?->format('Y-m-d') ?? 'N/A') . "\n";
                        $context .= "- City: " . ($event->getCity() ?? 'N/A') . "\n";
                        $context .= "- Status: " . ($event->getStatus() ?? 'N/A') . "\n";
                        $context .= "- Max capacity: " . ($event->getMaxParticipants() ?? '?') . "\n";
                        $context .= "- Accepted participants: " . $accepted . "\n";
                        $context .= "- Pending registrations: " . $pending . "\n";
                        $context .= "- Rejected registrations: " . $rejected . "\n";
                        $context .= "- Total meetings: " . $totalMeetings . "\n";
                        $context .= "- Rooms: " . ($event->getNbRoom() ?? 0) . "\n";
                        $context .= "- Tables: " . ($event->getNbTable() ?? 0) . "\n\n";

                        $opportunities = $this->em->getRepository(Opportunity::class)
                            ->findBy(['event' => $event]);
                        $context .= "MARKETPLACE (" . count($opportunities) . " opportunities):\n";
                        foreach ($opportunities as $o) {
                            try {
                                $context .= "- " . ($o->getTitle() ?? 'N/A')
                                          . " | Type: " . ($o->getType() ?? 'N/A')
                                          . " | By: " . ($o->getUser()?->getFirstName() ?? '')
                                          . " " . ($o->getUser()?->getLastName() ?? '') . "\n";
                            } catch (\Exception $e) {
                                $context .= "- Opportunity data unavailable\n";
                            }
                        }
                        $context .= "\n";

                        try {
                            $schedules = $event->getSchedules();
                            if ($schedules && count($schedules) > 0) {
                                $context .= "AGENDA (" . count($schedules) . " sessions):\n";
                                foreach ($schedules as $s) {
                                    $context .= "- " . ($s->getTitle() ?? 'N/A')
                                              . " | Speaker: " . ($s->getSpeaker() ?? 'TBD')
                                              . " | " . ($s->getStartTime()?->format('H:i') ?? 'N/A')
                                              . " - " . ($s->getEndTime()?->format('H:i') ?? 'N/A') . "\n";
                                }
                            }
                        } catch (\Exception $e) {
                            $context .= "AGENDA: unavailable\n";
                        }

                    } catch (\Exception $e) {
                        $context .= "Event data partially unavailable\n";
                    }
                }
            } else {
                // All events avec opportunités taguées par événement
                try {
                    $events = $this->em->getRepository(Event::class)->findBy([ 'status' => 'published' ]);
                    $context .= "ALL EVENTS ON PLATFORM (" . count($events) . "):\n";
                    foreach ($events as $e) {
                        try {
                            $participantCount = $this->em->getRepository(Registration::class)
                                ->count(['event' => $e, 'status' => 'accepted']);

                            $context .= "- " . ($e->getTitle() ?? 'N/A')
                                      . " | Date: " . ($e->getDate()?->format('Y-m-d') ?? 'N/A')
                                      . " | City: " . ($e->getCity() ?? 'N/A')
                                      . " | Status: " . ($e->getStatus() ?? 'N/A')
                                      . " | Max capacity: " . ($e->getMaxParticipants() ?? '?')
                                      . " | Accepted participants: " . $participantCount . "\n";

                            $opps = $this->em->getRepository(Opportunity::class)
                                ->findBy(['event' => $e]);
                            if (count($opps) > 0) {
                                $context .= "  Opportunities for " . ($e->getTitle() ?? 'N/A')
                                          . " (" . count($opps) . "):\n";
                                foreach ($opps as $o) {
                                    $context .= "  [" . ($e->getTitle() ?? 'N/A') . "] "
                                              . ($o->getTitle() ?? 'N/A')
                                              . " | Type: " . ($o->getType() ?? 'N/A') . "\n";
                                }
                            }

                        } catch (\Exception $e2) {
                            $context .= "- Event data unavailable\n";
                        }
                    }
                } catch (\Exception $e) {
                    $context .= "Events data unavailable\n";
                }
            }

        } catch (\Exception $e) {
            $context .= "Context data temporarily unavailable\n";
        }

        return $context;
    }

    private function callGroq(array $messages): ?array
    {
        $payload = [
            'model' => $_ENV['GROQ_MODEL'] ?? 'llama-3.3-70b-versatile',
            'messages'    => $messages,
            'temperature' => 0.3,
            'max_tokens'  => 500,
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL,
            'https://api.groq.com/openai/v1/chat/completions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $_ENV['GEMINI_API_KEY'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) return null;
        return json_decode($response, true);
    }
}