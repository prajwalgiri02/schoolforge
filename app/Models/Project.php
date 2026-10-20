<?php

namespace App\Models;

use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

/**
 * A school website managed in Studio. `config` holds a complete SchoolForge
 * school config (the same shape as school.config.json).
 *
 * @property array<string, mixed> $config
 */
#[Fillable(['name', 'slug', 'config', 'output_path'])]
class Project extends Model
{
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
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Project $project): void {
            $project->name = $project->config['school']['name'] ?? $project->name;
            $project->slug ??= static::uniqueSlug($project->name);
        });
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
