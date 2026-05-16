<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\EventSchedule;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[OA\Tag(name: "Planning")]
#[Route('/api/events/{eventId}/schedules')]
class EventScheduleController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('', name: 'api_schedules_list', methods: ['GET'])]
    public function index(int $eventId): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($eventId);
        if (!$event) return $this->json(['message' => 'Event not found.'], 404);

        $schedules = array_map(fn($s) => $this->formatSchedule($s), $event->getSchedules()->toArray());
        usort($schedules, fn($a, $b) => $a['position'] - $b['position']);

        return $this->json($schedules);
    }

    #[Route('', name: 'api_schedules_create', methods: ['POST'])]
    public function create(Request $request, int $eventId): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($eventId);
        if (!$event) return $this->json(['message' => 'Event not found.'], 404);

        if ($event->getOrganizer() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $data = json_decode($request->getContent(), true);

        $errors = [];
        if (empty($data['title'])) $errors[] = 'Title is required.';
        if (empty($data['startTime'])) $errors[] = 'Start time is required.';
        if (empty($data['endTime'])) $errors[] = 'End time is required.';
        if (!empty($errors)) return $this->json(['status' => 'error', 'errors' => $errors], 400);

        $schedule = new EventSchedule();
        $schedule->setTitle($data['title']);
        $schedule->setStartTime(new \DateTime($data['startTime']));
        $schedule->setEndTime(new \DateTime($data['endTime']));
        $schedule->setDescription($data['description'] ?? null);
        $schedule->setSpeaker($data['speaker'] ?? null);
        $schedule->setPosition($data['position'] ?? 0);
        $schedule->setEvent($event);

        $this->em->persist($schedule);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Schedule created successfully!',
            'schedule' => $this->formatSchedule($schedule)
        ], 201);
    }

    #[Route('/{id}', name: 'api_schedules_update', methods: ['PUT'])]
    public function update(Request $request, int $eventId, EventSchedule $schedule): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($eventId);
        if (!$event || $event->getOrganizer() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['title'])) $schedule->setTitle($data['title']);
        if (isset($data['startTime'])) $schedule->setStartTime(new \DateTime($data['startTime']));
        if (isset($data['endTime'])) $schedule->setEndTime(new \DateTime($data['endTime']));
        if (isset($data['description'])) $schedule->setDescription($data['description']);
        if (isset($data['speaker'])) $schedule->setSpeaker($data['speaker']);
        if (isset($data['position'])) $schedule->setPosition($data['position']);

        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Schedule updated successfully!',
            'schedule' => $this->formatSchedule($schedule)
        ]);
    }

    #[Route('/{id}', name: 'api_schedules_delete', methods: ['DELETE'])]
    public function delete(int $eventId, EventSchedule $schedule): JsonResponse
    {
        $event = $this->em->getRepository(Event::class)->find($eventId);
        if (!$event || $event->getOrganizer() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $this->em->remove($schedule);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Schedule deleted successfully!']);
    }

    private function formatSchedule(EventSchedule $s): array
    {
        return [
            'id' => $s->getId(),
            'title' => $s->getTitle(),
            'startTime' => $s->getStartTime()?->format('H:i'),
            'endTime' => $s->getEndTime()?->format('H:i'),
            'description' => $s->getDescription(),
            'speaker' => $s->getSpeaker(),
            'position' => $s->getPosition(),
        ];
    }
}