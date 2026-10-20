<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProjectDesignRequest;
use App\Models\Project;
use App\Services\Generator;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

class ProjectDesignController extends Controller
{
    /**
     * Theme, brand colours, fonts and per-section layout variants.
     */
    public function edit(Project $project, ProjectPresenter $presenter, Generator $generator): Response
    {
        $registry = $generator->registry();

        return Inertia::render('Projects/Design', [
            'project' => $presenter->summary($project),
            'themes' => $presenter->themes(),
            'themeDetails' => collect($registry['themes'])->mapWithKeys(fn (array $theme): array => [$theme['name'] => [
                'colors' => $theme['tokens']['colors'],
                'variants' => $theme['variants'],
            ]]),
            'components' => collect($registry['components'])
                ->filter(fn (array $component): bool => count($component['variants']) > 1)
                ->map(fn (array $component): array => Arr::only($component, ['name', 'label', 'variants']))
                ->values(),
            'design' => [
                'theme' => $project->theme(),
                'colors' => (object) ($project->config['colors'] ?? []),
                'fonts' => [
                    'heading' => $this->fontName($project->config['fonts']['heading'] ?? null),
                    'body' => $this->fontName($project->config['fonts']['body'] ?? null),
                ],
                'variants' => (object) ($project->config['variants'] ?? []),
            ],
        ]);
    }

    /**
     * Save design choices into the project's config.
     */
    public function update(UpdateProjectDesignRequest $request, Project $project): RedirectResponse
    {
        $config = $project->config;
        $config['theme'] = $request->validated('theme');

        foreach (['colors', 'variants'] as $key) {
            $values = array_filter($request->validated($key) ?? [], fn ($value): bool => filled($value));
            $values === [] ? Arr::forget($config, $key) : $config[$key] = $values;
        }

        $fonts = array_filter($request->validated('fonts') ?? [], fn ($value): bool => filled($value));
        $fonts === [] ? Arr::forget($config, 'fonts') : $config['fonts'] = $fonts;

        $project->update(['config' => $config]);

        return back()->with('success', 'Design saved.');
    }

    private function fontName(mixed $font): ?string
    {
        return is_array($font) ? ($font['family'] ?? null) : $font;
    }
}
