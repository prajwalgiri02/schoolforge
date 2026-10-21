<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGenerationRequest;
use App\Jobs\GenerateSchoolProject;
use App\Models\GenerationRun;
use App\Models\Project;
use App\Services\Generator;
use App\Support\ProjectChecks;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class ProjectGenerateController extends Controller
{
    /**
     * Validation status, generation options and recent runs.
     */
    public function show(Project $project, ProjectPresenter $presenter, Generator $generator): Response
    {
        $preview = $generator->preview($project->config);
        $outputPath = $project->output_path ?? $project->defaultOutputPath();

        return Inertia::render('Projects/Generate', [
            'project' => $presenter->summary($project),
            'validation' => [
                'ok' => $preview['ok'],
                'errors' => $preview['errors'],
                'warnings' => $preview['warnings'],
                'pageCount' => $preview['ok'] ? count($preview['site']['pages']) : 0,
            ],
            'checks' => ProjectChecks::run($project->config, $preview['ok'] ? $preview['site'] : null),
            'targets' => $generator->registry()['targets'],
            'defaults' => [
                'target' => $project->target(),
                'outputPath' => $outputPath,
                'isExisting' => File::exists($outputPath.'/.schoolforge.json'),
                'gitRemote' => $project->git_remote,
            ],
            'runs' => fn () => $project->generationRuns()->latest()->limit(5)->get()->map(fn (GenerationRun $run): array => [
                'id' => $run->id,
                'target' => $run->target,
                'outputPath' => $run->output_path,
                'install' => $run->install,
                'gitCommit' => $run->git_commit,
                'status' => $run->status,
                'log' => $run->log,
                'createdAt' => $run->created_at->toIso8601String(),
                'finishedAt' => $run->finished_at?->toIso8601String(),
            ]),
        ]);
    }

    /**
     * Queue a generation run. New folders get a fresh codebase; folders that
     * already hold this kind of project are synced with the latest content.
     */
    public function store(StoreGenerationRequest $request, Project $project): RedirectResponse
    {
        $project->update(['config' => [...$project->config, 'target' => $request->validated('target')]]);

        $run = $project->generationRuns()->create([
            'user_id' => $request->user()->id,
            'target' => $request->validated('target'),
            'output_path' => $request->outputPath(),
            'install' => $request->boolean('install'),
            'git_commit' => $request->boolean('git_commit'),
            'git_remote' => $request->boolean('git_commit') ? $request->validated('git_remote') : null,
            'status' => GenerationRun::STATUS_QUEUED,
        ]);

        if ($request->boolean('git_commit')) {
            $project->update(['git_remote' => $request->validated('git_remote')]);
        }

        GenerateSchoolProject::dispatch($run);

        return back()->with('success', 'Generation started. Progress appears below.');
    }
}
