<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A contact message, form or alert sign-up sent from a school website that
 * Studio hosts.
 *
 * @property array<string, string> $data
 * @property array<string, array{path: string, name: string}>|null $files
 */
#[Fillable(['form', 'reference', 'data', 'files', 'read_at'])]
class SiteSubmission extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
            'files' => 'array',
            'read_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
