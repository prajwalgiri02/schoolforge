<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProjectPagesRequest;
use App\Models\Project;
use App\Services\Generator;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Site map editor: pages, and the ordered sections (components) on each page.
 */
class ProjectPagesController extends Controller
{
    public function edit(Project $project, ProjectPresenter $presenter, Generator $generator): Response
    {
        $registry = $generator->registry();
        $theme = $generator->theme($project->theme());
        $isCustom = isset($project->config['pages']);

        return Inertia::render('Projects/Pages', [
            'project' => $presenter->summary($project),
            'isCustom' => $isCustom,
            'pages' => $isCustom ? $project->config['pages'] : $this->defaultPages($project, $generator, $theme['variants'] ?? []),
            'components' => collect($registry['components'])
                ->where('category', 'section')
                ->reject(fn (array $component): bool => $component['name'] === 'article')
                ->map(fn (array $component): array => Arr::only($component, ['name', 'label', 'description', 'variants', 'props']))
                ->values(),
            'themeVariants' => (object) array_merge($theme['variants'] ?? [], $project->config['variants'] ?? []),
            'languages' => $project->config['languages'] ?? ['en'],
            'pageTranslations' => (object) collect($project->config['translations'] ?? [])
                ->map(fn (array $translation): object => (object) ($translation['pages'] ?? []))
                ->all(),
        ]);
    }

    /**
     * Save a custom site map. From now on it replaces the default pages.
     */
    public function update(UpdateProjectPagesRequest $request, Project $project): RedirectResponse
    {
        $config = [...$project->config, 'pages' => $request->pages()];
        $locales = array_slice($config['languages'] ?? ['en'], 1);
        $pageTranslations = $request->pageTranslations($locales);

        foreach ($locales as $locale) {
            if (isset($pageTranslations[$locale])) {
                $config['translations'][$locale]['pages'] = $pageTranslations[$locale];
            } else {
                Arr::forget($config, "translations.{$locale}.pages");

                if (($config['translations'][$locale] ?? null) === []) {
                    unset($config['translations'][$locale]);
                }
            }
        }

        if (($config['translations'] ?? null) === []) {
            unset($config['translations']);
        }

        $project->update(['config' => $config]);

        return back()->with('success', 'Pages saved.');
    }

    /**
     * Go back to the default site map, which hides pages that have no content.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $project->update(['config' => Arr::except($project->config, 'pages')]);

        return back()->with('success', 'Pages reset to the default site map.');
    }

    /**
     * The pages the generator would build for this school today, without the
     * automatic news article pages and with theme-default variants removed.
     *
     * @param  array<string, string>  $themeVariants
     * @return list<array<string, mixed>>
     */
    private function defaultPages(Project $project, Generator $generator, array $themeVariants): array
    {
        $preview = $generator->preview($project->config);
        $variants = array_merge($themeVariants, $project->config['variants'] ?? []);

        $pages = $preview['ok']
            ? $preview['site']['pages']
            : json_decode(file_get_contents($generator->registryPath('presets', 'default-site.json')), true)['pages'];

        return collect($pages)
            ->reject(fn (array $page): bool => collect($page['sections'])->contains('type', 'article'))
            ->map(fn (array $page): array => [
                ...$page,
                'sections' => array_map(
                    fn (array $section): array => ($section['variant'] ?? null) === ($variants[$section['type']] ?? null) ? Arr::except($section, 'variant') : $section,
                    $page['sections'],
                ),
            ])
            ->values()
            ->all();
    }
}
