<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\Registration;
use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Evenements")]
#[Route('/api/events')]
class EventController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ValidatorInterface $validator
    ) {}

    // ── Routes sans paramètre en PREMIER ──

    #[Route('', name: 'api_events_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $events = $this->em->getRepository(Event::class)->findPublishedWithDetails();
        return $this->json(array_map([$this, 'formatEvent'], $events));
    }

    #[Route('', name: 'api_events_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->getUser();

        if (!in_array('ROLE_ADMIN', $user->getRoles())) {
            return $this->json(['status' => 'error', 'message' => 'Only administrators can create events.'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $event = new Event();
        $event->setTitle($data['title'] ?? '');
        $event->setDescription($data['description'] ?? null);
        $event->setDate(isset($data['date']) ? new \DateTime($data['date']) : null);
        $event->setStartTime(isset($data['startTime']) ? new \DateTime($data['startTime']) : null);
        $event->setEndTime(isset($data['endTime']) ? new \DateTime($data['endTime']) : null);
        $event->setLocation($data['location'] ?? null);
        $event->setCity($data['city'] ?? null);
        $event->setAddress($data['address'] ?? null);
        $event->setMaxParticipants(isset($data['nbParticipants']) ? (int)$data['nbParticipants'] : null);
        $event->setNbRoom($data['nbRoom'] ?? null);
        $event->setNbTable($data['nbTable'] ?? null);
        $event->setSessionDuration($data['sessionDuration'] ?? null);
        $event->setCategories($data['categories'] ?? null);
        $event->setEventType($data['eventType'] ?? null);
        $event->setOrganiserEmail($data['organiserEmail'] ?? null);
        $event->setOrganiserPhone($data['organiserPhone'] ?? null);
        $event->setOrganiserName($data['organiserName'] ?? null);
        $event->setAreasOfActivity($data['areasOfActivity'] ?? null);
        $event->setTargets($data['targets'] ?? null);
        $event->setSponsors($data['sponsors'] ?? null);
        $event->setEventBanner($data['eventBanner'] ?? null);
        $event->setStatus($data['status'] ?? 'draft');
        $event->setOrganizer($user);

        $errors = $this->validator->validate($event);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['status' => 'error', 'errors' => $errorMessages], 400);
        }

        $this->em->persist($event);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Event created successfully!',
            'event' => $this->formatEvent($event)
        ], 201);
    }

    // ── Routes avec préfixe /my/ en DEUXIÈME ──

    #[Route('/my/organized', name: 'api_events_my_organized', methods: ['GET'])]
    public function myOrganized(): JsonResponse
    {
        $events = $this->em->getRepository(Event::class)->findByOrganizerWithDetails($this->getUser());
        return $this->json(array_map([$this, 'formatEvent'], $events));
    }

    #[Route('/my/registrations', name: 'api_events_my_registrations', methods: ['GET'])]
    public function myRegistrations(): JsonResponse
    {
        $registrations = $this->em->getRepository(Registration::class)->findBy(
            ['user' => $this->getUser()],
            ['registeredAt' => 'DESC']
        );
        return $this->json(array_map(fn($r) => [
            'id' => $r->getId(),
            'status' => $r->getStatus(),
            'registeredAt' => $r->getRegisteredAt()?->format('Y-m-d H:i:s'),
            'event' => $this->formatEvent($r->getEvent()),
        ], $registrations));
    }

    // ── Routes avec {id} en DERNIER ──

    #[Route('/{id}', name: 'api_events_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->findOneWithDetails($id);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }
        return $this->json($this->formatEvent($event, true));
    }

    #[Route('/{id}', name: 'api_events_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(Request $request, int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Evenement non trouve.'], 404);
        }
        if ($event->getOrganizer() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['title'])) $event->setTitle($data['title']);
        if (isset($data['description'])) $event->setDescription($data['description']);
        if (isset($data['date'])) $event->setDate(new \DateTime($data['date']));
        if (isset($data['startTime'])) $event->setStartTime(new \DateTime($data['startTime']));
        if (isset($data['endTime'])) $event->setEndTime(new \DateTime($data['endTime']));
        if (isset($data['location'])) $event->setLocation($data['location']);
        if (isset($data['city'])) $event->setCity($data['city']);
        if (isset($data['address'])) $event->setAddress($data['address']);
        if (isset($data['nbParticipants'])) $event->setMaxParticipants((int)$data['nbParticipants']);
        if (isset($data['nbRoom'])) $event->setNbRoom($data['nbRoom']);
        if (isset($data['nbTable'])) $event->setNbTable($data['nbTable']);
        if (isset($data['sessionDuration'])) $event->setSessionDuration($data['sessionDuration']);
        if (isset($data['categories'])) $event->setCategories($data['categories']);
        if (isset($data['eventType'])) $event->setEventType($data['eventType']);
        if (isset($data['eventBanner'])) $event->setEventBanner($data['eventBanner']);
        if (isset($data['targets'])) $event->setTargets($data['targets']);
        if (isset($data['sponsors'])) $event->setSponsors($data['sponsors']);
        if (isset($data['status'])) $event->setStatus(strtolower($data['status']));

        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Event updated!',
            'event' => $this->formatEvent($event)
        ]);
    }

    #[Route('/{id}', name: 'api_events_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }
        if ($event->getOrganizer() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }
        $this->em->remove($event);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Event deleted!']);
    }

    #[Route('/{id}/register', name: 'api_events_register', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function register(Request $request, int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }

        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $existing = $this->em->getRepository(Registration::class)
            ->findOneBy(['user' => $user, 'event' => $event]);

        if ($existing && $existing->getStatus() !== 'rejected') {
            return $this->json(['message' => 'Already registered.'], 409);
        }

        if ($existing && $existing->getStatus() === 'rejected') {
            $this->em->remove($existing);
            $this->em->flush();
        }

        $registration = new Registration();
        $registration->setUser($user);
        $registration->setEvent($event);
        $registration->setStatus('pending');
        $registration->setParticipationType($data['participationType'] ?? null);
        $this->em->persist($registration);

        $notification = new Notification();
        $notification->setUser($event->getOrganizer());
        $notification->setTitle('New Registration');
        $notification->setMessage(
            $user->getFirstName() . ' ' . $user->getLastName() .
            ' wants to participate in: ' . $event->getTitle() .
            ($data['participationType'] ? ' (Type: ' . $data['participationType'] . ')' : '')
        );
        $notification->setType('REGISTRATION_PENDING');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Registration submitted!'], 201);
    }

    #[Route('/{id}/participants', name: 'api_event_participants', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function eventParticipants(int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
        return $this->json(['message' => 'Event not found.'], 404);
        }

        $registrations = $this->em->getRepository(Registration::class)->findBy([
            'event' => $event,
            'status' => 'accepted',
        ]);

        $participants = array_map(fn($r) => [
            'id' => $r->getUser()->getId(),
            'firstName' => $r->getUser()->getFirstName(),
            'lastName' => $r->getUser()->getLastName(),
            'fullName' => $r->getUser()->getFirstName() . ' ' . $r->getUser()->getLastName(),
            'email' => $r->getUser()->getEmail(),
            'userRole' => $r->getUser()->getUserRole(),
            'bio' => $r->getUser()->getBio(),
            'company' => $r->getUser()->getUserRole() === 'ROLE_ENTREPRENEUR' ? 'Entrepreneur' : 'Investisseur',
            'country' => $r->getUser()->getCountry() ?? 'Tunisie',
        ], $registrations);

        return $this->json($participants);
    }

    /*#[Route('/{id}/checkin-token', name: 'api_event_checkin_token', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function checkinToken(int $id, Request $request): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }

        $token = base64_encode('checkin_' . $id . '_' . md5($id . 'b2b_secret_key'));

        $host = $request->getSchemeAndHttpHost();
        $frontendUrl = str_replace(':8081', ':3000', $host);

        return $this->json([
            'eventTitle' => $event->getTitle(),
            'checkinUrl' => $frontendUrl . '/checkin?token=' . urlencode($token),
            'token' => $token,
        ]);
    }

    #[Route('/{id}/checkin', name: 'api_event_checkin', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function checkin(int $id, Request $request): \Symfony\Component\HttpFoundation\Response
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return new \Symfony\Component\HttpFoundation\Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px">
                <h2>❌ Event not found.</h2></body></html>',
                404, ['Content-Type' => 'text/html']
            );
        }

        $token = $request->query->get('token');
        $expectedToken = base64_encode('checkin_event_' . $id . '_' . $event->getTitle());

        if (!$token || urldecode($token) !== $expectedToken) {
            return new \Symfony\Component\HttpFoundation\Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px">
                <h2>❌ Invalid QR Code.</h2></body></html>',
                401, ['Content-Type' => 'text/html']
            );
        }

        $user = $this->getUser();
        if (!$user) {
            // Redirige vers le login React avec redirect vers checkin
            $loginUrl = 'http://' . $request->getHost() . ':3000/login?redirect=' 
                . urlencode('/api/events/' . $id . '/checkin?token=' . $token);
            return new \Symfony\Component\HttpFoundation\Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px">
                <h2>B2B Events — Check-in</h2>
                <p style="color:#64748b">' . $event->getTitle() . '</p>
                <p>Please login to check in.</p>
                <a href="' . $loginUrl . '" 
                style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);
                        color:white;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">
                    Login to Check In
                </a>
                </body></html>',
                200, ['Content-Type' => 'text/html']
            );
        }

        // Vérifie inscription acceptée — status MAJUSCULES dans ton entité
        $registration = $this->em->getRepository(Registration::class)->findOneBy([
            'user' => $user,
            'event' => $event,
            'status' => 'accepted', // ← ton controller utilise minuscules
        ]);

        if (!$registration) {
            return new \Symfony\Component\HttpFoundation\Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#fff5f5">
                <h2 style="color:#ef4444">❌ Check-in Failed</h2>
                <p>Hello <strong>' . $user->getFirstName() . '</strong>,</p>
                <p>You are not registered or accepted for this event.</p>
                <p style="color:#64748b">' . $event->getTitle() . '</p>
                </body></html>',
                200, ['Content-Type' => 'text/html']
            );
        }

        if ($registration->isCheckedIn()) {
            return new \Symfony\Component\HttpFoundation\Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#fef3c7">
                <h2 style="color:#d97706">⚠️ Already Checked In</h2>
                <p>Hello <strong>' . $user->getFirstName() . ' ' . $user->getLastName() . '</strong>!</p>
                <p style="color:#64748b">You already checked in at ' 
                    . $registration->getCheckedInAt()?->format('H:i') . '</p>
                </body></html>',
                200, ['Content-Type' => 'text/html']
            );
        }

        // ✅ Check-in réussi
        $registration->setCheckedIn(true);
        $registration->setCheckedInAt(new \DateTimeImmutable());
        $this->em->flush();

        return new \Symfony\Component\HttpFoundation\Response(
            '<html><body style="font-family:sans-serif;text-align:center;padding:40px;background:#f0fdf4">
            <div style="max-width:400px;margin:0 auto">
                <div style="font-size:4rem;margin-bottom:16px">✅</div>
                <h2 style="color:#059669;margin-bottom:8px">Check-in Successful!</h2>
                <p style="font-size:1.1rem;font-weight:700;color:#1a1a2e">
                    Welcome, ' . $user->getFirstName() . ' ' . $user->getLastName() . '!
                </p>
                <p style="color:#64748b;margin-bottom:4px">' . $event->getTitle() . '</p>
                <p style="color:#94a3b8;font-size:13px">
                    Checked in at ' . (new \DateTime())->format('H:i') . '
                </p>
                <div style="margin-top:24px;padding:16px;background:white;border-radius:12px;
                            border:2px solid #d1fae5">
                    <div style="color:#059669;font-weight:800;font-size:1.5rem">🎉</div>
                    <div style="color:#64748b;font-size:13px">Enjoy the event!</div>
                </div>
            </div>
            </body></html>',
            200, ['Content-Type' => 'text/html']
        );
    }

    #[Route('/{id}/checkins', name: 'api_event_checkins', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function checkins(int $id): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }

        $registrations = $this->em->getRepository(Registration::class)->findBy([
            'event' => $event,
            'checkedIn' => true,
        ]);

        return $this->json([
            'checkins' => array_map(fn($r) => [
                'user' => [
                    'id' => $r->getUser()->getId(),
                    'firstName' => $r->getUser()->getFirstName(),
                    'lastName' => $r->getUser()->getLastName(),
                    'email' => $r->getUser()->getEmail(),
                ],
                'checkedInAt' => $r->getCheckedInAt()?->format('H:i'),
            ], $registrations),
        ]);
    }*/

    private function formatEvent(Event $event, bool $withDetails = false): array
    {
        $data = [
            'id' => $event->getId(),
            'title' => $event->getTitle(),
            'description' => $event->getDescription(),
            'date' => $event->getDate()?->format('Y-m-d'),
            'endDate' => $event->getEndTime()?->format('Y-m-d'),
            'startTime' => $event->getStartTime()?->format('H:i'),
            'endTime' => $event->getEndTime()?->format('H:i'),
            'location' => $event->getLocation(),
            'city' => $event->getCity(),
            'address' => $event->getAddress(),
            'nbParticipants' => $event->getMaxParticipants(),
            /*'nbInscrits' => count(array_filter(
                $event->getRegistrations()->toArray(),
                fn($r) => $r->getStatus() === 'accepted'
            )),*/
            'nbInscrits' => $this->em->getRepository(Registration::class)
                ->count(['event' => $event, 'status' => 'accepted']),
            'nbRoom' => $event->getNbRoom(),
            'nbTable' => $event->getNbTable(),
            'sessionDuration' => $event->getSessionDuration(),
            'categories' => $event->getCategories(),
            'eventType' => $event->getEventType(),
            'eventBanner' => $event->getEventBanner(),
            'targets' => $event->getTargets(),
            'sponsors' => $event->getSponsors(),
            'status' => ($event->getStatus() === 'published' && $event->getDate() < new \DateTime()) 
                ? 'closed' 
                : $event->getStatus(),
            'organizer' => [
                'id' => $event->getOrganizer()->getId(),
                'firstName' => $event->getOrganizer()->getFirstName(),
                'lastName' => $event->getOrganizer()->getLastName(),
            ],
            'organisers' => array_map(fn($o) => [
                'id' => $o->getId(),
                'name' => $o->getName(),
                'email' => $o->getEmail(),
                'phone' => $o->getPhone(),
                'logo' => $o->getLogo(),
            ], $event->getOrganisers()->toArray()),
            'pages' => array_map(fn($p) => [
                'id' => $p->getId(),
                'name' => $p->getName(),
                'content' => $p->getContent(),
                'isActive' => $p->isActive(),
                'position' => $p->getPosition(),
            ], $event->getPages()->toArray()),
            'createdAt' => $event->getCreatedAt()?->format('Y-m-d H:i:s'),
        ];

        if ($withDetails) {
            $data['schedules'] = array_map(fn($s) => [
                'id' => $s->getId(),
                'title' => $s->getTitle(),
                'startTime' => $s->getStartTime()?->format('Y-m-d H:i'),
                'endTime' => $s->getEndTime()?->format('Y-m-d H:i'),
                'speaker' => $s->getSpeaker(),
                'description' => $s->getDescription(),
                'position' => $s->getPosition(),
            ], $event->getSchedules()->toArray());
        }

        return $data;
    }
}