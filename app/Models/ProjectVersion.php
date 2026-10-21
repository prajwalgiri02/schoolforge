<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A snapshot of a project's config, saved every time it changes, so earlier
 * versions can be compared and restored.
 *
 * @property array<string, mixed> $config
 */
#[Fillable(['user_id', 'summary', 'config', 'created_at'])]
class ProjectVersion extends Model
{
    public const UPDATED_AT = null;

    /** How many versions each project keeps. */
    public const KEEP = 100;

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

    /**
     * @return BelongsTo<Project, $this>
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Describes what changed between two configs, e.g. "Changed hero and colors".
     *
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     */
    public static function describe(array $before, array $after): string
    {
        $keys = collect(array_unique([...array_keys($before), ...array_keys($after)]))
            ->filter(fn (string $key): bool => ($before[$key] ?? null) != ($after[$key] ?? null))
            ->flatMap(fn (string $key): array => $key === 'translations'
                ? array_map(fn (string $locale): string => "{$locale} translation", array_keys(array_filter(
                    [...($before['translations'] ?? []), ...($after['translations'] ?? [])],
                    fn ($value, string $locale): bool => ($before['translations'][$locale] ?? null) != ($after['translations'][$locale] ?? null),
                    ARRAY_FILTER_USE_BOTH,
                )))
                : [$key === 'school' ? 'school details' : $key])
            ->values();

        return match ($keys->count()) {
            0 => 'No changes',
            1, 2, 3 => 'Changed '.$keys->join(', ', ' and '),
            default => 'Changed '.$keys->take(2)->join(', ').' and '.($keys->count() - 2).' more',
        };
    }
}
