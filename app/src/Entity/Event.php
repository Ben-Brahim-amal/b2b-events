<?php

namespace App\Entity;

use App\Repository\EventRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: EventRepository::class)]
class Event
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: "Le titre est obligatoire.")]
    #[Assert\Length(min: 3, max: 255)]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Assert\NotNull(message: "La date est obligatoire.")]
    private ?\DateTimeInterface $date = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $startTime = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $endTime = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $location = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $city = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(name: 'max_participants', nullable: true)]
    private ?int $maxParticipants = null;

    #[ORM\Column(name: 'nb_room', nullable: true)]
    private ?int $nbRoom = null;

    #[ORM\Column(name: 'nb_table', nullable: true)]
    private ?int $nbTable = null;

    #[ORM\Column(name: 'session_duration', nullable: true)]
    private ?int $sessionDuration = null;

    #[ORM\Column(name: 'categories', length: 100, nullable: true)]
    private ?string $categories = null;

    #[ORM\Column(name: 'event_type', length: 50, nullable: true)]
    private ?string $eventType = null;

    #[ORM\Column(name: 'organiser_email', length: 255, nullable: true)]
    private ?string $organiserEmail = null;

    #[ORM\Column(name: 'organiser_phone', length: 50, nullable: true)]
    private ?string $organiserPhone = null;

    #[ORM\Column(name: 'organiser_name', length: 255, nullable: true)]
    private ?string $organiserName = null;

    #[ORM\Column(name: 'event_banner', length: 255, nullable: true)]
    private ?string $eventBanner = null;

    #[ORM\Column(name: 'areas_of_activity', type: Types::JSON, nullable: true)]
    private ?array $areasOfActivity = null;

    #[ORM\Column(name: 'targets', type: Types::JSON, nullable: true)]
    private ?array $targets = null;

    #[ORM\Column(name: 'sponsors', type: Types::JSON, nullable: true)]
    private ?array $sponsors = null;

    #[ORM\Column(length: 20)]
    private string $status = 'draft';

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(inversedBy: 'eventsOrganized')]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $organizer = null;

    #[ORM\OneToMany(mappedBy: 'event', targetEntity: EventSchedule::class, orphanRemoval: true)]
    private Collection $schedules;

    #[ORM\OneToMany(mappedBy: 'event', targetEntity: Registration::class)]
    private Collection $registrations;

    #[ORM\OneToMany(mappedBy: 'event', targetEntity: EventOrganiser::class, orphanRemoval: true)]
    private Collection $organisers;

    #[ORM\OneToMany(mappedBy: 'event', targetEntity: EventPage::class, orphanRemoval: true)]
    private Collection $pages;

    public function __construct()
    {
        $this->schedules = new ArrayCollection();
        $this->registrations = new ArrayCollection();
        $this->organisers = new ArrayCollection();
        $this->pages = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getTitle(): ?string { return $this->title; }
    public function setTitle(string $title): static { $this->title = $title; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getDate(): ?\DateTimeInterface { return $this->date; }
    public function setDate(\DateTimeInterface $date): static { $this->date = $date; return $this; }

    public function getStartTime(): ?\DateTimeInterface { return $this->startTime; }
    public function setStartTime(?\DateTimeInterface $startTime): static { $this->startTime = $startTime; return $this; }

    public function getEndTime(): ?\DateTimeInterface { return $this->endTime; }
    public function setEndTime(?\DateTimeInterface $endTime): static { $this->endTime = $endTime; return $this; }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $location): static { $this->location = $location; return $this; }

    public function getCity(): ?string { return $this->city; }
    public function setCity(?string $city): static { $this->city = $city; return $this; }

    public function getAddress(): ?string { return $this->address; }
    public function setAddress(?string $address): static { $this->address = $address; return $this; }

    public function getMaxParticipants(): ?int { return $this->maxParticipants; }
    public function setMaxParticipants(?int $maxParticipants): static { $this->maxParticipants = $maxParticipants; return $this; }

    public function getNbRoom(): ?int { return $this->nbRoom; }
    public function setNbRoom(?int $nbRoom): static { $this->nbRoom = $nbRoom; return $this; }

    public function getNbTable(): ?int { return $this->nbTable; }
    public function setNbTable(?int $nbTable): static { $this->nbTable = $nbTable; return $this; }

    public function getSessionDuration(): ?int { return $this->sessionDuration; }
    public function setSessionDuration(?int $sessionDuration): static { $this->sessionDuration = $sessionDuration; return $this; }

    public function getCategories(): ?string { return $this->categories; }
    public function setCategories(?string $categories): static { $this->categories = $categories; return $this; }

    public function getEventType(): ?string { return $this->eventType; }
    public function setEventType(?string $eventType): static { $this->eventType = $eventType; return $this; }

    public function getOrganiserEmail(): ?string { return $this->organiserEmail; }
    public function setOrganiserEmail(?string $organiserEmail): static { $this->organiserEmail = $organiserEmail; return $this; }

    public function getOrganiserPhone(): ?string { return $this->organiserPhone; }
    public function setOrganiserPhone(?string $organiserPhone): static { $this->organiserPhone = $organiserPhone; return $this; }

    public function getOrganiserName(): ?string { return $this->organiserName; }
    public function setOrganiserName(?string $organiserName): static { $this->organiserName = $organiserName; return $this; }

    public function getEventBanner(): ?string { return $this->eventBanner; }
    public function setEventBanner(?string $eventBanner): static { $this->eventBanner = $eventBanner; return $this; }

    public function getAreasOfActivity(): ?array { return $this->areasOfActivity; }
    public function setAreasOfActivity(?array $areasOfActivity): static { $this->areasOfActivity = $areasOfActivity; return $this; }

    public function getTargets(): ?array { return $this->targets; }
    public function setTargets(?array $targets): static { $this->targets = $targets; return $this; }

    public function getSponsors(): ?array { return $this->sponsors; }
    public function setSponsors(?array $sponsors): static { $this->sponsors = $sponsors; return $this; }

    public function getStatus(): string { return $this->status; }
    public function setStatus(string $status): static { $this->status = $status; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }
    public function setCreatedAt(\DateTimeImmutable $createdAt): static { $this->createdAt = $createdAt; return $this; }

    public function getOrganizer(): ?User { return $this->organizer; }
    public function setOrganizer(?User $organizer): static { $this->organizer = $organizer; return $this; }

    public function getSchedules(): Collection { return $this->schedules; }
    public function getRegistrations(): Collection { return $this->registrations; }
    public function getOrganisers(): Collection { return $this->organisers; }
    public function getPages(): Collection { return $this->pages; }

    public function addSchedule(EventSchedule $schedule): static
    {
        if (!$this->schedules->contains($schedule)) {
            $this->schedules->add($schedule);
            $schedule->setEvent($this);
        }
        return $this;
    }

    public function addOrganiser(EventOrganiser $organiser): static
    {
        if (!$this->organisers->contains($organiser)) {
            $this->organisers->add($organiser);
            $organiser->setEvent($this);
        }
        return $this;
    }

    public function addPage(EventPage $page): static
    {
        if (!$this->pages->contains($page)) {
            $this->pages->add($page);
            $page->setEvent($this);
        }
        return $this;
    }
}