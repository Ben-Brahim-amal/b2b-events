<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Event;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Administration")]
#[Route('/api/admin')]
class AdminController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/users', name: 'api_admin_users', methods: ['GET'])]
    public function users(): JsonResponse
    {
        $users = $this->em->getRepository(User::class)->findBy([], ['createdAt' => 'DESC']);
        return $this->json(array_map(fn($u) => [
            'id' => $u->getId(),
            'email' => $u->getEmail(),
            'firstName' => $u->getFirstName(),
            'lastName' => $u->getLastName(),
            'userRole' => $u->getUserRole(),
            'roles' => $u->getRoles(),
            'createdAt' => $u->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $users));
    }

    #[Route('/users/{id}', name: 'api_admin_delete_user', methods: ['DELETE'])]
    public function deleteUser(User $user): JsonResponse
    {
        $this->em->remove($user);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Utilisateur supprime.']);
    }

    #[Route('/users/{id}/role', name: 'api_admin_update_role', methods: ['PUT'])]
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (isset($data['userRole'])) $user->setUserRole($data['userRole']);
        if (isset($data['roles'])) $user->setRoles($data['roles']);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Role mis a jour.']);
    }

    #[Route('/events', name: 'api_admin_events', methods: ['GET'])]
    public function events(): JsonResponse
    {
        $events = $this->em->getRepository(Event::class)->findBy([], ['createdAt' => 'DESC']);
        return $this->json(array_map(fn($e) => [
            'id' => $e->getId(),
            'title' => $e->getTitle(),
            'date' => $e->getDate()?->format('Y-m-d'),
            'city' => $e->getCity(),
            'status' => $e->getStatus(),
            'nbInscrits' => count($e->getRegistrations()),
            'nbParticipants' => $e->getMaxParticipants(),
            'organizer' => [
                'id' => $e->getOrganizer()->getId(),
                'firstName' => $e->getOrganizer()->getFirstName(),
                'lastName' => $e->getOrganizer()->getLastName(),
            ],
        ], $events));
    }

    #[Route('/events/{id}', name: 'api_admin_delete_event', methods: ['DELETE'])]
    public function deleteEvent(Event $event): JsonResponse
    {
        $this->em->remove($event);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Evenement supprime.']);
    }
}