<?php

namespace App\Support;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Page views of hosted schools, counted on the server without cookies.
 * Visitors are counted per day by a salted hash of their address and browser
 * that changes every day, so no one can be followed from one day to the next.
 */
class SiteAnalytics
{
    /** Days of history kept. */
    public const KEEP_DAYS = 400;

    private const BOT = '/bot|crawl|spider|slurp|preview|monitor|curl|wget|python|headless|lighthouse|SchoolForge/i';

    public static function record(Project $project, Request $request, string $path): void
    {
        $agent = (string) $request->userAgent();

        if ($agent === '' || preg_match(self::BOT, $agent) === 1) {
            return;
        }

        $today = today()->toDateString();

        DB::table('page_views')->upsert(
            [['project_id' => $project->id, 'date' => $today, 'path' => mb_substr($path, 0, 255), 'views' => 1]],
            ['project_id', 'date', 'path'],
            ['views' => DB::raw('views + 1')],
        );

        DB::table('site_visitors')->insertOrIgnore([
            'project_id' => $project->id,
            'date' => $today,
            'visitor' => hash_hmac('sha256', $request->ip().'|'.$agent, config('app.key').'|'.$today),
        ]);
    }

    /**
     * Views and visitors per day, totals and the most read pages.
     *
     * @return array{days: list<array{date: string, views: int, visitors: int}>, views: int, visitors: int, topPages: list<array{path: string, views: int}>}
     */
    public static function summary(Project $project, int $days = 30): array
    {
        $from = today()->subDays($days - 1);
        $views = DB::table('page_views')->where('project_id', $project->id)->where('date', '>=', $from)
            ->groupBy('date')->selectRaw('date, sum(views) as total')->pluck('total', 'date');
        $visitors = DB::table('site_visitors')->where('project_id', $project->id)->where('date', '>=', $from)
            ->groupBy('date')->selectRaw('date, count(*) as total')->pluck('total', 'date');

        $series = collect(range(0, $days - 1))->map(function (int $offset) use ($from, $views, $visitors): array {
            $date = $from->copy()->addDays($offset)->toDateString();

            return ['date' => $date, 'views' => (int) static::forDate($views, $date), 'visitors' => (int) static::forDate($visitors, $date)];
        });

        return [
            'days' => $series->all(),
            'views' => $series->sum('views'),
            'visitors' => $series->sum('visitors'),
            'topPages' => DB::table('page_views')->where('project_id', $project->id)->where('date', '>=', $from)
                ->groupBy('path')->selectRaw('path, sum(views) as views')->orderByDesc('views')->limit(8)->get()
                ->map(fn (object $row): array => ['path' => $row->path, 'views' => (int) $row->views])->all(),
        ];
    }

    public static function prune(): int
    {
        $before = today()->subDays(self::KEEP_DAYS);

        return DB::table('page_views')->where('date', '<', $before)->delete() + DB::table('site_visitors')->where('date', '<', $before)->delete();
    }

    /**
     * Grouped dates come back as `Y-m-d` or `Y-m-d 00:00:00` depending on the database.
     *
     * @param  Collection<string, mixed>  $totals
     */
    private static function forDate($totals, string $date): int
    {
        return (int) ($totals[$date] ?? $totals[Carbon::parse($date)->toDateTimeString()] ?? 0);
    }
}
