<?php

namespace App\Controller;

use App\Entity\Registration;
use App\Entity\Event;
use App\Entity\Meeting;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/matchmaking')]
class MatchmakingController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    #[Route('/{eventId}', name: 'api_matchmaking', methods: ['GET'])]
    public function getMatches(int $eventId): JsonResponse
    {
        $user = $this->getUser();
        $event = $this->em->getRepository(Event::class)->find($eventId);

        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }

        $registrations = $this->em->getRepository(Registration::class)->findBy([
            'event' => $event,
            'status' => 'accepted',
        ]);

        if (count($registrations) < 2) {
            return $this->json(['message' => 'Not enough participants.', 'matches' => []]);
        }

        // Meetings déjà existants pour cet utilisateur dans cet event
        $existingMeetings = $this->em->getRepository(Meeting::class)->findBy(['event' => $event]);
        $alreadyMet = [];
        foreach ($existingMeetings as $m) {
            if ($m->getRequester()->getId() === $user->getId()) {
                $alreadyMet[] = $m->getParticipant()->getId();
            }
            if ($m->getParticipant()->getId() === $user->getId()) {
                $alreadyMet[] = $m->getRequester()->getId();
            }
        }

        // Profil enrichi de l'utilisateur connecté
        $currentUserProfile = [
            'id' => $user->getId(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'role' => $user->getUserRole() ?? '',
            'bio' => $user->getBio() ?? '',
            'country' => $user->getCountry() ?? '',
            'organisation' => $user->getCompanyName() ?? '',
            'organisationType' => $user->getOrganisationType() ?? '',
            'sector' => $user->getSector() ?? '',
            'sectors' => $user->getSectors() ?? [],
            'companySize' => $user->getCompanySize() ?? '',
            'businessObjectives' => $user->getBusinessObjectives() ?? [],
        ];

        // Profils enrichis des autres participants
        $otherParticipants = [];
        foreach ($registrations as $reg) {
            $p = $reg->getUser();
            if ($p->getId() === $user->getId()) continue;
            $otherParticipants[] = [
                'id' => $p->getId(),
                'firstName' => $p->getFirstName(),
                'lastName' => $p->getLastName(),
                'role' => $p->getUserRole() ?? '',
                'bio' => $p->getBio() ?? '',
                'country' => $p->getCountry() ?? '',
                'organisation' => $p->getCompanyName() ?? '',
                'organisationType' => $p->getOrganisationType() ?? '',
                'sector' => $p->getSector() ?? '',
                'sectors' => $p->getSectors() ?? [],
                'companySize' => $p->getCompanySize() ?? '',
                'businessObjectives' => $p->getBusinessObjectives() ?? [],
                'alreadyMet' => in_array($p->getId(), $alreadyMet),
            ];
        }

        if (empty($otherParticipants)) {
            return $this->json(['message' => 'No other participants found.', 'matches' => []]);
        }

        // Cible de l'event
        $eventTargets = $event->getTargets() ?? [];

        $prompt = $this->buildPrompt($currentUserProfile, $otherParticipants, $event->getTitle(), $eventTargets);

        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://api.groq.com/openai/v1/chat/completions');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
                'model' => $_ENV['GROQ_MODEL'] ?? 'llama-3.3-70b-versatile',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are an expert B2B matchmaking AI. You analyze business profiles and find the best matches based on complementary roles, sectors, business objectives and synergies. Always respond with valid JSON only.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'temperature' => 0.2,
                'max_tokens' => 1500,
            ]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $_ENV['GEMINI_API_KEY']
            ]);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                return $this->json([
                    'message' => 'AI service unavailable.',
                    'matches' => []
                ], 503);
            }

            $data = json_decode($response, true);
            $text = $data['choices'][0]['message']['content'] ?? '';
            $text = preg_replace('/```json\s*|\s*```/', '', $text);
            $matches = json_decode(trim($text), true);

            if (!$matches || !is_array($matches)) {
                return $this->json(['message' => 'Could not parse AI response.', 'matches' => []], 500);
            }

            // Enrichir les matches avec les vrais profils
            $enrichedMatches = [];
            foreach ($matches as $match) {
                $participant = array_filter($otherParticipants, fn($p) => $p['id'] === ($match['id'] ?? 0));
                $participant = reset($participant);
                if ($participant) {
                    $enrichedMatches[] = [
                        'id' => $match['id'],
                        'firstName' => $participant['firstName'],
                        'lastName' => $participant['lastName'],
                        'role' => $participant['role'],
                        'organisation' => $participant['organisation'],
                        'organisationType' => $participant['organisationType'],
                        'sector' => $participant['sector'],
                        'country' => $participant['country'],
                        'sectors' => $participant['sectors'],
                        'companySize' => $participant['companySize'],
                        'businessObjectives' => $participant['businessObjectives'],
                        'score' => $match['score'] ?? 0,
                        'reason' => $match['reason'] ?? '',
                        'synergy' => $match['synergy'] ?? '',
                        'alreadyMet' => $participant['alreadyMet'],
                    ];
                }
            }

            // Trier par score décroissant
            usort($enrichedMatches, fn($a, $b) => $b['score'] - $a['score']);

            return $this->json([
                'status' => 'success',
                'currentUser' => $currentUserProfile,
                'matches' => $enrichedMatches,
                'event' => $event->getTitle(),
                'eventTargets' => $eventTargets,
            ]);

        } catch (\Exception $e) {
            return $this->json(['message' => 'Error: ' . $e->getMessage(), 'matches' => []], 500);
        }
    }

    private function buildPrompt(array $currentUser, array $participants, string $eventTitle, array $eventTargets): string
    {
        $participantsJson = json_encode($participants, JSON_PRETTY_PRINT);
        $sectorsStr = !empty($currentUser['sectors']) ? implode(', ', $currentUser['sectors']) : 'Not specified';
        $eventTargetsStr = !empty($eventTargets) ? implode(', ', $eventTargets) : 'General B2B';
        $objectivesStr = !empty($currentUser['businessObjectives']) ? implode(', ', $currentUser['businessObjectives']) : 'Not specified';

        return "You are an expert B2B matchmaking AI for the event: \"{$eventTitle}\".
Event target sectors: {$eventTargetsStr}

CURRENT USER PROFILE:
- Name: {$currentUser['firstName']} {$currentUser['lastName']}
- Business Role: {$currentUser['role']}
- Organisation Type: {$currentUser['organisationType']}
- Bio: {$currentUser['bio']}
- Country: {$currentUser['country']}
- Organisation: {$currentUser['organisation']}
- Company Size: {$currentUser['companySize']}
- Sector: {$currentUser['sector']}
- Sectors of interest: {$sectorsStr}
- Business Objectives: {$objectivesStr}

OTHER PARTICIPANTS:
{$participantsJson}

MATCHING CRITERIA (in order of importance):
1. BUSINESS OBJECTIVES ALIGNMENT: if current user wants \"Find investors\" → prioritize INVESTISSEUR; if \"Find partners\" → prioritize complementary roles (highest priority)
2. SECTOR ALIGNMENT: matching or complementary sectors between users
3. ROLE COMPLEMENTARITY: ENTREPRENEUR ↔ INVESTISSEUR, ORGANIZER ↔ ENTREPRENEUR
4. ORGANISATION TYPE: Company ↔ Start-up (investment), University ↔ Company (R&D), Association ↔ Company (partnership)
5. GEOGRAPHIC SYNERGY: same country or region = easier collaboration
6. BIO KEYWORDS: shared interests, technologies, or markets mentioned in bio
7. ALREADY MET: deprioritize participants where alreadyMet=true (score -20)

INSTRUCTIONS:
- Find the TOP 5 best matches
- Give a score from 0 to 100
- Explain the match reason in max 20 words mentioning sector or objective
- Add a one-word synergy type: INVESTMENT, PARTNERSHIP, COLLABORATION, MENTORING, or NETWORKING
- Return ONLY valid JSON, no explanation, no markdown

REQUIRED FORMAT:
[
  {
    \"id\": 123,
    \"score\": 92,
    \"reason\": \"Investor seeking fintech startups matches your payment solution perfectly\",
    \"synergy\": \"INVESTMENT\"
  }
]";
    }
}