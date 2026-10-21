<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportProjectRequest;
use App\Http\Requests\StoreProjectRequest;
use App\Models\Project;
use App\Services\Generator;
use App\Support\Audit;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectController extends Controller
{
    /**
     * List every school website managed in Studio.
     */
    public function index(Request $request, ProjectPresenter $presenter): Response|RedirectResponse
    {
        if ($request->user()->isSchoolStaff()) {
            abort_if($request->user()->project === null, 403, 'Your login is not linked to a school yet. Ask a Studio owner.');

            return redirect()->route('projects.content.index', $request->user()->project);
        }

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
            'templates' => Project::query()->where('is_template', true)->orderBy('name')->get(['slug', 'name'])->map(fn (Project $template): array => ['slug' => $template->slug, 'name' => $template->name]),
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

        $startWith = $request->validated('start_with');
        $config = match (true) {
            $startWith === 'sample' => $this->sampleConfig($school),
            str_starts_with($startWith, 'template:') => $this->templateConfig(substr($startWith, 9), $school),
            default => ['school' => $school],
        };

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
        Audit::record('projects.deleted', "Deleted {$project->name}");

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
     * A template project's content and design, with the new school's name.
     *
     * @param  array<string, string>  $school
     * @return array<string, mixed>
     */
    private function templateConfig(string $slug, array $school): array
    {
        $config = Project::query()->where('slug', $slug)->where('is_template', true)->firstOrFail()->config;
        unset($config['target'], $config['theme'], $config['seo']['siteUrl']);
        $config['school'] = [...Arr::only($config['school'] ?? [], ['contact', 'social', 'established', 'motto']), ...$school];

        return $config;
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
