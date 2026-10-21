<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectVersion;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A project's history: every saved change (who and when), generations, and
 * restoring an earlier version. Also duplicating and templates.
 */
class ProjectHistoryController extends Controller
{
    public function index(Project $project, ProjectPresenter $presenter): Response
    {
        if (! $project->versions()->exists()) {
            $project->recordVersion('Content as it was when history started');
        }

        $versions = $project->versions()->with('user:id,name')->latest('id')->limit(ProjectVersion::KEEP)->get(['id', 'user_id', 'summary', 'created_at']);
        $runs = $project->generationRuns()->latest()->limit(20)->get(['id', 'status', 'output_path', 'created_at', 'finished_at']);

        return Inertia::render('Projects/History', [
            'project' => [...$presenter->summary($project), 'isTemplate' => $project->is_template],
            'activity' => collect()
                ->concat($versions->map(fn (ProjectVersion $version): array => [
                    'kind' => 'version',
                    'id' => $version->id,
                    'summary' => $version->summary,
                    'user' => $version->user?->name,
                    'at' => $version->created_at->toIso8601String(),
                ]))
                ->concat($runs->map(fn ($run): array => [
                    'kind' => 'generation',
                    'id' => $run->id,
                    'summary' => match ($run->status) {
                        'succeeded' => "Generated the website into {$run->output_path}",
                        'failed' => 'Generation failed',
                        default => 'Generation '.$run->status,
                    },
                    'user' => null,
                    'at' => $run->created_at->toIso8601String(),
                ]))
                ->sortByDesc('at')
                ->values(),
            'latestVersionId' => $versions->first()?->id,
        ]);
    }

    public function restore(Project $project, ProjectVersion $version): RedirectResponse
    {
        abort_unless($version->project_id === $project->id, 404);

        $project->versionSummary = 'Restored the version from '.$version->created_at->format('j M Y, g:i A');
        $project->update(['config' => $version->config]);

        return back()->with('success', 'Earlier version restored. You can undo this by restoring the version before it.');
    }

    public function duplicate(Project $project): RedirectResponse
    {
        $config = $project->config;
        $config['school']['name'] = "{$project->name} (copy)";
        $copy = Project::create(['name' => $config['school']['name'], 'config' => $config]);

        return redirect()->route('projects.content.index', $copy)->with('success', "Created {$copy->name}.");
    }

    public function template(Project $project): RedirectResponse
    {
        $project->update(['is_template' => ! $project->is_template]);

        return back()->with('success', $project->is_template ? "{$project->name} is now a template for new schools." : "{$project->name} is no longer a template.");
    }
}
