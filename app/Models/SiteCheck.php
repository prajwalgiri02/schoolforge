<?php

namespace App\Models;

use Database\Factories\SiteCheckFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One visit to a live school website's health endpoint.
 *
 * @property list<array{name: string, status: string, message: string}>|null $checks
 */
#[Fillable(['url', 'status', 'http_status', 'response_ms', 'checks', 'error', 'created_at'])]
class SiteCheck extends Model
{
    /** @use HasFactory<SiteCheckFactory> */
    use HasFactory;

    public const UPDATED_AT = null;

    public const STATUS_OK = 'ok';

    public const STATUS_WARNING = 'warning';

    public const STATUS_FAILING = 'failing';

    /** The site did not answer at all (DNS, TLS, timeout or connection refused). */
    public const STATUS_DOWN = 'down';

    /** How many checks each project keeps (a day at one check every five minutes). */
    public const KEEP = 288;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'checks' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function isProblem(): bool
    {
        return in_array($this->status, [self::STATUS_FAILING, self::STATUS_DOWN], true);
    }
}
