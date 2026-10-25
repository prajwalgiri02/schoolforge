<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProjectContentRequest;
use App\Models\Project;
use App\Support\ContentSchema;
use App\Support\ProjectPresenter;
use App\Support\TranslationMerger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Edits a project's school content using the same schema as the admin panel
 * inside generated Laravel sites.
 */
class ProjectContentController extends Controller
{
    /**
     * Icon names offered for facilities; they match the website's icon set.
     *
     * @var list<string>
     */
    public const ICONS = [
        'award', 'baby', 'bell', 'book', 'brain', 'building', 'bus', 'calculator', 'calendar', 'camera', 'check', 'clock',
        'computer', 'eye', 'flask', 'globe', 'graduation-cap', 'gym', 'heart', 'health', 'languages', 'laptop', 'leaf',
        'library', 'lightbulb', 'map-pin', 'medal', 'megaphone', 'microscope', 'music', 'palette', 'school', 'shield',
        'sparkles', 'star', 'target', 'theater', 'tree', 'trophy', 'users', 'utensils', 'wifi',
    ];

    /**
     * Overview of every content section and how much it contains.
     */
    public function index(Project $project, ProjectPresenter $presenter): Response
    {
        $sections = collect(ContentSchema::sections())->map(function (array $section, string $key) use ($project): array {
            $value = ContentSchema::valueFrom($project->config, $key, configShape: true);

            return [
                'key' => $key,
                'label' => $section['label'],
                'description' => $section['description'],
                'kind' => $section['kind'],
                'count' => $section['kind'] === 'list' ? count($value) : null,
                'filled' => $section['kind'] === 'list' ? count($value) > 0 : ! empty((array) $value),
            ];
        })->values();

        return Inertia::render('Projects/Content/Index', [
            'project' => $presenter->summary($project),
            'sections' => $sections,
        ]);
    }

    /**
     * Edit one content section, in the default language or a translation (?locale=ne).
     */
    public function edit(Request $request, Project $project, string $key, ProjectPresenter $presenter): Response
    {
        $section = ContentSchema::find($key);

        abort_if($section === null, 404);

        $languages = $project->config['languages'] ?? ['en'];
        $locale = $this->translationLocale($request, $project);
        $value = ContentSchema::valueFrom($project->config, $key, configShape: true);

        if ($locale !== null) {
            $value = TranslationMerger::merge($value, ContentSchema::valueFrom($project->config['translations'][$locale] ?? [], $key, configShape: true));
        }

        return Inertia::render('Projects/Content/Edit', [
            'project' => $presenter->summary($project),
            'sectionKey' => $key,
            'section' => $section,
            'value' => $value,
            'locale' => $locale ?? $languages[0],
            'languages' => $languages,
            'icons' => self::ICONS,
            'sections' => collect(ContentSchema::sections())->map(fn (array $item, string $itemKey): array => ['key' => $itemKey, 'label' => $item['label']])->values(),
        ]);
    }

    /**
     * Save a content section into the project's config. Translations only store
     * what differs from the default language.
     */
    public function update(UpdateProjectContentRequest $request, Project $project, string $key): RedirectResponse
    {
        $value = ContentSchema::normalize($key, $request->validated('value'));
        $locale = $this->translationLocale($request, $project);
        $config = $project->config;

        if ($locale === null) {
            $config = ContentSchema::apply($config, $key, $value, configShape: true);
        } else {
            $diff = TranslationMerger::diff(ContentSchema::valueFrom($config, $key, configShape: true), $value);
            $translation = ContentSchema::apply($config['translations'][$locale] ?? [], $key, $diff ?? [], configShape: true);
            $translation === [] ? Arr::forget($config, "translations.{$locale}") : $config['translations'][$locale] = $translation;

            if (($config['translations'] ?? null) === []) {
                unset($config['translations']);
            }
        }

        $project->update(['config' => $config]);

        return back()->with('success', ContentSchema::find($key)['label'].' saved.');
    }

    private function translationLocale(Request $request, Project $project): ?string
    {
        $languages = $project->config['languages'] ?? ['en'];
        $locale = $request->query('locale');

        return is_string($locale) && $locale !== $languages[0] && in_array($locale, $languages, true) ? $locale : null;
    }
}
