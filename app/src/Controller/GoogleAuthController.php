<?php

namespace App\Controller;

use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class GoogleAuthController extends AbstractController
{
    #[Route('/auth/google', name: 'auth_google_start')]
    public function start(ClientRegistry $registry): RedirectResponse
    {
        return $registry->getClient('google')->redirect(['email', 'profile'], []);
    }

    #[Route('/auth/google/callback', name: 'auth_google_callback')]
    public function callback(): Response
    {
        // L'authenticator GoogleAuthenticator gère cette route
        // Ce code ne devrait jamais être atteint
        return new RedirectResponse('http://localhost:3000/login?error=auth_failed');
    }
}