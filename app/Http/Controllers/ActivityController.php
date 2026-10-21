<?php

namespace App\Http\Controllers;

use App\Models\AuditEvent;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Who did what in Studio, newest first. Only owners see this.
 */
class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'school' => ['nullable', 'integer'],
            'user' => ['nullable', 'integer'],
        ]);

        return Inertia::render('Activity/Index', [
            'events' => AuditEvent::query()
                ->with(['user:id,name', 'project:id,name,slug'])
                ->when($filters['school'] ?? null, fn ($query, int $school) => $query->where('project_id', $school))
                ->when($filters['user'] ?? null, fn ($query, int $user) => $query->where('user_id', $user))
                ->latest('id')
                ->paginate(50)
                ->withQueryString()
                ->through(fn (AuditEvent $event): array => [
                    'id' => $event->id,
                    'action' => $event->action,
                    'description' => $event->description,
                    'user' => $event->user?->name,
                    'school' => $event->project?->only('name', 'slug'),
                    'ipAddress' => $event->ip_address,
                    'at' => $event->created_at->toIso8601String(),
                ]),
            'filters' => ['school' => $filters['school'] ?? null, 'user' => $filters['user'] ?? null],
            'schools' => Project::query()->orderBy('name')->get(['id', 'name']),
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
