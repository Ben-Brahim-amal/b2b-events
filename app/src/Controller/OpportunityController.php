<?php

namespace App\Controller;

use App\Entity\Opportunity;
use App\Repository\OpportunityRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/opportunities')]
class OpportunityController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private OpportunityRepository $repo
    ) {}

    // GET toutes les opportunités (public)
    #[Route('', name: 'api_opportunities_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $opportunities = $this->repo->findBy([], ['createdAt' => 'DESC']);
        return $this->json(array_map([$this, 'format'], $opportunities));
    }

    // GET mes opportunités
    #[Route('/my', name: 'api_opportunities_my', methods: ['GET'])]
    public function my(): JsonResponse
    {
        $opportunities = $this->repo->findBy(
            ['user' => $this->getUser()],
            ['createdAt' => 'DESC']
        );
        return $this->json(array_map([$this, 'format'], $opportunities));
    }

    // POST créer une opportunité
    #[Route('', name: 'api_opportunities_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true) ?? [];
        $user = $this->getUser();

        $opportunity = new Opportunity();
        $opportunity->setUser($user);
        $opportunity->setType($data['type'] ?? 'product');
        $opportunity->setTitle($data['title'] ?? '');
        $opportunity->setDescription($data['description'] ?? null);
        $opportunity->setPhotos($data['photos'] ?? null);

        $this->em->persist($opportunity);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'opportunity' => $this->format($opportunity)
        ], 201);
    }

    // PUT modifier une opportunité
    #[Route('/{id}', name: 'api_opportunities_update', methods: ['PUT'])]
    public function update(Request $request, Opportunity $opportunity): JsonResponse
    {
        if ($opportunity->getUser() !== $this->getUser()) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['type'])) $opportunity->setType($data['type']);
        if (isset($data['title'])) $opportunity->setTitle($data['title']);
        if (isset($data['description'])) $opportunity->setDescription($data['description']);
        if (isset($data['photos'])) $opportunity->setPhotos($data['photos']);
        $opportunity->setUpdatedAt(new \DateTimeImmutable());

        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'opportunity' => $this->format($opportunity)
        ]);
    }

    // DELETE supprimer une opportunité
    #[Route('/{id}', name: 'api_opportunities_delete', methods: ['DELETE'])]
    public function delete(Opportunity $opportunity): JsonResponse
    {
        if ($opportunity->getUser() !== $this->getUser()) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $this->em->remove($opportunity);
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Opportunite supprimee.']);
    }

    private function format(Opportunity $o): array
    {
        return [
            'id' => $o->getId(),
            'type' => $o->getType(),
            'title' => $o->getTitle(),
            'description' => $o->getDescription(),
            'photos' => $o->getPhotos() ?? [],
            'createdAt' => $o->getCreatedAt()->format('Y-m-d H:i:s'),
            'user' => [
                'id' => $o->getUser()->getId(),
                'firstName' => $o->getUser()->getFirstName(),
                'lastName' => $o->getUser()->getLastName(),
                'fullName' => $o->getUser()->getFirstName() . ' ' . $o->getUser()->getLastName(),
                'userRole' => $o->getUser()->getUserRole(),
                'bio' => $o->getUser()->getBio(),
            ],
        ];
    }
}