<?php

namespace App\Controller;

use App\Entity\Registration;
use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Inscriptions")]
#[Route('/api/registrations')]
class RegistrationController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/{id}/accept', name: 'api_registration_accept', methods: ['PUT'])]
    public function accept(Registration $registration): JsonResponse
    {
        $registration->setStatus('accepted');
        $this->em->flush();

        $notification = new Notification();
        $notification->setUser($registration->getUser());
        $notification->setTitle('Inscription acceptee !');
        $notification->setMessage('Votre inscription a "' . $registration->getEvent()->getTitle() . '" a ete acceptee.');
        $notification->setType('REGISTRATION_ACCEPTED');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Inscription acceptee.']);
    }

    #[Route('/{id}/reject', name: 'api_registration_reject', methods: ['PUT'])]
    public function reject(Registration $registration): JsonResponse
    {
        $registration->setStatus('rejected');
        $this->em->flush();

        $notification = new Notification();
        $notification->setUser($registration->getUser());
        $notification->setTitle('Inscription refusee');
        $notification->setMessage('Votre inscription a "' . $registration->getEvent()->getTitle() . '" a ete refusee.');
        $notification->setType('REGISTRATION_REJECTED');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Inscription refusee.']);
    }

    #[Route('', name: 'api_registrations_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $user = $this->getUser();
        $events = $this->em->getRepository(\App\Entity\Event::class)->findBy(['organizer' => $user]);

        $registrations = [];
        foreach ($events as $event) {
            foreach ($event->getRegistrations() as $reg) {
                $registrations[] = [
                    'id' => $reg->getId(),
                    'status' => $reg->getStatus(),
                    'registeredAt' => $reg->getRegisteredAt()?->format('Y-m-d H:i:s'),
                    'user' => [
                        'id' => $reg->getUser()->getId(),
                        'firstName' => $reg->getUser()->getFirstName(),
                        'lastName' => $reg->getUser()->getLastName(),
                        'email' => $reg->getUser()->getEmail(),
                        'userRole' => $reg->getUser()->getUserRole(),
                    ],
                    'event' => [
                        'id' => $event->getId(),
                        'title' => $event->getTitle(),
                    ],
                ];
            }
        }

        return $this->json($registrations);
    }
}