<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Something someone did in Studio: signing in, publishing a school, changing
 * a login, recording a payment… Kept for a year.
 */
#[Fillable(['user_id', 'project_id', 'action', 'description', 'ip_address', 'created_at'])]
class AuditEvent extends Model
{
    use Prunable;

    public const UPDATED_AT = null;

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return Builder<AuditEvent>
     */
    public function prunable(): Builder
    {
        return static::query()->where('created_at', '<', now()->subYear());
    }
}
