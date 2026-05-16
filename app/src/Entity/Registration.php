<?php

namespace App\Entity;

use App\Repository\RegistrationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: RegistrationRepository::class)]
class Registration
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    private string $status = 'PENDING';

    #[ORM\Column]
    private ?\DateTimeImmutable $registeredAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $processedAt = null;

    #[ORM\ManyToOne(inversedBy: 'registrations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $user = null;

    #[ORM\ManyToOne(inversedBy: 'registrations')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Event $event = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $processedBy = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $participationType = null;

    public function getParticipationType(): ?string { return $this->participationType; }
    public function setParticipationType(?string $participationType): static { $this->participationType = $participationType; return $this; }

    public function __construct()
    {
        $this->registeredAt = new \DateTimeImmutable();
        $this->status = 'PENDING';
    }

    public function getId(): ?int { return $this->id; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getRegisteredAt(): ?\DateTimeImmutable { return $this->registeredAt; }
    public function setRegisteredAt(\DateTimeImmutable $registeredAt): static { $this->registeredAt = $registeredAt; return $this; }

    public function getProcessedAt(): ?\DateTimeImmutable { return $this->processedAt; }
    public function setProcessedAt(?\DateTimeImmutable $processedAt): static { $this->processedAt = $processedAt; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getEvent(): ?Event { return $this->event; }
    public function setEvent(?Event $event): static { $this->event = $event; return $this; }

    public function getProcessedBy(): ?User { return $this->processedBy; }
    public function setProcessedBy(?User $processedBy): static { $this->processedBy = $processedBy; return $this; }

    // Méthodes métier utiles
    public function accept(User $processedBy): static
    {
        $this->status = 'ACCEPTED';
        $this->processedAt = new \DateTimeImmutable();
        $this->processedBy = $processedBy;
        return $this;
    }

    public function reject(User $processedBy): static
    {
        $this->status = 'REJECTED';
        $this->processedAt = new \DateTimeImmutable();
        $this->processedBy = $processedBy;
        return $this;
    }
}