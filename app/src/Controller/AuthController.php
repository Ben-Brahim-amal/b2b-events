<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentification")]
#[Route('/api')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator
    ) {}

    #[OA\Post(
        path: "/api/register",
        summary: "Creer un compte utilisateur",
        security: [],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email", "password", "firstName", "lastName"],
                properties: [
                    new OA\Property(property: "email", type: "string", example: "amal@test.com"),
                    new OA\Property(property: "password", type: "string", example: "password123"),
                    new OA\Property(property: "firstName", type: "string", example: "Amal"),
                    new OA\Property(property: "lastName", type: "string", example: "Ben Brahim"),
                    new OA\Property(property: "userRole", type: "string", example: "ROLE_ENTREPRENEUR"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Compte cree avec succes"),
            new OA\Response(response: 400, description: "Donnees invalides"),
            new OA\Response(response: 409, description: "Email deja utilise"),
        ]
    )]
    #[Route('/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($data['email'] ?? '');
        $user->setFirstName($data['firstName'] ?? '');
        $user->setLastName($data['lastName'] ?? '');
        $user->setBio($data['bio'] ?? null);
        $user->setUserRole($data['userRole'] ?? 'ROLE_ENTREPRENEUR');
        $user->setPassword($data['password'] ?? '');

        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['status' => 'error', 'errors' => $errorMessages], 400);
        }

        $existingUser = $this->em->getRepository(User::class)->findOneBy(['email' => $user->getEmail()]);
        if ($existingUser) {
            return $this->json(['status' => 'error', 'message' => 'Email deja utilise.'], 409);
        }

        $user->setPassword(
            $this->passwordHasher->hashPassword($user, $data['password'])
        );

        $this->em->persist($user);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Compte cree avec succes !',
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName(),
                'userRole' => $user->getUserRole(),
            ]
        ], 201);
    }

    #[OA\Get(
        path: "/api/me",
        summary: "Profil de l'utilisateur connecte",
        responses: [
            new OA\Response(response: 200, description: "Profil retourne"),
            new OA\Response(response: 401, description: "Token JWT manquant ou invalide"),
        ]
    )]
    /*
    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'bio' => $user->getBio(),
            'userRole' => $user->getUserRole(),
            'roles' => $user->getRoles(),
            'createdAt' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ]);
    }*/

    #[Route('/me', name: 'api_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'bio' => $user->getBio(),
            'phone' => $user->getPhone(),
            'linkedin' => $user->getLinkedin(),
            'country' => $user->getCountry(),
            'avatar' => $user->getAvatar(),
            'companyName' => $user->getCompanyName(),
            'companyDescription' => $user->getCompanyDescription(),
            'companyAddress' => $user->getCompanyAddress(),
            'userRole' => $user->getUserRole(),
            'roles' => $user->getRoles(),
        ]);
    }

    #[Route('/profile', name: 'api_profile_update', methods: ['PUT'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (isset($data['firstName'])) $user->setFirstName($data['firstName']);
        if (isset($data['lastName'])) $user->setLastName($data['lastName']);
        if (isset($data['bio'])) $user->setBio($data['bio']);
        if (isset($data['phone'])) $user->setPhone($data['phone']);
        if (isset($data['linkedin'])) $user->setLinkedin($data['linkedin']);
        if (isset($data['country'])) $user->setCountry($data['country']);
        if (isset($data['avatar'])) $user->setAvatar($data['avatar']);
        if (isset($data['companyName'])) $user->setCompanyName($data['companyName']);
        if (isset($data['companyDescription'])) $user->setCompanyDescription($data['companyDescription']);
        if (isset($data['companyAddress'])) $user->setCompanyAddress($data['companyAddress']);

        $this->em->flush();
        return $this->json(['status' => 'success', 'message' => 'Profil mis a jour !']);
    }

    #[Route('/profile/password', name: 'api_profile_password', methods: ['PUT'])]
    public function changePassword(
        Request $request,
        \Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface $hasher
    ): JsonResponse
    {
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['currentPassword']) || !isset($data['newPassword'])) {
            return $this->json(['message' => 'Champs obligatoires manquants.'], 400);
        }

        if (!$hasher->isPasswordValid($user, $data['currentPassword'])) {
            return $this->json(['message' => 'Mot de passe actuel incorrect.'], 400);
        }

        if (strlen($data['newPassword']) < 6) {
            return $this->json(['message' => 'Le nouveau mot de passe doit contenir au moins 6 caracteres.'], 400);
        }

        $user->setPassword($hasher->hashPassword($user, $data['newPassword']));
        $this->em->flush();

        return $this->json(['status' => 'success', 'message' => 'Mot de passe modifie !']);
    }

}