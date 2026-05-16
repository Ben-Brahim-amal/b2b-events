<?php

namespace App\Repository;

use App\Entity\Meeting;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MeetingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Meeting::class);
    }

    public function findBusySlots(int $userId): array
    {
        return $this->createQueryBuilder('m')
            ->where('(m.participant = :userId OR m.requester = :userId)')
            ->andWhere('m.status = :status')
            ->andWhere('m.proposedAt != :tempDate')
            ->setParameter('userId', $userId)
            ->setParameter('status', 'accepted')
            ->setParameter('tempDate', new \DateTime('2099-01-01'))
            ->getQuery()
            ->getResult();
    }

    public function findUserMeetingsOptimized($user): array
    {
        $sent = $this->createQueryBuilder('m')
            ->leftJoin('m.requester', 'req')
            ->leftJoin('m.participant', 'par')
            ->addSelect('req', 'par')
            ->where('m.requester = :user')
            ->setParameter('user', $user)
            ->orderBy('m.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $received = $this->createQueryBuilder('m')
            ->leftJoin('m.requester', 'req')
            ->leftJoin('m.participant', 'par')
            ->addSelect('req', 'par')
            ->where('m.participant = :user')
            ->setParameter('user', $user)
            ->orderBy('m.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return ['sent' => $sent, 'received' => $received];
    }
}