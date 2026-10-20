<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportProjectRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Models\Project;
use App\Services\Generator;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectController extends Controller
{
    /**
     * List every school website managed in Studio.
     */
    public function index(ProjectPresenter $presenter): Response
    {
        return Inertia::render('Projects/Index', [
            'projects' => Project::query()->latest('updated_at')->get()->map($presenter->summary(...)),
        ]);
    }

    /**
     * Show the new project form.
     */
    public function create(ProjectPresenter $presenter, Generator $generator): Response
    {
        return Inertia::render('Projects/Create', [
            'themes' => $presenter->themes(),
            'targets' => $generator->registry()['targets'],
        ]);
    }

    /**
     * Create a project, either blank or pre-filled with sample content to edit.
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $school = array_filter([
            'name' => $request->validated('name'),
            'shortName' => $request->validated('short_name'),
            'tagline' => $request->validated('tagline'),
        ]);

        $config = $request->validated('start_with') === 'sample'
            ? $this->sampleConfig($school)
            : ['school' => $school];

        $project = Project::create([
            'name' => $school['name'],
            'config' => [
                'target' => $request->validated('target'),
                'theme' => $request->validated('theme'),
                ...$config,
            ],
        ]);

        return redirect()->route('projects.content.index', $project)->with('success', "{$project->name} created. Start by filling in the content.");
    }

    /**
     * Create a project from an existing school.config.json file.
     */
    public function import(ImportProjectRequest $request): RedirectResponse
    {
        $project = Project::create(['name' => $request->config()['school']['name'], 'config' => $request->config()]);

        return redirect()->route('projects.content.index', $project)->with('success', "{$project->name} imported.");
    }

    public function show(Project $project): RedirectResponse
    {
        return redirect()->route('projects.content.index', $project);
    }

    /**
     * Delete a project from Studio. Generated code on disk is left untouched.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->delete();

        return redirect()->route('projects.index')->with('success', "{$project->name} was deleted from Studio.");
    }

    /**
     * Download the project's school.config.json for use with the CLI.
     */
    public function export(Project $project): StreamedResponse
    {
        return response()->streamDownload(
            fn () => print (json_encode($project->config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n"),
            "{$project->slug}.school.config.json",
            ['Content-Type' => 'application/json'],
        );
    }

    /**
     * The generator's example school, renamed, as editable starting content.
     *
     * @param  array<string, string>  $school
     * @return array<string, mixed>
     */
    private function sampleConfig(array $school): array
    {
        $example = json_decode(file_get_contents(config('studio.generator_path').'/examples/school.config.json'), true, flags: JSON_THROW_ON_ERROR);
        unset($example['$schema'], $example['target'], $example['theme']);

        $example['school'] = [...$example['school'], ...$school];

        if (! isset($school['shortName'])) {
            unset($example['school']['shortName']);
        }

        return $example;
    }
}
