<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Upload")]
#[Route('/api')]
class UploadController extends AbstractController
{
    #[Route('/upload', name: 'api_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $file = $request->files->get('file');

        if (!$file) {
            return $this->json(['error' => 'Aucun fichier recu.'], 400);
        }

        // Vérifier le type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file->getMimeType(), $allowedTypes)) {
            return $this->json(['error' => 'Type de fichier non autorise.'], 400);
        }

        // Générer un nom unique
        $filename = uniqid() . '.' . $file->guessExtension();

        // Déplacer vers le dossier public
        $uploadDir = $this->getParameter('kernel.project_dir') . '/public/uploads';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $file->move($uploadDir, $filename);

        return $this->json([
            'status' => 'success',
            'filename' => $filename,
            'url' => '/uploads/' . $filename,
        ]);
    }
}