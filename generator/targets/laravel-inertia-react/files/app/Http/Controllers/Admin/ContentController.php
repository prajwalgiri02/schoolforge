<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateContentRequest;
use App\Models\SiteContent;
use App\Support\ContentSchema;
use App\Support\SchoolSite;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    /**
     * Show the editor for one content section.
     */
    public function edit(SchoolSite $site, string $key): Response
    {
        $section = ContentSchema::find($key);

        abort_if($section === null, 404);

        return Inertia::render('Admin/Content/Edit', [
            'sectionKey' => $key,
            'section' => $section,
            'value' => ContentSchema::valueFrom($site->data(), $key),
            'isEdited' => SiteContent::query()->where('key', $key)->exists(),
            'icons' => self::icons(),
            'sections' => collect(ContentSchema::sections())->map(fn (array $item, string $itemKey): array => ['key' => $itemKey, 'label' => $item['label']])->values(),
        ]);
    }

    /**
     * Save a content section. It overrides the generated site data from now on.
     */
    public function update(UpdateContentRequest $request, SchoolSite $site, string $key): RedirectResponse
    {
        SiteContent::query()->updateOrCreate(
            ['key' => $key],
            ['value' => ContentSchema::normalize($key, $request->validated('value')), 'updated_by' => $request->user()->id],
        );

        $site->refresh();

        return back()->with('success', ContentSchema::find($key)['label'].' saved. The website is updated.');
    }

    /**
     * Discard admin edits for a section and fall back to the generated content.
     */
    public function destroy(SchoolSite $site, string $key): RedirectResponse
    {
        abort_if(ContentSchema::find($key) === null, 404);

        SiteContent::query()->where('key', $key)->delete();
        $site->refresh();

        return back()->with('success', ContentSchema::find($key)['label'].' was reset to the original content.');
    }

    /**
     * Icon names available to facilities (they match the website's icon set).
     *
     * @return list<string>
     */
    private static function icons(): array
    {
        return [
            'award', 'baby', 'bell', 'book', 'brain', 'building', 'bus', 'calculator', 'calendar', 'camera', 'check', 'clock',
            'computer', 'eye', 'flask', 'globe', 'graduation-cap', 'gym', 'heart', 'health', 'languages', 'laptop', 'leaf',
            'library', 'lightbulb', 'map-pin', 'medal', 'megaphone', 'microscope', 'music', 'palette', 'school', 'shield',
            'sparkles', 'star', 'target', 'theater', 'tree', 'trophy', 'users', 'utensils', 'wifi',
        ];
    }
}
