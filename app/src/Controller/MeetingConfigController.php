<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/meeting-config')]
class MeetingConfigController extends AbstractController
{
    private static string $configFile = __DIR__ . '/../../var/meeting_config.json';

    #[Route('', name: 'api_meeting_config_get', methods: ['GET'])]
    public function getConfig(): JsonResponse
    {
        if (!file_exists(self::$configFile)) {
            return $this->json(['method' => 'manual']);
        }
        return $this->json(json_decode(file_get_contents(self::$configFile), true));
    }

    #[Route('', name: 'api_meeting_config_set', methods: ['PUT'])]
    public function setConfig(Request $request): JsonResponse
    {
        if (!in_array('ROLE_ADMIN', $this->getUser()->getRoles())) {
            return $this->json(['message' => 'Acces refuse.'], 403);
        }

        $data = json_decode($request->getContent(), true);
        $method = $data['method'] ?? 'manual';

        if (!in_array($method, ['manual', 'auto'])) {
            return $this->json(['message' => 'Methode invalide.'], 400);
        }

        file_put_contents(self::$configFile, json_encode(['method' => $method]));

        return $this->json(['status' => 'success', 'method' => $method]);
    }
}