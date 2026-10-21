<?php

namespace App\Support;

use App\Models\Project;
use App\Services\Generator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Schools that Studio serves itself: which host belongs to which published
 * school, and the rendered site data saved when a school is published.
 */
class HostedSites
{
    public const CACHE_KEY = 'studio:hosted-sites';

    /**
     * The published school that answers on a host, if any. Studio's own host
     * never belongs to a school.
     */
    public static function forHost(string $host): ?Project
    {
        $host = static::normalizeHost($host);

        if ($host === '' || $host === static::studioHost()) {
            return null;
        }

        $id = Cache::rememberForever(static::CACHE_KEY, fn (): array => Project::query()
            ->whereNotNull('published_at')
            ->get(['id', 'slug', 'domain'])
            ->flatMap(fn (Project $project): array => array_fill_keys(static::hostsFor($project), $project->id))
            ->all())[$host] ?? null;

        return $id ? Project::query()->whereNotNull('published_at')->find($id) : null;
    }

    public static function forget(): void
    {
        Cache::forget(static::CACHE_KEY);
    }

    /**
     * Every host a school answers on: its own domain and, when hosting is
     * configured, <slug>.<hosting domain>.
     *
     * @return list<string>
     */
    public static function hostsFor(Project $project): array
    {
        return array_values(array_filter([
            $project->domain ? static::normalizeHost($project->domain) : null,
            ($hostingDomain = config('studio.hosting_domain')) ? $project->slug.'.'.static::normalizeHost($hostingDomain) : null,
        ]));
    }

    /**
     * The address visitors use: the school's own domain, else its subdomain.
     */
    public static function url(Project $project): ?string
    {
        $host = static::hostsFor($project)[0] ?? null;

        return $host ? config('studio.hosting_scheme').'://'.$host : null;
    }

    public static function normalizeHost(string $host): string
    {
        return Str::of($host)->lower()->trim()->replaceMatches('#^[a-z]+://#', '')->before('/')->before(':')->rtrim('.')->replaceStart('www.', '')->toString();
    }

    public static function studioHost(): string
    {
        return static::normalizeHost((string) parse_url((string) config('app.url'), PHP_URL_HOST));
    }

    /**
     * Renders every language of the school with the generator and saves it, so
     * visitors are served without running the generator.
     *
     * @throws RuntimeException When the school has problems that stop it building.
     */
    public static function publish(Project $project, Generator $generator): void
    {
        $languages = array_values($project->config['languages'] ?? ['en']);
        $siteUrl = static::url($project);
        $config = $siteUrl ? [...$project->config, 'seo' => [...($project->config['seo'] ?? []), 'siteUrl' => $siteUrl]] : $project->config;
        $locales = [];

        foreach ($languages as $index => $language) {
            $preview = $generator->preview($config, $index === 0 ? null : $language);

            if (! $preview['ok']) {
                throw new RuntimeException(implode(' ', $preview['errors']));
            }

            $locales[$language] = ['site' => $preview['site'], 'tokens' => $preview['tokens'], 'extraCss' => $preview['extraCss']];
        }

        $project->forceFill([
            'published_site' => ['languages' => $languages, 'locales' => $locales, 'configHash' => static::configHash($project)],
            'published_at' => now(),
        ])->save();
    }

    /**
     * Whether the school was edited after it was last published.
     */
    public static function hasUnpublishedChanges(Project $project): bool
    {
        return $project->isPublished() && ($project->published_site['configHash'] ?? null) !== static::configHash($project);
    }

    protected static function configHash(Project $project): string
    {
        return md5(json_encode($project->config, JSON_THROW_ON_ERROR));
    }

    public static function unpublish(Project $project): void
    {
        $project->forceFill(['published_site' => null, 'published_at' => null])->save();
    }
}
