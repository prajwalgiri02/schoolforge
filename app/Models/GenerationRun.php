<?php

namespace App\Models;

use Database\Factories\GenerationRunFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One request to write (or sync) a project's codebase to disk.
 */
#[Fillable(['project_id', 'user_id', 'target', 'output_path', 'install', 'git_commit', 'git_remote', 'status', 'log', 'started_at', 'finished_at'])]
class GenerationRun extends Model
{
    /** @use HasFactory<GenerationRunFactory> */
    use HasFactory;

    public const STATUS_QUEUED = 'queued';

    public const STATUS_RUNNING = 'running';

    public const STATUS_SUCCEEDED = 'succeeded';

    public const STATUS_FAILED = 'failed';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'install' => 'boolean',
            'git_commit' => 'boolean',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function isFinished(): bool
    {
        return in_array($this->status, [self::STATUS_SUCCEEDED, self::STATUS_FAILED], true);
    }

    public function appendLog(string $output): void
    {
        $this->log = mb_substr(($this->log ?? '').$output, -200_000);
    }
}
