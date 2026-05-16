<?php

namespace App\Controller;

use App\Entity\Event;
use App\Entity\EventPage;
use App\Entity\EventOrganiser;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Pages et Organisateurs")]
#[Route('/api/events')]
class EventPageController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/{id}/pages', name: 'api_event_pages_list', methods: ['GET'])]
    public function listPages(Event $event): JsonResponse
    {
        $pages = array_map(fn($p) => [
            'id' => $p->getId(),
            'name' => $p->getName(),
            'content' => $p->getContent(),
            'isActive' => $p->isActive(),
            'position' => $p->getPosition(),
        ], $event->getPages()->toArray());

        usort($pages, fn($a, $b) => $a['position'] - $b['position']);
        return $this->json($pages);
    }

    #[Route('/{id}/pages', name: 'api_event_pages_create', methods: ['POST'])]
    public function createPage(Request $request, Event $event): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $page = new EventPage();
        $page->setName($data['name'] ?? '');
        $page->setContent($data['content'] ?? null);
        $page->setIsActive($data['isActive'] ?? true);
        $page->setPosition($data['position'] ?? 0);
        $page->setEvent($event);

        $this->em->persist($page);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'page' => [
                'id' => $page->getId(),
                'name' => $page->getName(),
                'content' => $page->getContent(),
                'isActive' => $page->isActive(),
                'position' => $page->getPosition(),
            ]
        ], 201);
    }

    #[Route('/{eventId}/pages/{id}', name: 'api_event_pages_update', methods: ['PUT'])]
    public function updatePage(Request $request, int $eventId, EventPage $page): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        if (isset($data['name'])) $page->setName($data['name']);
        if (isset($data['content'])) $page->setContent($data['content']);
        if (isset($data['isActive'])) $page->setIsActive($data['isActive']);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Page mise a jour.']);
    }

    #[Route('/{eventId}/pages/{id}', name: 'api_event_pages_delete', methods: ['DELETE'])]
    public function deletePage(int $eventId, EventPage $page): JsonResponse
    {
        $this->em->remove($page);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Page supprimee.']);
    }

    #[Route('/{id}/organisers', name: 'api_event_organisers_list', methods: ['GET'])]
    public function listOrganisers(Event $event): JsonResponse
    {
        return $this->json(array_map(fn($o) => [
            'id' => $o->getId(),
            'name' => $o->getName(),
            'email' => $o->getEmail(),
            'phone' => $o->getPhone(),
        ], $event->getOrganisers()->toArray()));
    }

    #[Route('/{id}/organisers', name: 'api_event_organisers_create', methods: ['POST'])]
    public function createOrganiser(Request $request, Event $event): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $organiser = new EventOrganiser();
        $organiser->setName($data['name'] ?? '');
        $organiser->setEmail($data['email'] ?? null);
        $organiser->setPhone($data['phone'] ?? null);
        $organiser->setLogo($data['logo'] ?? null);
        $organiser->setEvent($event);

        $this->em->persist($organiser);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'organiser' => [
                'id' => $organiser->getId(),
                'name' => $organiser->getName(),
                'email' => $organiser->getEmail(),
                'phone' => $organiser->getPhone(),
            ]
        ], 201);
    }

    #[Route('/{eventId}/organisers/{id}', name: 'api_event_organisers_delete', methods: ['DELETE'])]
    public function deleteOrganiser(int $eventId, EventOrganiser $organiser): JsonResponse
    {
        $this->em->remove($organiser);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Organisateur supprime.']);
    }

    //les routes Schedule
    #[Route('/{id}/schedules', name: 'api_event_schedules_list', methods: ['GET'])]
    public function listSchedules(Event $event): JsonResponse
    {
        $schedules = array_map(fn($s) => [
            'id' => $s->getId(),
            'title' => $s->getTitle(),
            'startTime' => $s->getStartTime()?->format('Y-m-d H:i'),
            'endTime' => $s->getEndTime()?->format('Y-m-d H:i'),
            'speaker' => $s->getSpeaker(),
            'description' => $s->getDescription(),
            'position' => $s->getPosition(),
        ], $event->getSchedules()->toArray());

        usort($schedules, fn($a, $b) => $a['position'] - $b['position']);
        return $this->json($schedules);
    }

    #[Route('/{id}/schedules', name: 'api_event_schedules_create', methods: ['POST'])]
    public function createSchedule(Request $request, Event $event): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];

        $schedule = new \App\Entity\EventSchedule();
        $schedule->setTitle($data['title'] ?? '');
        $schedule->setStartTime(isset($data['startTime']) ? new \DateTime($data['startTime']) : new \DateTime());
        $schedule->setEndTime(isset($data['endTime']) ? new \DateTime($data['endTime']) : new \DateTime());
        $schedule->setSpeaker($data['speaker'] ?? null);
        $schedule->setDescription($data['description'] ?? null);
        $schedule->setPosition($data['position'] ?? 0);
        $schedule->setEvent($event);

        $this->em->persist($schedule);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'schedule' => [
                'id' => $schedule->getId(),
                'title' => $schedule->getTitle(),
                'startTime' => $schedule->getStartTime()?->format('Y-m-d H:i'),
                'endTime' => $schedule->getEndTime()?->format('Y-m-d H:i'),
                'speaker' => $schedule->getSpeaker(),
                'description' => $schedule->getDescription(),
                'position' => $schedule->getPosition(),
            ]
        ], 201);
    }

    #[Route('/{eventId}/schedules/{id}', name: 'api_event_schedules_delete', methods: ['DELETE'])]
    public function deleteSchedule(int $eventId, \App\Entity\EventSchedule $schedule): JsonResponse
    {
        $this->em->remove($schedule);
        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Session supprimee.']);
    }
}