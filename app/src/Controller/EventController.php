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
            return $this->json(['status' => 'error', 'message' => 'Seul l\'administrateur peut créer des événements.'], 403);
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
            'message' => 'Événement créé avec succès !',
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
            return $this->json(['message' => 'Evenement non trouve.'], 404);
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
            return $this->json(['message' => 'Acces refuse.'], 403);
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
            'message' => 'Evenement modifie !',
            'event' => $this->formatEvent($event)
        ]);
    }

    #[Route('/{id}', name: 'api_events_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Evenement non trouve.'], 404);
        }
        if ($event->getOrganizer() !== $this->getUser()) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }
        $this->em->remove($event);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Evenement supprime !']);
    }

    #[Route('/{id}/register', name: 'api_events_register', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function register(Request $request, int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Evenement non trouve.'], 404);
        }

        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $existing = $this->em->getRepository(Registration::class)
            ->findOneBy(['user' => $user, 'event' => $event]);

        if ($existing && $existing->getStatus() !== 'rejected') {
            return $this->json(['message' => 'Deja inscrit.'], 409);
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
        $notification->setTitle('Nouvelle inscription');
        $notification->setMessage(
            $user->getFirstName() . ' ' . $user->getLastName() .
            ' souhaite participer a : ' . $event->getTitle() .
            ($data['participationType'] ? ' (Type: ' . $data['participationType'] . ')' : '')
        );
        $notification->setType('REGISTRATION_PENDING');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Inscription envoyee !'], 201);
    }

    #[Route('/{id}/participants', name: 'api_event_participants', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function eventParticipants(int $id): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($id);
        if (!$event) {
            return $this->json(['message' => 'Evenement non trouve.'], 404);
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
            'nbInscrits' => count(array_filter(
                $event->getRegistrations()->toArray(),
                fn($r) => $r->getStatus() === 'accepted'
            )),
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