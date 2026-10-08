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
            return $this->json(['message' => 'User not found.'], 404);
        }

        if ($participant->getId() === $requester->getId()) {
            return $this->json(['message' => 'You cannot invite yourself.'], 400);
        }

        if (isset($data['eventId']) && $data['eventId']) {
            $event = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);

            if (!$event) {
                return $this->json(['message' => 'Event not found.'], 404);
            }
            if ($event->getStatus() !== 'published') {
                return $this->json(['message' => 'Meetings are not allowed. This event is not active.'], 403);
            }

            $existingMeeting = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $requester,
                'participant' => $participant,
                'event' => $event,
            ]);
            $existingMeetingReverse = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $participant,
                'participant' => $requester,
                'event' => $event,
            ]);
            if ($existingMeeting || $existingMeetingReverse) {
                return $this->json(['message' => 'You already have a meeting with this person for this event.'], 409);
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
                        return $this->json(['message' => 'The meeting must be scheduled after ' . $eventStart->format('H:i') . '.'], 400);
                    }
                }
                if ($eventEnd) {
                    $meetingHour = (int)$proposedAt->format('H');
                    $meetingMin  = (int)$proposedAt->format('i');
                    $endHour     = (int)$eventEnd->format('H');
                    $endMin      = (int)$eventEnd->format('i');
                    if ($meetingHour > $endHour || ($meetingHour === $endHour && $meetingMin >= $endMin)) {
                        return $this->json(['message' => 'The meeting must end before ' . $eventEnd->format('H:i') . '.'], 400);
                    }
                }
            }
        }

        $proposedEnd = (clone $proposedAt)->modify('+' . $duration . ' minutes');
        foreach ([$requester->getId(), $participant->getId()] as $checkUserId) {
            if ($this->isSlotBusy($checkUserId, $proposedAt, $proposedEnd)) {
                return $this->json(['message' => 'This time slot is already taken for one of the participants.'], 409);
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
        if (isset($data['eventId']) && $data['eventId']) {
            $event = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);
            if ($event) $meeting->setEvent($event);
        }

        $this->em->persist($meeting);

        $notification = new Notification();
        $notification->setUser($participant);
        $notification->setTitle('Meeting Request');
        $notification->setMessage(
            $requester->getFirstName() . ' ' . $requester->getLastName() .
            ' has invited you to a meeting on ' . $proposedAt->format('d/m/Y at H:i')
        );
        $notification->setType('MEETING_REQUEST');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Meeting request sent!',
            'meeting' => $this->formatMeeting($meeting)
        ], 201);
    }

    #[Route('/all', name: 'api_meeting_all', methods: ['GET'])]
    public function allMeetings(): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }
        $meetings = $this->em->getRepository(Meeting::class)->findBy([], ['createdAt' => 'DESC']);
        return $this->json(array_map([$this, 'formatMeeting'], $meetings));
    }

    #[Route('/request', name: 'api_meeting_request_auto', methods: ['POST'])]
    public function requestAuto(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $requester = $this->getUser();

        $participant = $this->em->getRepository(User::class)->find($data['participantId']);
        if (!$participant) {
            return $this->json(['message' => 'User not found.'], 404);
        }

        if ($participant->getId() === $requester->getId()) {
            return $this->json(['message' => 'You cannot invite yourself.'], 400);
        }

        if (isset($data['eventId']) && $data['eventId']) {
            $eventCheck = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);

            if (!$eventCheck) {
                return $this->json(['message' => 'Event not found.'], 404);
            }
            if ($eventCheck->getStatus() !== 'published') {
                return $this->json(['message' => 'Meetings are not allowed. This event is not active.'], 403);
            }
            $existingMeeting = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $requester,
                'participant' => $participant,
                'event' => $eventCheck,
            ]);
            $existingMeetingReverse = $this->em->getRepository(Meeting::class)->findOneBy([
                'requester' => $participant,
                'participant' => $requester,
                'event' => $eventCheck,
            ]);
            if ($existingMeeting || $existingMeetingReverse) {
                return $this->json(['message' => 'You already have a meeting with this person for this event.'], 409);
            }
        }

        if (isset($data['eventId']) && $data['eventId']) {
            $event = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);
            if ($event) {
                $requesterReg = $this->em->getRepository(\App\Entity\Registration::class)->findOneBy([
                    'user' => $requester, 'event' => $event, 'status' => 'accepted',
                ]);
                if (!$requesterReg) {
                    return $this->json(['message' => 'You must be accepted at this event to request a meeting.'], 403);
                }
                $participantReg = $this->em->getRepository(\App\Entity\Registration::class)->findOneBy([
                    'user' => $participant, 'event' => $event, 'status' => 'accepted',
                ]);
                if (!$participantReg) {
                    return $this->json(['message' => 'This person is not yet accepted at this event.'], 403);
                }
            }
        }

        $existing = $this->em->getRepository(Meeting::class)->findOneBy([
            'requester' => $requester,
            'participant' => $participant,
            'meetingType' => 'auto',
            'status' => 'pending',
        ]);
        if ($existing) {
            return $this->json(['message' => 'A request is already pending with this person.'], 409);
        }

        $meeting = new Meeting();
        $meeting->setRequester($requester);
        $meeting->setParticipant($participant);
        $meeting->setProposedAt(new \DateTime('2099-01-01'));
        $meeting->setDuration($data['duration'] ?? 30);
        $meeting->setMessage($data['message'] ?? null);
        $meeting->setStatus('pending');
        $meeting->setMeetingType('auto');
        if (isset($data['eventId']) && $data['eventId']) {
            $event = $this->em->getRepository(\App\Entity\Event::class)->find($data['eventId']);
            if ($event) $meeting->setEvent($event);
        }

        $this->em->persist($meeting);

        $notification = new Notification();
        $notification->setUser($participant);
        $notification->setTitle('Meeting Request Received');
        $notification->setMessage(
            $requester->getFirstName() . ' ' . $requester->getLastName() .
            ' wants to schedule a meeting with you. A slot will be automatically assigned.'
        );
        $notification->setType('MEETING_REQUEST');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Request sent! A slot will be automatically assigned by the admin.',
            'meeting' => $this->formatMeeting($meeting)
        ], 201);
    }

    #[Route('/auto/pending', name: 'api_meeting_auto_pending', methods: ['GET'])]
    public function autoPending(): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }
        $meetings = $this->em->getRepository(Meeting::class)->findBy([
            'meetingType' => 'auto', 'status' => 'pending',
        ]);
        return $this->json(array_map([$this, 'formatMeeting'], $meetings));
    }

    #[Route('/auto/assign', name: 'api_meeting_auto_assign', methods: ['POST'])]
    public function autoAssign(Request $request): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $startDate = new \DateTime($data['startDate'] ?? 'tomorrow');
        $startDate->setTime(9, 0, 0);

        $pendingMeetings = $this->em->getRepository(Meeting::class)->findBy([
            'meetingType' => 'auto', 'status' => 'pending',
        ]);

        if (empty($pendingMeetings)) {
            return $this->json(['message' => 'No pending requests.', 'assigned' => 0]);
        }

        $meetingCountPerUser = [];
        foreach ($pendingMeetings as $meeting) {
            $rid = $meeting->getRequester()->getId();
            $pid = $meeting->getParticipant()->getId();
            $meetingCountPerUser[$rid] = ($meetingCountPerUser[$rid] ?? 0) + 1;
            $meetingCountPerUser[$pid] = ($meetingCountPerUser[$pid] ?? 0) + 1;
        }

        usort($pendingMeetings, function ($a, $b) use ($meetingCountPerUser) {
            $countA = max($meetingCountPerUser[$a->getRequester()->getId()] ?? 0, $meetingCountPerUser[$a->getParticipant()->getId()] ?? 0);
            $countB = max($meetingCountPerUser[$b->getRequester()->getId()] ?? 0, $meetingCountPerUser[$b->getParticipant()->getId()] ?? 0);
            return $countA - $countB;
        });

        $assigned = [];
        $endOfDay = clone $startDate;
        $endOfDay->setTime(18, 0, 0);

        $userSlots = [];
        $existingAccepted = $this->em->getRepository(Meeting::class)->findBy(['status' => 'accepted']);
        foreach ($existingAccepted as $existing) {
            if ($existing->getProposedAt()->format('Y') === '2099') continue;
            $rid = $existing->getRequester()->getId();
            $pid = $existing->getParticipant()->getId();
            $existingEnd = (clone $existing->getProposedAt())->modify('+' . $existing->getDuration() . ' minutes');
            $userSlots[$rid][] = ['start' => clone $existing->getProposedAt(), 'end' => $existingEnd];
            $userSlots[$pid][] = ['start' => clone $existing->getProposedAt(), 'end' => $existingEnd];
        }

        $nbTables = $data['nbTables'] ?? 5;
        $tableSlots = [];
        for ($t = 1; $t <= $nbTables; $t++) {
            $tableSlots[$t] = [];
        }

        foreach ($pendingMeetings as $meeting) {
            $duration = $meeting->getDuration();
            $slotFound = false;
            $rid = $meeting->getRequester()->getId();
            $pid = $meeting->getParticipant()->getId();
            $tempTime = clone $startDate;

            while ($tempTime < $endOfDay && !$slotFound) {
                $tempEnd = (clone $tempTime)->modify('+' . $duration . ' minutes');
                $requesterBusy = $this->isUserSlotBusy($userSlots[$rid] ?? [], $tempTime, $tempEnd);
                $participantBusy = $this->isUserSlotBusy($userSlots[$pid] ?? [], $tempTime, $tempEnd);

                if (!$requesterBusy && !$participantBusy) {
                    $assignedTable = null;
                    for ($t = 1; $t <= $nbTables; $t++) {
                        if (!$this->isUserSlotBusy($tableSlots[$t], $tempTime, $tempEnd)) {
                            $assignedTable = $t;
                            break;
                        }
                    }

                    if ($assignedTable !== null) {
                        $meeting->setProposedAt(clone $tempTime);
                        $meeting->setStatus('accepted');
                        $meeting->setTableNumber($assignedTable);
                        $slotFound = true;

                        $userSlots[$rid][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                        $userSlots[$pid][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                        $tableSlots[$assignedTable][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];

                        $notifRequester = new Notification();
                        $notifRequester->setUser($meeting->getRequester());
                        $notifRequester->setTitle('Meeting Scheduled!');
                        $notifRequester->setMessage('Your meeting with ' . $meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() . ' is scheduled on ' . $tempTime->format('d/m/Y') . ' at ' . $tempTime->format('H:i') . ' — Table ' . $assignedTable . ' (' . $duration . ' min)');
                        $notifRequester->setType('MEETING_ACCEPTED');
                        $this->em->persist($notifRequester);

                        $notifParticipant = new Notification();
                        $notifParticipant->setUser($meeting->getParticipant());
                        $notifParticipant->setTitle('Meeting Scheduled!');
                        $notifParticipant->setMessage('Your meeting with ' . $meeting->getRequester()->getFirstName() . ' ' . $meeting->getRequester()->getLastName() . ' is scheduled on ' . $tempTime->format('d/m/Y') . ' at ' . $tempTime->format('H:i') . ' — Table ' . $assignedTable . ' (' . $duration . ' min)');
                        $notifParticipant->setType('MEETING_ACCEPTED');
                        $this->em->persist($notifParticipant);

                        $assigned[] = $this->formatMeeting($meeting);
                    }
                }

                if (!$slotFound) {
                    $tempTime->modify('+30 minutes');
                }
            }
        }

        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => count($assigned) . ' meetings automatically assigned!',
            'assigned' => count($assigned),
            'meetings' => $assigned
        ]);
    }

    #[Route('/send-agenda', name: 'api_meeting_send_agenda', methods: ['POST'])]
    public function sendAgenda(
        Request $request,
        \Symfony\Component\Mailer\MailerInterface $mailer
    ): JsonResponse {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $subject = $data['subject'] ?? 'Your Meeting Agenda';
        $customMessage = $data['message'] ?? '';
        $participantIds = $data['participantIds'] ?? [];

        if (empty($participantIds)) {
            return $this->json(['message' => 'No participants selected.'], 400);
        }

        $sent = 0;
        $errors = [];

        foreach ($participantIds as $userId) {
            $user = $this->em->getRepository(\App\Entity\User::class)->find($userId);
            if (!$user) continue;

            $meetings = $this->em->getRepository(Meeting::class)->findBy([
                'status' => 'accepted',
                'meetingType' => 'auto',
            ]);

            $userMeetings = array_filter($meetings, fn($m) =>
                $m->getRequester()->getId() === $userId ||
                $m->getParticipant()->getId() === $userId
            );

            if (empty($userMeetings)) continue;

            usort($userMeetings, fn($a, $b) => $a->getProposedAt() <=> $b->getProposedAt());

            $agendaLines = [];
            foreach ($userMeetings as $m) {
                $other = $m->getRequester()->getId() === $userId ? $m->getParticipant() : $m->getRequester();
                $table = $m->getTableNumber() ? ' — Table ' . $m->getTableNumber() : '';
                $room = $m->getRoomNumber() ? ' — Room ' . $m->getRoomNumber() : '';
                $eventInfo = $m->getEvent() ? ' [' . $m->getEvent()->getTitle() . ']' : '';
                $agendaLines[] = '• ' . $m->getProposedAt()->format('H:i') . ' (' . $m->getDuration() . ' min) → Meeting with ' . $other->getFirstName() . ' ' . $other->getLastName() . $room . $table . $eventInfo;
            }

            $emailBody = "Hello " . $user->getFirstName() . ",\n\n";
            if ($customMessage) $emailBody .= $customMessage . "\n\n";
            $emailBody .= "Here is your meeting agenda:\n\n";
            $emailBody .= implode("\n", $agendaLines);
            $emailBody .= "\n\nBest regards,\nB2B Events Team";

            try {
                $email = (new \Symfony\Component\Mime\Email())
                    ->from('amal.b.brahim@gmail.com')
                    ->to($user->getEmail())
                    ->subject($subject)
                    ->text($emailBody);
                $mailer->send($email);
                $sent++;
            } catch (\Exception $e) {
                $errors[] = $user->getEmail() . ': ' . $e->getMessage();
            }
        }

        return $this->json([
            'status' => 'success',
            'message' => $sent . ' agenda(s) sent successfully!',
            'sent' => $sent,
            'errors' => $errors,
        ]);
    }

    #[Route('/auto/assign-and-send', name: 'api_meeting_assign_and_send', methods: ['POST'])]
    public function assignAndSend(
        Request $request,
        \Symfony\Component\Mailer\MailerInterface $mailer
    ): JsonResponse {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $subject = $data['subject'] ?? 'Your Meeting Agenda - B2B Event';
        $customMessage = $data['message'] ?? '';
        $participantIds = $data['participantIds'] ?? [];

        $assigned = [];
        $pendingMeetings = $this->em->getRepository(Meeting::class)->findBy([
            'meetingType' => 'auto', 'status' => 'pending',
        ]);

        if (!empty($pendingMeetings)) {
            $firstPending = $pendingMeetings[0];

            if ($firstPending->getEvent()) {
                $startDate = clone $firstPending->getEvent()->getDate();
                $startDate->setTime(
                    (int)$firstPending->getEvent()->getStartTime()->format('H'),
                    (int)$firstPending->getEvent()->getStartTime()->format('i'),
                    0
                );
            } else {
                $startDate = new \DateTime('tomorrow');
                $startDate->setTime(9, 0, 0);
            }

            $meetingCountPerUser = [];
            foreach ($pendingMeetings as $meeting) {
                $rid = $meeting->getRequester()->getId();
                $pid = $meeting->getParticipant()->getId();
                $meetingCountPerUser[$rid] = ($meetingCountPerUser[$rid] ?? 0) + 1;
                $meetingCountPerUser[$pid] = ($meetingCountPerUser[$pid] ?? 0) + 1;
            }

            usort($pendingMeetings, function ($a, $b) use ($meetingCountPerUser) {
                $countA = max($meetingCountPerUser[$a->getRequester()->getId()] ?? 0, $meetingCountPerUser[$a->getParticipant()->getId()] ?? 0);
                $countB = max($meetingCountPerUser[$b->getRequester()->getId()] ?? 0, $meetingCountPerUser[$b->getParticipant()->getId()] ?? 0);
                return $countA - $countB;
            });

            $endOfDay = clone $startDate;
            $endOfDay->setTime(18, 0, 0);

            $userSlots = [];
            $existingAccepted = $this->em->getRepository(Meeting::class)->findBy(['status' => 'accepted']);
            foreach ($existingAccepted as $existing) {
                if ($existing->getProposedAt()->format('Y') === '2099') continue;
                $rid = $existing->getRequester()->getId();
                $pid = $existing->getParticipant()->getId();
                $existingEnd = (clone $existing->getProposedAt())->modify('+' . $existing->getDuration() . ' minutes');
                $userSlots[$rid][] = ['start' => clone $existing->getProposedAt(), 'end' => $existingEnd];
                $userSlots[$pid][] = ['start' => clone $existing->getProposedAt(), 'end' => $existingEnd];
            }

            $nbTables = $data['nbTables'] ?? 5;
            $tableSlots = [];
            for ($t = 1; $t <= $nbTables; $t++) {
                $tableSlots[$t] = [];
            }

            foreach ($pendingMeetings as $meeting) {
                $duration = $meeting->getDuration();
                $slotFound = false;
                $rid = $meeting->getRequester()->getId();
                $pid = $meeting->getParticipant()->getId();
                $tempTime = clone $startDate;

                while ($tempTime < $endOfDay && !$slotFound) {
                    $tempEnd = (clone $tempTime)->modify('+' . $duration . ' minutes');
                    $requesterBusy = $this->isUserSlotBusy($userSlots[$rid] ?? [], $tempTime, $tempEnd);
                    $participantBusy = $this->isUserSlotBusy($userSlots[$pid] ?? [], $tempTime, $tempEnd);

                    if (!$requesterBusy && !$participantBusy) {
                        $assignedTable = null;
                        for ($t = 1; $t <= $nbTables; $t++) {
                            if (!$this->isUserSlotBusy($tableSlots[$t], $tempTime, $tempEnd)) {
                                $assignedTable = $t;
                                break;
                            }
                        }

                        if ($assignedTable !== null) {
                            $meeting->setProposedAt(clone $tempTime);
                            $meeting->setStatus('accepted');
                            $meeting->setTableNumber($assignedTable);
                            $slotFound = true;

                            $userSlots[$rid][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                            $userSlots[$pid][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                            $tableSlots[$assignedTable][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];

                            $notifRequester = new Notification();
                            $notifRequester->setUser($meeting->getRequester());
                            $notifRequester->setTitle('Meeting Scheduled!');
                            $notifRequester->setMessage('Your meeting with ' . $meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() . ' is scheduled on ' . $tempTime->format('d/m/Y') . ' at ' . $tempTime->format('H:i') . ' — Table ' . $assignedTable . ' (' . $duration . ' min)');
                            $notifRequester->setType('MEETING_ACCEPTED');
                            $this->em->persist($notifRequester);

                            $notifParticipant = new Notification();
                            $notifParticipant->setUser($meeting->getParticipant());
                            $notifParticipant->setTitle('Meeting Scheduled!');
                            $notifParticipant->setMessage('Your meeting with ' . $meeting->getRequester()->getFirstName() . ' ' . $meeting->getRequester()->getLastName() . ' is scheduled on ' . $tempTime->format('d/m/Y') . ' at ' . $tempTime->format('H:i') . ' — Table ' . $assignedTable . ' (' . $duration . ' min)');
                            $notifParticipant->setType('MEETING_ACCEPTED');
                            $this->em->persist($notifParticipant);

                            $assigned[] = $meeting;
                        }
                    }

                    if (!$slotFound) {
                        $tempTime->modify('+30 minutes');
                    }
                }
            }

            $this->em->flush();
        }

        $sent = 0;
        $errors = [];
        $usersToNotify = [];

        if (!empty($participantIds)) {
            foreach ($participantIds as $uid) {
                $u = $this->em->getRepository(User::class)->find($uid);
                if ($u) $usersToNotify[$uid] = $u;
            }
        } else {
            foreach ($assigned as $meeting) {
                $rid = $meeting->getRequester()->getId();
                $pid = $meeting->getParticipant()->getId();
                if (!isset($usersToNotify[$rid])) $usersToNotify[$rid] = $meeting->getRequester();
                if (!isset($usersToNotify[$pid])) $usersToNotify[$pid] = $meeting->getParticipant();
            }
        }

        foreach ($usersToNotify as $user) {
            $userId = $user->getId();
            $allMeetings = $this->em->getRepository(Meeting::class)->findBy([
                'status' => 'accepted', 'meetingType' => 'auto',
            ]);
            $userMeetings = array_filter($allMeetings, fn($m) =>
                $m->getRequester()->getId() === $userId || $m->getParticipant()->getId() === $userId
            );
            if (empty($userMeetings)) continue;
            usort($userMeetings, fn($a, $b) => $a->getProposedAt() <=> $b->getProposedAt());
            $agendaLines = [];
            foreach ($userMeetings as $m) {
                $other = $m->getRequester()->getId() === $userId ? $m->getParticipant() : $m->getRequester();
                $table = $m->getTableNumber() ? ' — Table ' . $m->getTableNumber() : '';
                $room = $m->getRoomNumber() ? ' — Room ' . $m->getRoomNumber() : '';
                $eventInfo = $m->getEvent() ? ' [' . $m->getEvent()->getTitle() . ']' : '';
                $agendaLines[] = '• ' . $m->getProposedAt()->format('H:i') . ' (' . $m->getDuration() . ' min) → Meeting with ' . $other->getFirstName() . ' ' . $other->getLastName() . $room . $table . $eventInfo;
            }
            $emailBody = "Hello " . $user->getFirstName() . ",\n\n";
            if ($customMessage) $emailBody .= $customMessage . "\n\n";
            $emailBody .= "Here is your meeting agenda:\n\n";
            $emailBody .= implode("\n", $agendaLines);
            $emailBody .= "\n\nBest regards,\nB2B Events Team";
            try {
                $email = (new \Symfony\Component\Mime\Email())
                    ->from('amal.b.brahim@gmail.com')
                    ->to($user->getEmail())
                    ->subject($subject)
                    ->text($emailBody);
                $mailer->send($email);
                $sent++;
            } catch (\Exception $e) {
                $errors[] = $user->getEmail() . ': ' . $e->getMessage();
            }
        }

        return $this->json([
            'status' => 'success',
            'message' => count($assigned) . ' meetings assigned and ' . $sent . ' agenda(s) sent!',
            'assigned' => count($assigned),
            'sent' => $sent,
            'errors' => $errors,
        ]);
    }

    #[Route('/event/{eventId}/assign-and-send', name: 'api_meeting_event_assign_and_send', methods: ['POST'])]
    public function assignAndSendByEvent(
        Request $request,
        int $eventId,
        \Symfony\Component\Mailer\MailerInterface $mailer
    ): JsonResponse {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $event = $this->em->getRepository(\App\Entity\Event::class)->find($eventId);
        if (!$event) {
            return $this->json(['message' => 'Event not found.'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $subject = $data['subject'] ?? 'Your Meeting Agenda - ' . $event->getTitle();
        $customMessage = $data['message'] ?? '';
        $participantIds = $data['participantIds'] ?? [];

        $nbTables = $event->getNbTable() > 0 ? $event->getNbTable() : 10;
        $nbRooms = $event->getNbRoom() > 0 ? $event->getNbRoom() : 5;

        $autoPending = $this->em->getRepository(Meeting::class)->findBy([
            'event' => $event, 'meetingType' => 'auto', 'status' => 'pending',
        ]);
        $manualAccepted = $this->em->getRepository(Meeting::class)->findBy([
            'event' => $event, 'meetingType' => 'manual', 'status' => 'accepted',
        ]);

        // ← Filtre par participantIds si fourni
        if (!empty($participantIds)) {
            $autoPending = array_values(array_filter($autoPending, function($meeting) use ($participantIds) {
                return in_array($meeting->getRequester()->getId(), $participantIds) ||
                       in_array($meeting->getParticipant()->getId(), $participantIds);
            }));
            $manualAccepted = array_values(array_filter($manualAccepted, function($meeting) use ($participantIds) {
                return in_array($meeting->getRequester()->getId(), $participantIds) ||
                       in_array($meeting->getParticipant()->getId(), $participantIds);
            }));
        }

        if (empty($autoPending) && empty($manualAccepted)) {
            return $this->json(['message' => 'No meetings to process for this event.', 'assigned' => 0, 'sent' => 0]);
        }

        $startDate = clone $event->getDate();
        if ($event->getStartTime()) {
            $startDate->setTime((int)$event->getStartTime()->format('H'), (int)$event->getStartTime()->format('i'), 0);
        } else {
            $startDate->setTime(9, 0, 0);
        }
        $endOfDay = clone $startDate;
        if ($event->getEndTime()) {
            $endOfDay->setTime((int)$event->getEndTime()->format('H'), (int)$event->getEndTime()->format('i'), 0);
        } else {
            $endOfDay->setTime(18, 0, 0);
        }

        $userSlots = [];
        $tableSlots = [];
        $roomSlots = [];
        for ($t = 1; $t <= $nbTables; $t++) $tableSlots[$t] = [];
        for ($r = 1; $r <= $nbRooms; $r++) $roomSlots[$r] = [];

        $existingAccepted = $this->em->getRepository(Meeting::class)->findBy(['event' => $event, 'status' => 'accepted']);
        foreach ($existingAccepted as $existing) {
            if ($existing->getProposedAt()->format('Y') === '2099') continue;
            $rid = $existing->getRequester()->getId();
            $pid = $existing->getParticipant()->getId();
            $eEnd = (clone $existing->getProposedAt())->modify('+' . $existing->getDuration() . ' minutes');
            $userSlots[$rid][] = ['start' => clone $existing->getProposedAt(), 'end' => $eEnd];
            $userSlots[$pid][] = ['start' => clone $existing->getProposedAt(), 'end' => $eEnd];
            if ($existing->getTableNumber()) $tableSlots[$existing->getTableNumber()][] = ['start' => clone $existing->getProposedAt(), 'end' => $eEnd];
            if ($existing->getRoomNumber()) $roomSlots[$existing->getRoomNumber()][] = ['start' => clone $existing->getProposedAt(), 'end' => $eEnd];
        }

        $assignedCount = 0;

        // AUTO pending → assigne date + heure + table + room
        if (!empty($autoPending)) {
            $meetingCountPerUser = [];
            foreach ($autoPending as $meeting) {
                $rid = $meeting->getRequester()->getId();
                $pid = $meeting->getParticipant()->getId();
                $meetingCountPerUser[$rid] = ($meetingCountPerUser[$rid] ?? 0) + 1;
                $meetingCountPerUser[$pid] = ($meetingCountPerUser[$pid] ?? 0) + 1;
            }
            usort($autoPending, function ($a, $b) use ($meetingCountPerUser) {
                $countA = max($meetingCountPerUser[$a->getRequester()->getId()] ?? 0, $meetingCountPerUser[$a->getParticipant()->getId()] ?? 0);
                $countB = max($meetingCountPerUser[$b->getRequester()->getId()] ?? 0, $meetingCountPerUser[$b->getParticipant()->getId()] ?? 0);
                return $countA - $countB;
            });

            foreach ($autoPending as $meeting) {
                $duration = $meeting->getDuration();
                $slotFound = false;
                $rid = $meeting->getRequester()->getId();
                $pid = $meeting->getParticipant()->getId();
                $tempTime = clone $startDate;

                while ($tempTime < $endOfDay && !$slotFound) {
                    $tempEnd = (clone $tempTime)->modify('+' . $duration . ' minutes');
                    if (!$this->isUserSlotBusy($userSlots[$rid] ?? [], $tempTime, $tempEnd) &&
                        !$this->isUserSlotBusy($userSlots[$pid] ?? [], $tempTime, $tempEnd)) {
                        $assignedTable = null;
                        for ($t = 1; $t <= $nbTables; $t++) {
                            if (!$this->isUserSlotBusy($tableSlots[$t], $tempTime, $tempEnd)) { $assignedTable = $t; break; }
                        }
                        $assignedRoom = null;
                        for ($r = 1; $r <= $nbRooms; $r++) {
                            if (!$this->isUserSlotBusy($roomSlots[$r], $tempTime, $tempEnd)) { $assignedRoom = $r; break; }
                        }
                        if ($assignedTable !== null && $assignedRoom !== null) {
                            $meeting->setProposedAt(clone $tempTime);
                            $meeting->setStatus('accepted');
                            $meeting->setTableNumber($assignedTable);
                            $meeting->setRoomNumber($assignedRoom);
                            $slotFound = true;
                            $userSlots[$rid][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                            $userSlots[$pid][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                            $tableSlots[$assignedTable][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                            $roomSlots[$assignedRoom][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                            $this->notifyAssigned($meeting->getRequester(), $meeting->getParticipant(), $tempTime, $assignedTable, $assignedRoom, $duration);
                            $this->notifyAssigned($meeting->getParticipant(), $meeting->getRequester(), $tempTime, $assignedTable, $assignedRoom, $duration);
                            $assignedCount++;
                        }
                    }
                    if (!$slotFound) $tempTime->modify('+30 minutes');
                }
            }
        }

        // MANUAL accepted → assigne SEULEMENT table + room
        foreach ($manualAccepted as $meeting) {
            if ($meeting->getTableNumber() && $meeting->getRoomNumber()) continue;
            $duration = $meeting->getDuration();
            $tempTime = $meeting->getProposedAt();
            $tempEnd = (clone $tempTime)->modify('+' . $duration . ' minutes');
            $assignedTable = null;
            for ($t = 1; $t <= $nbTables; $t++) {
                if (!$this->isUserSlotBusy($tableSlots[$t], $tempTime, $tempEnd)) { $assignedTable = $t; break; }
            }
            $assignedRoom = null;
            for ($r = 1; $r <= $nbRooms; $r++) {
                if (!$this->isUserSlotBusy($roomSlots[$r], $tempTime, $tempEnd)) { $assignedRoom = $r; break; }
            }
            if ($assignedTable !== null && $assignedRoom !== null) {
                $meeting->setTableNumber($assignedTable);
                $meeting->setRoomNumber($assignedRoom);
                $tableSlots[$assignedTable][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                $roomSlots[$assignedRoom][] = ['start' => clone $tempTime, 'end' => clone $tempEnd];
                $assignedCount++;
            }
        }

        $this->em->flush();

        // Send Agenda — filtré par participantIds si fourni
        $allEventMeetings = $this->em->getRepository(Meeting::class)
            ->findBy(['event' => $event, 'status' => 'accepted']);
        $usersToNotify = [];

        foreach ($allEventMeetings as $meeting) {
            $rid = $meeting->getRequester()->getId();
            $pid = $meeting->getParticipant()->getId();
            if (empty($participantIds) || in_array($rid, $participantIds)) {
                $usersToNotify[$rid] = $meeting->getRequester();
            }
            if (empty($participantIds) || in_array($pid, $participantIds)) {
                $usersToNotify[$pid] = $meeting->getParticipant();
            }
        }

        $sent = 0;
        $errors = [];

        foreach ($usersToNotify as $user) {
            $userId = $user->getId();
            $userMeetings = array_filter($allEventMeetings, fn($m) =>
                $m->getRequester()->getId() === $userId || $m->getParticipant()->getId() === $userId
            );
            if (empty($userMeetings)) continue;
            usort($userMeetings, fn($a, $b) => $a->getProposedAt() <=> $b->getProposedAt());

            $agendaLines = [];
            foreach ($userMeetings as $m) {
                $other = $m->getRequester()->getId() === $userId ? $m->getParticipant() : $m->getRequester();
                $table = $m->getTableNumber() ? ' — Table ' . $m->getTableNumber() : '';
                $room = $m->getRoomNumber() ? ' — Room ' . $m->getRoomNumber() : '';
                $agendaLines[] = '• ' . $m->getProposedAt()->format('H:i') . ' (' . $m->getDuration() . ' min) → Meeting with ' . $other->getFirstName() . ' ' . $other->getLastName() . $room . $table;
            }

            $emailBody = "Hello " . $user->getFirstName() . ",\n\n";
            if ($customMessage) $emailBody .= $customMessage . "\n\n";
            $emailBody .= "Here is your meeting agenda for " . $event->getTitle() . ":\n\n";
            $emailBody .= implode("\n", $agendaLines);
            $emailBody .= "\n\nBest regards,\nB2B Events Team";

            try {
                $email = (new \Symfony\Component\Mime\Email())
                    ->from('amal.b.brahim@gmail.com')
                    ->to($user->getEmail())
                    ->subject($subject)
                    ->text($emailBody);
                $mailer->send($email);
                $sent++;
            } catch (\Exception $e) {
                $errors[] = $user->getEmail() . ': ' . $e->getMessage();
            }
        }

        return $this->json([
            'status' => 'success',
            'message' => $assignedCount . ' meeting(s) assigned and ' . $sent . ' agenda(s) sent for "' . $event->getTitle() . '"!',
            'assigned' => $assignedCount,
            'sent' => $sent,
            'errors' => $errors,
        ]);
    }

    private function notifyAssigned(User $forUser, User $otherUser, \DateTime $time, int $table, int $room, int $duration): void
    {
        $notif = new Notification();
        $notif->setUser($forUser);
        $notif->setTitle('Meeting Scheduled!');
        $notif->setMessage('Your meeting with ' . $otherUser->getFirstName() . ' ' . $otherUser->getLastName() .
            ' is scheduled at ' . $time->format('H:i') . ' — Room ' . $room . ', Table ' . $table . ' (' . $duration . ' min)');
        $notif->setType('MEETING_ACCEPTED');
        $this->em->persist($notif);
    }

    #[Route('/agenda/participants', name: 'api_meeting_agenda_participants', methods: ['GET'])]
    public function agendaParticipants(): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Access denied.'], 403);
        }

        $meetings = $this->em->getRepository(Meeting::class)->findBy([
            'status' => 'pending', 'meetingType' => 'auto',
        ]);

        $eventsMap = [];
        $usersMap = [];

        foreach ($meetings as $m) {
            $event = $m->getEvent();
            if ($event && !isset($eventsMap[$event->getId()])) {
                $eventsMap[$event->getId()] = ['id' => $event->getId(), 'title' => $event->getTitle()];
            }
            foreach ([$m->getRequester(), $m->getParticipant()] as $user) {
                $uid = $user->getId();
                if (!isset($usersMap[$uid])) {
                    $usersMap[$uid] = ['id' => $uid, 'firstName' => $user->getFirstName(), 'lastName' => $user->getLastName(), 'fullName' => $user->getFirstName() . ' ' . $user->getLastName(), 'email' => $user->getEmail(), 'meetingCount' => 0, 'eventIds' => []];
                }
                $usersMap[$uid]['meetingCount']++;
                if ($event && !in_array($event->getId(), $usersMap[$uid]['eventIds'])) {
                    $usersMap[$uid]['eventIds'][] = $event->getId();
                }
            }
        }

        $participants = array_values($usersMap);
        usort($participants, fn($a, $b) => $a['meetingCount'] - $b['meetingCount']);

        return $this->json(['participants' => $participants, 'events' => array_values($eventsMap)]);
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
            return $this->json(['message' => 'Access denied.'], 403);
        }
        $meeting->setStatus('accepted');
        $this->em->flush();

        $notification = new Notification();
        $notification->setUser($meeting->getRequester());
        $notification->setTitle('Meeting Accepted!');
        $notification->setMessage(
            $meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() .
            ' has accepted your meeting on ' . $meeting->getProposedAt()->format('d/m/Y at H:i')
        );
        $notification->setType('MEETING_ACCEPTED');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Meeting accepted!']);
    }

    #[Route('/{id}/reject', name: 'api_meeting_reject', methods: ['PUT'])]
    public function reject(Meeting $meeting): JsonResponse
    {
        if ($meeting->getParticipant() !== $this->getUser()) {
            return $this->json(['message' => 'Access denied.'], 403);
        }
        $meeting->setStatus('rejected');
        $this->em->flush();

        $notification = new Notification();
        $notification->setUser($meeting->getRequester());
        $notification->setTitle('Meeting Declined');
        $notification->setMessage(
            $meeting->getParticipant()->getFirstName() . ' ' . $meeting->getParticipant()->getLastName() .
            ' is not available at this date.'
        );
        $notification->setType('MEETING_REJECTED');
        $this->em->persist($notification);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Meeting declined.']);
    }

    private function isSlotBusy(int $userId, \DateTime $start, \DateTime $end): bool
    {
        $allAccepted = $this->em->getRepository(Meeting::class)->findBy(['status' => 'accepted']);
        foreach ($allAccepted as $slot) {
            if ($slot->getRequester()->getId() !== $userId && $slot->getParticipant()->getId() !== $userId) continue;
            if ($slot->getProposedAt()->format('Y') === '2099') continue;
            $slotEnd = (clone $slot->getProposedAt())->modify('+' . $slot->getDuration() . ' minutes');
            if ($start < $slotEnd && $end > $slot->getProposedAt()) return true;
        }
        return false;
    }

    private function isUserSlotBusy(array $slots, \DateTime $start, \DateTime $end): bool
    {
        foreach ($slots as $slot) {
            if ($start < $slot['end'] && $end > $slot['start']) return true;
        }
        return false;
    }

    private function formatMeeting(Meeting $m): array
    {
        $proposedAt = $m->getProposedAt()->format('Y') === '2099'
            ? 'To be assigned'
            : $m->getProposedAt()->format('Y-m-d H:i');

        return [
            'id' => $m->getId(),
            'status' => $m->getStatus(),
            'meetingType' => $m->getMeetingType(),
            'proposedAt' => $proposedAt,
            'duration' => $m->getDuration(),
            'tableNumber' => $m->getTableNumber(),
            'roomNumber' => $m->getRoomNumber(),
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
            'eventId' => $m->getEvent()?->getId(),
            'eventTitle' => $m->getEvent()?->getTitle(),
        ];
    }
}