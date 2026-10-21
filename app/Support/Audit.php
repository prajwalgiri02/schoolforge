<?php

namespace App\Support;

use App\Models\AuditEvent;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Records who did what in Studio, for the Activity page.
 */
class Audit
{
    public static function record(string $action, string $description, ?Project $project = null, ?User $user = null): void
    {
        AuditEvent::create([
            'user_id' => ($user ?? auth()->user())?->id,
            'project_id' => $project?->exists ? $project->id : null,
            'action' => $action,
            'description' => Str::limit($description, 490),
            'ip_address' => app()->runningInConsole() ? null : request()->ip(),
            'created_at' => now(),
        ]);
    }
}
