<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class EventScheduleControllerexitController extends AbstractController
{
    #[Route('/event/schedule/controllerexit', name: 'app_event_schedule_controllerexit')]
    public function index(): Response
    {
        return $this->render('event_schedule_controllerexit/index.html.twig', [
            'controller_name' => 'EventScheduleControllerexitController',
        ]);
    }
}
