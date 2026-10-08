<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Participants")]
#[Route('/api/participants')]
class ParticipantController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('', name: 'api_participants_list', methods: ['GET'])]
    public function index(): JsonResponse
    {
        // On affiche tous les utilisateurs sauf les admins (ou tu peux filtrer par rôle si tu veux)
        $users = $this->em->getRepository(User::class)->findBy([], ['createdAt' => 'DESC']);

        $data = array_map(fn(User $u) => [
            'id' => $u->getId(),
            'firstName' => $u->getFirstName(),
            'lastName' => $u->getLastName(),
            'fullName' => $u->getFirstName() . ' ' . $u->getLastName(),
            'email' => $u->getEmail(),
            'userRole' => $u->getUserRole(),
            'bio' => $u->getBio(),
            'avatar' => $u->getAvatar(),
            'country' => $u->getCountry(),
            'linkedin' => $u->getLinkedin(),
            'phone' => $u->getPhone(),
            'company' => $u->getCompanyName(),
            'companyName' => $u->getCompanyName(),
            'companyDescription' => $u->getCompanyDescription(),
            'companyAddress' => $u->getCompanyAddress(),
            'companyWebsite' => $u->getCompanyWebsite(),
            'companySize' => $u->getCompanySize(),
            'organisationType' => $u->getOrganisationType(),
            'sector' => $u->getSector(),
            'sectors' => $u->getSectors(),
            'businessObjectives' => $u->getBusinessObjectives(),
        ], $users);

        return $this->json($data);
    }
}