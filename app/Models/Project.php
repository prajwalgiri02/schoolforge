<?php

namespace App\Models;

use App\Support\Audit;
use App\Support\HostedSites;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * A school website managed in Studio. `config` holds a complete SchoolForge
 * school config (the same shape as school.config.json).
 *
 * @property array<string, mixed> $config
 * @property array{languages: list<string>, locales: array<string, array<string, mixed>>, configHash: string}|null $published_site
 */
#[Fillable(['name', 'slug', 'config', 'output_path', 'git_remote', 'is_template', 'domain', 'published_at', 'published_site', 'plan_id', 'paid_until', 'billing_email'])]
#[Hidden(['published_site', 'content_token'])]
class Project extends Model
{
    /** Overrides the automatic description of the next saved change. */
    public ?string $versionSummary = null;

    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'config' => 'array',
            'is_template' => 'boolean',
            'published_at' => 'datetime',
            'published_site' => 'array',
            'paid_until' => 'date',
            'content_token' => 'encrypted',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Project $project): void {
            $project->name = $project->config['school']['name'] ?? $project->name;
            $project->slug ??= static::uniqueSlug($project->name);
        });

        static::created(fn (Project $project) => $project->recordVersion('Created'));

        static::saved(function (Project $project): void {
            if ($project->wasChanged(['slug', 'domain', 'published_at']) || $project->wasRecentlyCreated) {
                HostedSites::forget();
            }
        });

        static::deleted(fn () => HostedSites::forget());

        static::updated(function (Project $project): void {
            if ($project->wasChanged('config')) {
                $project->recordVersion($project->versionSummary ?? ProjectVersion::describe(json_decode((string) $project->getRawOriginal('config'), true) ?? [], $project->config));
                $project->versionSummary = null;
            }
        });
    }

    /**
     * Saves the current config to the history, keeping the newest versions.
     */
    public function recordVersion(string $summary): void
    {
        $this->versions()->create(['user_id' => auth()->id(), 'summary' => $summary, 'config' => $this->config, 'created_at' => now()]);
        Audit::record('content.changed', "{$this->name}: {$summary}", $this);

        $this->versions()->orderByDesc('id')->skip(ProjectVersion::KEEP)->take(PHP_INT_MAX)->pluck('id')
            ->whenNotEmpty(fn ($ids) => ProjectVersion::query()->whereIn('id', $ids)->delete());
    }

    /**
     * @return HasMany<ProjectVersion, $this>
     */
    public function versions(): HasMany
    {
        return $this->hasMany(ProjectVersion::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * @return HasMany<GenerationRun, $this>
     */
    public function generationRuns(): HasMany
    {
        return $this->hasMany(GenerationRun::class);
    }

    /**
     * @return HasOne<GenerationRun, $this>
     */
    public function latestGenerationRun(): HasOne
    {
        return $this->hasOne(GenerationRun::class)->latestOfMany();
    }

    /**
     * @return HasMany<SiteCheck, $this>
     */
    public function siteChecks(): HasMany
    {
        return $this->hasMany(SiteCheck::class);
    }

    /**
     * @return HasOne<SiteCheck, $this>
     */
    public function latestSiteCheck(): HasOne
    {
        return $this->hasOne(SiteCheck::class)->latestOfMany();
    }

    /**
     * @return HasMany<SiteSubmission, $this>
     */
    public function siteSubmissions(): HasMany
    {
        return $this->hasMany(SiteSubmission::class);
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * @return HasMany<PublishedPage, $this>
     */
    public function publishedPages(): HasMany
    {
        return $this->hasMany(PublishedPage::class);
    }

    public function isPublished(): bool
    {
        return $this->published_at !== null;
    }

    public function target(): string
    {
        return $this->config['target'] ?? 'nextjs';
    }

    public function theme(): string
    {
        return $this->config['theme'] ?? 'classic';
    }

    /**
     * Default folder for this project's generated codebase.
     */
    public function defaultOutputPath(): string
    {
        return rtrim(config('studio.output_path'), '/').'/'.$this->slug;
    }

    public static function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'school';
        $slug = $base;

        for ($suffix = 2; static::query()->where('slug', $slug)->exists(); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }
}
