<?php

namespace App\Entity;

use App\Repository\MeetingRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MeetingRepository::class)]
class Meeting
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    // Qui demande le meeting
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $requester = null;

    // Avec qui le meeting est demandé
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $participant = null;

    // Date et heure proposées
    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $proposedAt = null;

    // Durée en minutes
    #[ORM\Column]
    private int $duration = 30;

    // Status : pending, accepted, rejected
    #[ORM\Column(length: 20)]
    private string $status = 'pending';

    // Message optionnel
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $message = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    // Dans src/Entity/Meeting.php, ajoute ce champ :

    #[ORM\Column(length: 20)]
    private string $meetingType = 'manual'; // 'manual' ou 'auto'

    public function getMeetingType(): string { return $this->meetingType; }
    public function setMeetingType(string $meetingType): static { $this->meetingType = $meetingType; return $this; }
    
    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getRequester(): ?User { return $this->requester; }
    public function setRequester(?User $requester): static { $this->requester = $requester; return $this; }

    public function getParticipant(): ?User { return $this->participant; }
    public function setParticipant(?User $participant): static { $this->participant = $participant; return $this; }

    public function getProposedAt(): ?\DateTimeInterface { return $this->proposedAt; }
    public function setProposedAt(\DateTimeInterface $proposedAt): static { $this->proposedAt = $proposedAt; return $this; }

    public function getDuration(): int { return $this->duration; }
    public function setDuration(int $duration): static { $this->duration = $duration; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getMessage(): ?string { return $this->message; }
    public function setMessage(?string $message): static { $this->message = $message; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
}