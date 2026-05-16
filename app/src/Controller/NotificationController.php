<?php

namespace App\Controller;

use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Notifications")]
#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $notifications = $this->em->getRepository(Notification::class)
            ->findUserNotifications($this->getUser());

        return $this->json(array_map(fn($n) => [
            'id' => $n->getId(),
            'title' => $n->getTitle(),
            'message' => $n->getMessage(),
            'type' => $n->getType(),
            'isRead' => $n->isRead(),
            'createdAt' => $n->getCreatedAt()?->format('Y-m-d H:i:s'),
        ], $notifications));
    }

    #[Route('/unread-count', name: 'api_notifications_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $count = $this->em->getRepository(Notification::class)
            ->countUnread($this->getUser());
        return $this->json(['count' => $count]);
    }

    #[Route('/{id}/read', name: 'api_notifications_read', methods: ['PUT'])]
    public function markAsRead(Notification $notification): JsonResponse
    {
        if ($notification->getUser() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }
        $notification->setIsRead(true);
        $this->em->flush();
        return $this->json(['status' => 'success']);
    }

    #[Route('/read-all', name: 'api_notifications_read_all', methods: ['PUT'])]
    public function markAllAsRead(): JsonResponse
    {
        $notifications = $this->em->getRepository(Notification::class)->findBy([
            'user' => $this->getUser(),
            'isRead' => false
        ]);
        foreach ($notifications as $n) {
            $n->setIsRead(true);
        }
        $this->em->flush();
        return $this->json(['status' => 'success']);
    }
}