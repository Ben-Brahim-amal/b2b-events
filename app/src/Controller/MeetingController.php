<?php

namespace App\Controller;

use App\Entity\Meeting;
use App\Entity\User;
use App\Entity\Notification;
use App\Repository\MeetingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Meetings")]
#[Route('/api/meetings')]
class MeetingController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private MeetingRepository $meetingRepo
    ) {}

    #[Route('', name: 'api_meeting_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $requester = $this->getUser();

        $participant = $this->em->getRepository(User::class)->find($data['participantId']);
        if (!$participant) {
            return $this->json(['message' => 'Utilisateur non trouve.'], 404);
        }

        // ← Fix 1 : empêcher de s'inviter soi-même
        if ($participant->getId() === $requester->getId()) {
            return $this->json(['message' => 'Vous ne pouvez pas vous inviter vous-meme.'], 400);
        }

        // ← Fix 2 : un seul meeting par participant par événement
        if (isset($data['eventId']) && $data['eventId']) {
            $existingMeeting = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $requester,
                'participant' => $participant,
            ]);
            $existingMeetingReverse = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $participant,
                'participant' => $requester,
            ]);
            if ($existingMeeting || $existingMeetingReverse) {
                return $this->json([
                    'message' => 'Vous avez deja un meeting avec cette personne pour cet evenement.'
                ], 409);
            }
        }

        $proposedAt = new \DateTime($data['proposedAt']);
        $duration = $data['duration'] ?? 30;

        if (isset($data['eventId']) && $data['eventId']) {
            $event = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);
            if ($event) {
                $eventStart = $event->getStartTime();
                $eventEnd = $event->getEndTime();

                if ($eventStart) {
                    $meetingHour = (int)$proposedAt->format('H');
                    $meetingMin  = (int)$proposedAt->format('i');
                    $startHour   = (int)$eventStart->format('H');
                    $startMin    = (int)$eventStart->format('i');

                    if ($meetingHour < $startHour || ($meetingHour === $startHour && $meetingMin < $startMin)) {
                        return $this->json([
                            'message' => 'Le meeting doit etre planifie apres ' . $eventStart->format('H:i') . '.'
                        ], 400);
                    }
                }

                if ($eventEnd) {
                    $meetingHour = (int)$proposedAt->format('H');
                    $meetingMin  = (int)$proposedAt->format('i');
                    $endHour     = (int)$eventEnd->format('H');
                    $endMin      = (int)$eventEnd->format('i');

                    if ($meetingHour > $endHour || ($meetingHour === $endHour && $meetingMin >= $endMin)) {
                        return $this->json([
                            'message' => 'Le meeting doit se terminer avant ' . $eventEnd->format('H:i') . '.'
                        ], 400);
                    }
                }
            }
        }

        // Vérifier que le créneau n'est pas déjà pris
        $busySlots = $this->meetingRepo->findBusySlots($participant->getId());
        foreach ($busySlots as $slot) {
            $slotEnd = (clone $slot->getProposedAt())->modify('+' . $slot->getDuration() . ' minutes');
            $proposedEnd = (clone $proposedAt)->modify('+' . $duration . ' minutes');
            if ($proposedAt < $slotEnd && $proposedEnd > $slot->getProposedAt()) {
                return $this->json(['message' => 'Ce creneau est deja reserve.'], 409);
            }
        }

        $meeting = new Meeting();
        $meeting->setRequester($requester);
        $meeting->setParticipant($participant);
        $meeting->setProposedAt($proposedAt);
        $meeting->setDuration($duration);
        $meeting->setMessage($data['message'] ?? null);
        $meeting->setStatus('pending');
        $meeting->setMeetingType('manual');

        $this->em->persist($meeting);

        $notification = new Notification();
        $notification->setUser($participant);
        $notification->setTitle('Demande de meeting');
        $notification->setMessage(
            $requester->getFirstName() . ' ' . $requester->getLastName() .
            ' vous invite a un meeting le ' .
            $proposedAt->format('d/m/Y a H:i')
        );
        $notification->setType('MEETING_REQUEST');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Demande de meeting envoyee !',
            'meeting' => $this->formatMeeting($meeting)
        ], 201);
    }

    #[Route('/all', name: 'api_meeting_all', methods: ['GET'])]
    public function allMeetings(): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $meetings = $this->em->getRepository(Meeting::class)->findBy(
            [], ['createdAt' => 'DESC']
        );

        return $this->json(array_map([$this, 'formatMeeting'], $meetings));
    }

    #[Route('/request', name: 'api_meeting_request_auto', methods: ['POST'])]
    public function requestAuto(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $requester = $this->getUser();

        $participant = $this->em->getRepository(User::class)->find($data['participantId']);
        if (!$participant) {
            return $this->json(['message' => 'Utilisateur non trouve.'], 404);
        }

        // ← Fix 1 : empêcher de s'inviter soi-même
        if ($participant->getId() === $requester->getId()) {
            return $this->json(['message' => 'Vous ne pouvez pas vous inviter vous-meme.'], 400);
        }

        // ← Fix 2 : un seul meeting par participant par événement
        if (isset($data['eventId']) && $data['eventId']) {
            $existingMeeting = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $requester,
                'participant' => $participant,
            ]);
            $existingMeetingReverse = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $participant,
                'participant' => $requester,
            ]);
            if ($existingMeeting || $existingMeetingReverse) {
                return $this->json([
                    'message' => 'Vous avez deja un meeting avec cette personne pour cet evenement.'
                ], 409);
            }
        }

        // Vérifier inscription ACCEPTED obligatoire
        if (isset($data['eventId']) && $data['eventId']) {
            $event = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);
            if ($event) {
                $requesterReg = $this->em->getRepository(\App\Entity\Registration::class)->findOneBy([
                    'user' => $requester,
                    'event' => $event,
                    'status' => 'accepted',
                ]);
                if (!$requesterReg) {
                    return $this->json([
                        'message' => 'Vous devez etre accepte a cet evenement pour demander un meeting.'
                    ], 403);
                }
                $participantReg = $this->em->getRepository(\App\Entity\Registration::class)->findOneBy([
                    'user' => $participant,
                    'event' => $event,
                    'status' => 'accepted',
                ]);
                if (!$participantReg) {
                    return $this->json([
                        'message' => 'Cette personne n\'est pas encore acceptee a cet evenement.'
                    ], 403);
                }
            }
        }

        // Vérifier si une demande existe déjà (auto pending)
        $existing = $this->em->getRepository(Meeting::class)->findOneBy([
            'requester' => $requester,
            'participant' => $participant,
            'meetingType' => 'auto',
            'status' => 'pending',
        ]);
        if ($existing) {
            return $this->json(['message' => 'Une demande est deja en attente avec cette personne.'], 409);
        }

        $meeting = new Meeting();
        $meeting->setRequester($requester);
        $meeting->setParticipant($participant);
        $meeting->setProposedAt(new \DateTime('2099-01-01'));
        $meeting->setDuration($data['duration'] ?? 30);
        $meeting->setMessage($data['message'] ?? null);
        $meeting->setStatus('pending');
        $meeting->setMeetingType('auto');

        $this->em->persist($meeting);

        $notification = new Notification();
        $notification->setUser($participant);
        $notification->setTitle('Demande de meeting recue');
        $notification->setMessage(
            $requester->getFirstName() . ' ' . $requester->getLastName() .
            ' souhaite organiser un meeting avec vous. Le creneau sera assigne automatiquement.'
        );
        $notification->setType('MEETING_REQUEST');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Demande envoyee ! Un creneau sera assigne automatiquement par l\'admin.',
            'meeting' => $this->formatMeeting($meeting)
        ], 201);
    }

    #[Route('/auto/pending', name: 'api_meeting_auto_pending', methods: ['GET'])]
    public function autoPending(): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }
        $meetings = $this->em->getRepository(Meeting::class)->findBy([
            'meetingType' => 'auto',
            'status' => 'pending',
        ]);
        return $this->json(array_map([$this, 'formatMeeting'], $meetings));
    }

    #[Route('/auto/assign', name: 'api_meeting_auto_assign', methods: ['POST'])]
    public function autoAssign(Request $request): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $startDate = new \DateTime($data['startDate'] ?? 'tomorrow');
        $startDate->setTime(9, 0, 0);

        $pendingMeetings = $this->em->getRepository(Meeting::class)->findBy([
            'meetingType' => 'auto',
            'status' => 'pending',
        ]);

        if (empty($pendingMeetings)) {
            return $this->json(['message' => 'Aucune demande en attente.', 'assigned' => 0]);
        }

        $assigned = [];
        $currentTime = clone $startDate;
        $endOfDay = clone $startDate;
        $endOfDay->setTime(18, 0, 0);

        foreach ($pendingMeetings as $meeting) {
            $duration = $meeting->getDuration();
            $slotFound = false;
            $tempTime = clone $currentTime;

            while ($tempTime < $endOfDay && !$slotFound) {
                $tempEnd = (clone $tempTime)->modify('+' . $duration . ' minutes');
                $requesterBusy = $this->isSlotBusy($meeting->getRequester()->getId(), $tempTime, $tempEnd);
                $participantBusy = $this->isSlotBusy($meeting->getParticipant()->getId(), $tempTime, $tempEnd);

                if (!$requesterBusy && !$participantBusy) {
                    $meeting->setProposedAt(clone $tempTime);
                    $meeting->setStatus('accepted');
                    $currentTime = clone $tempEnd;
                    $slotFound = true;

                    $notifRequester = new Notification();
                    $notifRequester->setUser($meeting->getRequester());
                    $notifRequester->setTitle('Meeting planifie !');
                    $notifRequester->setMessage('Votre meeting avec ' . $meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() . ' est planifie le ' . $tempTime->format('d/m/Y a H:i') . ' (' . $duration . ' min)');
                    $notifRequester->setType('MEETING_ACCEPTED');
                    $this->em->persist($notifRequester);

                    $notifParticipant = new Notification();
                    $notifParticipant->setUser($meeting->getParticipant());
                    $notifParticipant->setTitle('Meeting planifie !');
                    $notifParticipant->setMessage('Votre meeting avec ' . $meeting->getRequester()->getFirstName() . ' ' . $meeting->getRequester()->getLastName() . ' est planifie le ' . $tempTime->format('d/m/Y a H:i') . ' (' . $duration . ' min)');
                    $notifParticipant->setType('MEETING_ACCEPTED');
                    $this->em->persist($notifParticipant);

                    $assigned[] = $this->formatMeeting($meeting);
                }

                if (!$slotFound) {
                    $tempTime->modify('+30 minutes');
                }
            }

            if (!$slotFound) {
                $currentTime = clone $startDate;
                $currentTime->modify('+1 day');
                $currentTime->setTime(9, 0, 0);
                $endOfDay->modify('+1 day');
            }
        }

        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => count($assigned) . ' meetings assignes automatiquement !',
            'assigned' => count($assigned),
            'meetings' => $assigned
        ]);
    }

    #[Route('', name: 'api_meeting_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $user = $this->getUser();
        $data = $this->meetingRepo->findUserMeetingsOptimized($user);
        return $this->json([
            'sent' => array_map([$this, 'formatMeeting'], $data['sent']),
            'received' => array_map([$this, 'formatMeeting'], $data['received']),
        ]);
    }

    #[Route('/busy/{userId}', name: 'api_meeting_busy', methods: ['GET'])]
    public function busySlots(int $userId): JsonResponse
    {
        $slots = $this->meetingRepo->findBusySlots($userId);
        return $this->json(array_map(fn($m) => [
            'proposedAt' => $m->getProposedAt()->format('Y-m-d H:i'),
            'duration' => $m->getDuration(),
        ], $slots));
    }

    #[Route('/{id}/accept', name: 'api_meeting_accept', methods: ['PUT'])]
    public function accept(Meeting $meeting): JsonResponse
    {
        if ($meeting->getParticipant() !== $this->getUser()) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }
        $meeting->setStatus('accepted');
        $this->em->flush();

        $notification = new Notification();
        $notification->setUser($meeting->getRequester());
        $notification->setTitle('Meeting accepte !');
        $notification->setMessage($meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() . ' a accepte votre meeting du ' . $meeting->getProposedAt()->format('d/m/Y a H:i'));
        $notification->setType('MEETING_ACCEPTED');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Meeting accepte !']);
    }

    #[Route('/{id}/reject', name: 'api_meeting_reject', methods: ['PUT'])]
    public function reject(Meeting $meeting): JsonResponse
    {
        if ($meeting->getParticipant() !== $this->getUser()) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }
        $meeting->setStatus('rejected');
        $this->em->flush();

        $notification = new Notification();
        $notification->setUser($meeting->getRequester());
        $notification->setTitle('Meeting refuse');
        $notification->setMessage($meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() . ' n\'est pas disponible a cette date.');
        $notification->setType('MEETING_REJECTED');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Meeting refuse.']);
    }

    private function isSlotBusy(int $userId, \DateTime $start, \DateTime $end): bool
    {
        $busySlots = $this->meetingRepo->findBusySlots($userId);
        foreach ($busySlots as $slot) {
            if ($slot->getMeetingType() === 'auto' && $slot->getProposedAt()->format('Y') === '2099') {
                continue;
            }
            $slotEnd = (clone $slot->getProposedAt())->modify('+' . $slot->getDuration() . ' minutes');
            if ($start < $slotEnd && $end > $slot->getProposedAt()) {
                return true;
            }
        }
        return false;
    }

    private function formatMeeting(Meeting $m): array
    {
        $proposedAt = $m->getProposedAt()->format('Y') === '2099'
            ? 'A assigner'
            : $m->getProposedAt()->format('Y-m-d H:i');

        return [
            'id' => $m->getId(),
            'status' => $m->getStatus(),
            'meetingType' => $m->getMeetingType(),
            'proposedAt' => $proposedAt,
            'duration' => $m->getDuration(),
            'message' => $m->getMessage(),
            'createdAt' => $m->getCreatedAt()->format('Y-m-d H:i:s'),
            'requester' => [
                'id' => $m->getRequester()->getId(),
                'firstName' => $m->getRequester()->getFirstName(),
                'lastName' => $m->getRequester()->getLastName(),
                'email' => $m->getRequester()->getEmail(),
                'userRole' => $m->getRequester()->getUserRole(),
            ],
            'participant' => [
                'id' => $m->getParticipant()->getId(),
                'firstName' => $m->getParticipant()->getFirstName(),
                'lastName' => $m->getParticipant()->getLastName(),
                'email' => $m->getParticipant()->getEmail(),
                'userRole' => $m->getParticipant()->getUserRole(),
            ],
        ];
    }
}