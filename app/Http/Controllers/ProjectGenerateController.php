<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGenerationRequest;
use App\Jobs\GenerateSchoolProject;
use App\Models\GenerationRun;
use App\Models\Project;
use App\Services\Generator;
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
            'targets' => $generator->registry()['targets'],
            'defaults' => [
                'target' => $project->target(),
                'outputPath' => $outputPath,
                'isExisting' => File::exists($outputPath.'/.schoolforge.json'),
            ],
            'runs' => fn () => $project->generationRuns()->latest()->limit(5)->get()->map(fn (GenerationRun $run): array => [
                'id' => $run->id,
                'target' => $run->target,
                'outputPath' => $run->output_path,
                'install' => $run->install,
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
            'status' => GenerationRun::STATUS_QUEUED,
        ]);

        GenerateSchoolProject::dispatch($run);

        return back()->with('success', 'Generation started. Progress appears below.');
    }
}
