<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\SiteCheck;
use App\Support\SiteMonitor;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Whether each school's live website is up, from its health endpoint.
 */
class SiteStatusController extends Controller
{
    public function index(): Response
    {
        $projects = Project::query()->where('is_template', false)->orderBy('name')->get();

        return Inertia::render('Status/Index', [
            'sites' => $projects->map(function (Project $project): array {
                $recent = $project->siteChecks()->latest('id')->limit(48)->get(['id', 'status', 'http_status', 'response_ms', 'checks', 'error', 'created_at']);
                $lastDay = $project->siteChecks()->where('created_at', '>=', now()->subDay());
                $lastDayCount = (clone $lastDay)->count();

                return [
                    'name' => $project->name,
                    'slug' => $project->slug,
                    'target' => $project->target(),
                    'url' => SiteMonitor::healthUrl($project),
                    'latest' => $recent->first(),
                    'history' => $recent->reverse()->values()->map(fn (SiteCheck $check): array => ['status' => $check->status, 'at' => $check->created_at]),
                    'uptime' => $lastDayCount > 0
                        ? round((clone $lastDay)->whereNotIn('status', [SiteCheck::STATUS_FAILING, SiteCheck::STATUS_DOWN])->count() / $lastDayCount * 100, 1)
                        : null,
                ];
            }),
        ]);
    }

    /**
     * Checks one school's site now.
     */
    public function store(Project $project): RedirectResponse
    {
        $check = SiteMonitor::check($project);

        return back()->with($check ? 'success' : 'error', match (true) {
            $check === null => "Set {$project->name}'s site URL (SEO → Site URL) first.",
            $check->isProblem() => "{$project->name}: {$check->status}.",
            $check->status === SiteCheck::STATUS_WARNING => "{$project->name} is up but needs attention ({$check->response_ms} ms).",
            default => "{$project->name} is up ({$check->response_ms} ms).",
        });
    }
}
