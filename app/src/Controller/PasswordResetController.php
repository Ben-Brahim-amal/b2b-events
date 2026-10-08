<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

#[Route('/api')]
class PasswordResetController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher,
        private MailerInterface $mailer
    ) {}

    #[Route('/forgot-password', name: 'api_forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';

        $user = $this->em->getRepository(User::class)->findOneBy(['email' => $email]);

        // Toujours retourner succès pour ne pas révéler si l'email existe
        if (!$user) {
            return $this->json([
                'status' => 'success',
                'message' => 'If this email exists, a reset link has been sent.'
            ]);
        }

        // Générer token unique
        $token = bin2hex(random_bytes(32));
        $user->setResetToken($token);
        $user->setResetTokenExpiresAt(new \DateTimeImmutable('+1 hour'));
        $this->em->flush();

        // Lien de reset
        $resetLink = 'http://localhost:3000/reset-password?token=' . $token;

        // Envoyer email
        try {
            $email = (new Email())
                ->from('noreply@b2bevents.com')
                ->to($user->getEmail())
                ->subject('Reset your B2B Events password')
                ->html("
                    <div style='font-family: Segoe UI, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background: linear-gradient(135deg, #1a0533, #7c3aed); padding: 32px; text-align: center;'>
                            <h1 style='color: white; margin: 0; font-size: 1.5rem;'>B2B Events</h1>
                        </div>
                        <div style='padding: 32px; background: #f8fafc;'>
                            <h2 style='color: #1a1a2e;'>Password Reset Request</h2>
                            <p style='color: #64748b;'>Hello {$user->getFirstName()},</p>
                            <p style='color: #64748b;'>You requested to reset your password. Click the button below to proceed.</p>
                            <div style='text-align: center; margin: 32px 0;'>
                                <a href='{$resetLink}' style='background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px;'>
                                    Reset Password
                                </a>
                            </div>
                            <p style='color: #94a3b8; font-size: 13px;'>This link expires in 1 hour. If you did not request this, ignore this email.</p>
                        </div>
                    </div>
                ");
            $this->mailer->send($email);
        } catch (\Exception $e) {
            // Log silencieux — ne pas révéler l'erreur
        }

        return $this->json([
            'status' => 'success',
            'message' => 'If this email exists, a reset link has been sent.'
        ]);
    }

    #[Route('/reset-password', name: 'api_reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $token = $data['token'] ?? '';
        $newPassword = $data['password'] ?? '';

        if (!$token || !$newPassword) {
            return $this->json(['message' => 'Token and password are required.'], 400);
        }

        if (strlen($newPassword) < 6) {
            return $this->json(['message' => 'Password must be at least 6 characters.'], 400);
        }

        $user = $this->em->getRepository(User::class)->findOneBy(['resetToken' => $token]);

        if (!$user) {
            return $this->json(['message' => 'Invalid or expired token.'], 400);
        }

        if ($user->getResetTokenExpiresAt() < new \DateTimeImmutable()) {
            return $this->json(['message' => 'This link has expired. Please request a new one.'], 400);
        }

        // Changer le mot de passe
        $user->setPassword($this->hasher->hashPassword($user, $newPassword));
        $user->setResetToken(null);
        $user->setResetTokenExpiresAt(null);
        $this->em->flush();

        return $this->json([
            'status' => 'success',
            'message' => 'Password changed successfully! You can now log in.'
        ]);
    }

    #[Route('/reset-password/verify', name: 'api_reset_password_verify', methods: ['GET'])]
    public function verifyToken(Request $request): JsonResponse
    {
        $token = $request->query->get('token', '');

        $user = $this->em->getRepository(User::class)->findOneBy(['resetToken' => $token]);

        if (!$user || $user->getResetTokenExpiresAt() < new \DateTimeImmutable()) {
            return $this->json(['valid' => false, 'message' => 'Invalid or expired token.'], 400);
        }

        return $this->json([
            'valid' => true,
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
        ]);
    }
}