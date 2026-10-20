<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreThemeRequest;
use App\Http\Requests\UpdateThemeRequest;
use App\Models\Project;
use App\Services\Generator;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manages themes in the generator registry (generator/registry/themes).
 */
class ThemeController extends Controller
{
    public function index(ProjectPresenter $presenter): Response
    {
        $usage = Project::query()->get()->countBy(fn (Project $project): string => $project->theme());

        return Inertia::render('Themes/Index', [
            'themes' => array_map(fn (array $theme): array => [...$theme, 'projects' => $usage[$theme['name']] ?? 0], $presenter->themes()),
        ]);
    }

    /**
     * Create a theme that extends an existing one.
     */
    public function store(StoreThemeRequest $request, Generator $generator): RedirectResponse
    {
        $generator->newTheme($request->validated('name'), $request->validated('from'), $request->validated('label'));

        return redirect()->route('themes.edit', $request->validated('name'))->with('success', 'Theme created. Adjust its colours, fonts and layouts.');
    }

    public function edit(string $theme, Generator $generator): Response
    {
        $details = $generator->theme($theme) ?? abort(404);
        $extraCss = $generator->registryPath('themes', $theme, 'extra.css');

        return Inertia::render('Themes/Edit', [
            'theme' => [
                'name' => $details['name'],
                'label' => $details['label'],
                'description' => $details['description'],
                'extends' => $details['extends'],
                'overrides' => $details['overrides'],
            ],
            'own' => [
                'colors' => (object) ($details['ownTokens']['tokens']['colors'] ?? []),
                'fonts' => [
                    'heading' => $details['ownTokens']['tokens']['fonts']['heading']['family'] ?? null,
                    'body' => $details['ownTokens']['tokens']['fonts']['body']['family'] ?? null,
                ],
                'radius' => (object) ($details['ownTokens']['tokens']['radius'] ?? []),
                'headingWeight' => $details['ownTokens']['tokens']['heading']['weight'] ?? null,
                'variants' => (object) ($details['ownTokens']['variants'] ?? []),
                'extraCss' => File::exists($extraCss) ? File::get($extraCss) : '',
            ],
            'resolved' => Arr::only($details['tokens'], ['colors', 'fonts', 'radius', 'heading']),
            'resolvedVariants' => (object) $details['variants'],
            'components' => collect($generator->registry()['components'])
                ->filter(fn (array $component): bool => count($component['variants']) > 1)
                ->map(fn (array $component): array => Arr::only($component, ['name', 'label', 'variants']))
                ->values(),
        ]);
    }

    /**
     * Write the theme's settings back to its theme.json (and extra.css).
     */
    public function update(UpdateThemeRequest $request, string $theme, Generator $generator): RedirectResponse
    {
        $details = $generator->theme($theme) ?? abort(404);
        $file = $generator->registryPath('themes', $theme, 'theme.json');
        $current = json_decode(File::get($file), true, flags: JSON_THROW_ON_ERROR);
        $filled = fn (?array $values): array => array_filter($values ?? [], fn ($value): bool => filled($value));

        $tokens = $current['tokens'] ?? [];
        $tokens['colors'] = $filled($request->validated('colors'));
        $tokens['radius'] = $filled($request->validated('radius'));

        foreach (['heading', 'body'] as $role) {
            $family = $request->validated("fonts.{$role}");

            if (filled($family)) {
                $tokens['fonts'][$role] = ($tokens['fonts'][$role]['family'] ?? null) === $family
                    ? $tokens['fonts'][$role]
                    : ['family' => $family, 'fallback' => $details['tokens']['fonts'][$role]['fallback'] ?? 'system-ui, sans-serif', 'weights' => [400, 500, 600, 700]];
            } else {
                unset($tokens['fonts'][$role]);
            }
        }

        if (filled($request->validated('heading_weight'))) {
            $tokens['heading']['weight'] = (int) $request->validated('heading_weight');
        } else {
            unset($tokens['heading']['weight']);
        }

        $updated = array_filter([
            'extends' => $current['extends'] ?? null,
            'label' => $request->validated('label'),
            'description' => $request->validated('description') ?? '',
            'tokens' => array_filter($tokens, fn ($value): bool => $value !== []),
            'variants' => $filled($request->validated('variants')),
        ], fn ($value): bool => $value !== null && $value !== []);

        File::put($file, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
        File::put($generator->registryPath('themes', $theme, 'extra.css'), rtrim((string) $request->validated('extra_css'))."\n");
        $generator->refresh();

        return back()->with('success', "Theme {$updated['label']} saved.");
    }
}
