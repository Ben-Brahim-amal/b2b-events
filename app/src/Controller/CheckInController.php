<?php

namespace App\Controller;

use App\Entity\Registration;
use App\Entity\Event;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class CheckInController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    // Générer le token QR pour un événement
    #[Route('/events/{id}/checkin-token', name: 'api_event_checkin_token', methods: ['GET'])]
    public function getCheckinToken(int $id, Request $request): JsonResponse
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
            'token' => $token,
            'eventId' => $id,
            'eventTitle' => $event->getTitle(),
            'checkinUrl' => $frontendUrl . '/checkin?token=' . urlencode($token),
        ]);
    }
    // Check-in d'un participant
    #[Route('/checkin', name: 'api_checkin', methods: ['POST'])]
    public function checkIn(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $token = $data['token'] ?? '';
        $userId = $this->getUser()->getId();

        // Décoder le token pour récupérer l'eventId
        $decoded = base64_decode($token);
        if (!preg_match('/^checkin_(\d+)_/', $decoded, $matches)) {
            return $this->json(['message' => 'Invalid QR Code.'], 400);
        }

        $eventId = (int)$matches[1];
        $expectedToken = base64_encode('checkin_' . $eventId . '_' . md5($eventId . 'b2b_secret_key'));

        if ($token !== $expectedToken) {
            return $this->json(['message' => 'Invalid or expired QR Code.'], 400);
        }

        $event = $this->em->getRepository(Event::class)->find($eventId);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }

        // Vérifier inscription acceptée
        $registration = $this->em->getRepository(Registration::class)->findOneBy([
            'user' => $this->getUser(),
            'event' => $event,
            'status' => 'accepted',
        ]);

        if (!$registration) {
            return $this->json([
                'message' => 'You are not registered for this event.',
                'success' => false,
            ], 403);
        }

        // Déjà checké ?
        if ($registration->isCheckedIn()) {
            return $this->json([
                'message' => 'You have already checked in!',
                'success' => false,
                'checkedInAt' => $registration->getCheckedInAt()->format('Y-m-d H:i'),
                'eventTitle' => $event->getTitle(),
            ]);
        }

        // Marquer comme présent
        $registration->setCheckedIn(true);
        $registration->setCheckedInAt(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Check-in successful! Welcome to ' . $event->getTitle(),
            'eventTitle' => $event->getTitle(),
            'checkedInAt' => $registration->getCheckedInAt()->format('Y-m-d H:i'),
            'user' => [
                'firstName' => $this->getUser()->getFirstName(),
                'lastName' => $this->getUser()->getLastName(),
            ]
        ]);
    }

    // Liste des présents pour un événement
    #[Route('/events/{id}/checkins', name: 'api_event_checkins', methods: ['GET'])]
    public function getCheckins(int $id): JsonResponse
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
            'eventTitle' => $event->getTitle(),
            'total' => count($registrations),
            'checkins' => array_map(fn($r) => [
                'id' => $r->getId(),
                'user' => [
                    'firstName' => $r->getUser()->getFirstName(),
                    'lastName' => $r->getUser()->getLastName(),
                    'email' => $r->getUser()->getEmail(),
                    'userRole' => $r->getUser()->getUserRole(),
                ],
                'checkedInAt' => $r->getCheckedInAt()->format('Y-m-d H:i'),
            ], $registrations),
        ]);
    }
}