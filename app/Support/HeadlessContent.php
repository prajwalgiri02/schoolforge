<?php

namespace App\Support;

use App\Models\Project;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Next.js sites that read their content from Studio (headless mode): the
 * token they authenticate with, and telling them to refresh after a publish.
 */
class HeadlessContent
{
    public static function isEnabled(Project $project): bool
    {
        return filled($project->content_token);
    }

    public static function enable(Project $project): void
    {
        $project->forceFill(['content_token' => 'sfc_'.Str::random(40)])->save();
    }

    public static function disable(Project $project): void
    {
        $project->forceFill(['content_token' => null])->save();
    }

    public static function contentUrl(Project $project): string
    {
        return route('api.content', $project);
    }

    /**
     * The live site's refresh endpoint, from the school's site URL.
     */
    public static function revalidateUrl(Project $project): ?string
    {
        $siteUrl = rtrim((string) ($project->config['seo']['siteUrl'] ?? ''), '/');

        return preg_match('#^https?://[^/\s]+#i', $siteUrl) ? "{$siteUrl}/api/revalidate" : null;
    }

    /**
     * Asks the live site to refresh its content now; returns a sentence for
     * the person who published.
     */
    public static function refreshSite(Project $project): string
    {
        if (! $url = static::revalidateUrl($project)) {
            return 'Set the site URL (SEO) so Studio can tell the website to refresh; until then it refreshes within an hour.';
        }

        try {
            $response = Http::timeout(15)->acceptJson()->withToken($project->content_token)->post($url);
        } catch (ConnectionException) {
            return "The website at {$url} could not be reached to refresh; it refreshes within an hour.";
        }

        return $response->successful()
            ? 'The website refreshed its content.'
            : "The website did not accept the refresh (HTTP {$response->status()}); check its SCHOOLFORGE_CONTENT_TOKEN.";
    }
}
