<?php

namespace App\Repository;

use App\Entity\Event;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    public function findPublishedWithDetails(): array
    {
        return $this->createQueryBuilder('e')
            ->leftJoin('e.organizer', 'o')
            ->leftJoin('e.organisers', 'org')
            ->leftJoin('e.registrations', 'r')
            ->leftJoin('e.pages', 'p')
            ->addSelect('o', 'org', 'r', 'p')
            ->where('e.status = :status')
            ->setParameter('status', 'published')
            ->orderBy('e.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneWithDetails(int $id): ?Event
    {
        return $this->createQueryBuilder('e')
            ->leftJoin('e.organizer', 'o')
            ->leftJoin('e.organisers', 'org')
            ->leftJoin('e.registrations', 'r')
            ->leftJoin('e.pages', 'p')
            ->leftJoin('e.schedules', 's')
            ->addSelect('o', 'org', 'r', 'p', 's')
            ->where('e.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findByOrganizerWithDetails($user): array
    {
        return $this->createQueryBuilder('e')
            ->leftJoin('e.organizer', 'o')
            ->leftJoin('e.registrations', 'r')
            ->addSelect('o', 'r')
            ->where('e.organizer = :user')
            ->setParameter('user', $user)
            ->orderBy('e.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}