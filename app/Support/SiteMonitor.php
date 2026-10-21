<?php

namespace App\Support;

use App\Enums\StudioRole;
use App\Models\Project;
use App\Models\SiteCheck;
use App\Models\User;
use App\Notifications\SiteStatusChanged;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

/**
 * Checks live school websites through the health endpoint every generated
 * site has (/health on Laravel, /api/health on Next.js) and tells Studio
 * owners when a site goes down or comes back.
 */
class SiteMonitor
{
    /**
     * The health URL of a project's live site, or null when it has no valid site URL.
     */
    public static function healthUrl(Project $project): ?string
    {
        $siteUrl = rtrim((string) ($project->config['seo']['siteUrl'] ?? ''), '/');

        if (! preg_match('#^https?://[^/\s]+#i', $siteUrl)) {
            return null;
        }

        return $siteUrl.($project->target() === 'laravel-inertia-react' ? '/health' : '/api/health');
    }

    /**
     * Checks one project's site, stores the result and notifies owners if it
     * changed between working and not working.
     */
    public static function check(Project $project): ?SiteCheck
    {
        if (! $url = static::healthUrl($project)) {
            return null;
        }

        $previous = $project->latestSiteCheck()->first();
        $started = microtime(true);

        try {
            $response = Http::timeout(15)->connectTimeout(10)->acceptJson()->withUserAgent('SchoolForge Studio monitor')->get($url);
            $body = $response->json();
            $reported = is_array($body) && in_array($body['status'] ?? null, [SiteCheck::STATUS_OK, SiteCheck::STATUS_WARNING, SiteCheck::STATUS_FAILING], true) ? $body['status'] : null;

            $result = [
                'status' => match (true) {
                    $response->successful() && $reported !== null => $reported,
                    $response->successful() => SiteCheck::STATUS_WARNING,
                    default => SiteCheck::STATUS_FAILING,
                },
                'http_status' => $response->status(),
                'checks' => is_array($body['checks'] ?? null) ? static::cleanChecks($body['checks']) : null,
                'error' => match (true) {
                    $response->successful() && $reported === null => 'The site answered, but not with a SchoolForge health report. Regenerate it to add one.',
                    ! $response->successful() && $reported === null => "The site answered with HTTP {$response->status()}.",
                    default => null,
                },
            ];
        } catch (ConnectionException $exception) {
            $result = ['status' => SiteCheck::STATUS_DOWN, 'http_status' => null, 'checks' => null, 'error' => Str::limit($exception->getMessage(), 480)];
        }

        $check = $project->siteChecks()->create([
            ...$result,
            'url' => $url,
            'response_ms' => (int) round((microtime(true) - $started) * 1000),
            'created_at' => now(),
        ]);

        $project->siteChecks()->orderByDesc('id')->skip(SiteCheck::KEEP)->take(PHP_INT_MAX)->pluck('id')
            ->whenNotEmpty(fn ($ids) => SiteCheck::query()->whereIn('id', $ids)->delete());

        if ($check->isProblem() !== ($previous?->isProblem() ?? false)) {
            Notification::send(User::query()->where('role', StudioRole::Owner)->get(), new SiteStatusChanged($project, $check));
        }

        return $check;
    }

    /**
     * Keeps only well-formed check rows from the (untrusted) health report.
     *
     * @param  array<mixed>  $checks
     * @return list<array{name: string, status: string, message: string}>
     */
    protected static function cleanChecks(array $checks): array
    {
        return collect($checks)
            ->filter(fn ($check): bool => is_array($check) && is_string($check['name'] ?? null) && is_string($check['status'] ?? null))
            ->take(20)
            ->map(fn (array $check): array => [
                'name' => Str::limit($check['name'], 40, ''),
                'status' => Str::limit($check['status'], 20, ''),
                'message' => Str::limit(is_string($check['message'] ?? null) ? $check['message'] : '', 300),
            ])
            ->values()
            ->all();
    }
}
