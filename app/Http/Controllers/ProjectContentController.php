<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProjectContentRequest;
use App\Models\Project;
use App\Support\ContentSchema;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
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
    private const ICONS = [
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
     * Edit one content section.
     */
    public function edit(Project $project, string $key, ProjectPresenter $presenter): Response
    {
        $section = ContentSchema::find($key);

        abort_if($section === null, 404);

        return Inertia::render('Projects/Content/Edit', [
            'project' => $presenter->summary($project),
            'sectionKey' => $key,
            'section' => $section,
            'value' => ContentSchema::valueFrom($project->config, $key, configShape: true),
            'icons' => self::ICONS,
            'sections' => collect(ContentSchema::sections())->map(fn (array $item, string $itemKey): array => ['key' => $itemKey, 'label' => $item['label']])->values(),
        ]);
    }

    /**
     * Save a content section into the project's config.
     */
    public function update(UpdateProjectContentRequest $request, Project $project, string $key): RedirectResponse
    {
        $value = ContentSchema::normalize($key, $request->validated('value'));

        $project->update([
            'config' => ContentSchema::apply($project->config, $key, $value, configShape: true),
        ]);

        return back()->with('success', ContentSchema::find($key)['label'].' saved.');
    }
}
