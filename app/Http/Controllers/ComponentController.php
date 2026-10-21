<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreComponentRequest;
use App\Http\Requests\UpdateComponentRequest;
use App\Models\Project;
use App\Services\Generator;
use App\Support\Audit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manages section components in the generator registry (generator/registry/components).
 */
class ComponentController extends Controller
{
    public function index(Generator $generator): Response
    {
        $usage = [];

        foreach (Project::query()->get() as $project) {
            foreach ($project->config['pages'] ?? [] as $page) {
                foreach ($page['sections'] ?? [] as $section) {
                    $usage[$section['type']][$project->slug] = true;
                }
            }
        }

        $themes = collect($generator->registry()['themes']);

        return Inertia::render('Components/Index', [
            'components' => array_map(fn (array $component): array => [
                ...$component,
                'customPages' => count($usage[$component['name']] ?? []),
                'themeOverrides' => $themes->filter(fn (array $theme): bool => in_array($component['name'], $theme['overrides'], true))->pluck('label')->values(),
            ], $generator->registry()['components']),
            'canEditCode' => config('studio.code_editing'),
        ]);
    }

    /**
     * Scaffold a new section component.
     */
    public function store(StoreComponentRequest $request, Generator $generator): RedirectResponse
    {
        $generator->newComponent($request->validated('name'), $request->variants(), $request->validated('label'));

        Audit::record('components.created', 'Created component '.$request->validated('name'));

        return redirect()->route('components.edit', $request->validated('name'))->with('success', 'Component created. Add it to a page from the Pages editor.');
    }

    public function edit(string $component, Generator $generator): Response
    {
        $details = $generator->component($component) ?? abort(404);
        $code = $generator->registryPath('components', $component, 'index.tsx');

        return Inertia::render('Components/Edit', [
            'component' => $details,
            'code' => File::exists($code) ? File::get($code) : '',
            'canEditCode' => config('studio.code_editing'),
        ]);
    }

    /**
     * Save the component manifest and (when allowed) its source code.
     */
    public function update(UpdateComponentRequest $request, string $component, Generator $generator): RedirectResponse
    {
        $generator->component($component) ?? abort(404);
        $manifestFile = $generator->registryPath('components', $component, 'component.json');
        $manifest = json_decode(File::get($manifestFile), true, flags: JSON_THROW_ON_ERROR);

        $manifest = [
            ...$manifest,
            'label' => $request->validated('label'),
            'description' => $request->validated('description') ?? '',
            'variants' => $request->variants(),
        ];

        File::put($manifestFile, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");

        if (config('studio.code_editing') && $request->has('code')) {
            File::put($generator->registryPath('components', $component, 'index.tsx'), rtrim($request->validated('code'))."\n");
        }

        $generator->refresh();

        Audit::record('components.updated', "Changed component {$manifest['label']}");

        return back()->with('success', "{$manifest['label']} saved.");
    }
}
