<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateContentRequest;
use App\Models\SiteContent;
use App\Support\ContentSchema;
use App\Support\SchoolSite;
use App\Support\TranslationMerger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContentController extends Controller
{
    /**
     * Every editable content section, with how many items it has and whether it was edited.
     */
    public function index(SchoolSite $site): Response
    {
        $data = $site->data();
        $edited = SiteContent::query()->pluck('updated_at', 'key');

        return Inertia::render('Admin/Content/Index', [
            'sections' => collect(ContentSchema::sections())->map(function (array $section, string $key) use ($data, $edited): array {
                $value = ContentSchema::valueFrom($data, $key);

                return [
                    'key' => $key,
                    'label' => $section['label'],
                    'description' => $section['description'],
                    'kind' => $section['kind'],
                    'count' => $section['kind'] === 'list' ? count($value) : null,
                    'editedAt' => $edited->get($key)?->toIso8601String(),
                ];
            })->values(),
        ]);
    }

    /**
     * Show the editor for one content section, in the default language or a translation (?locale=ne).
     */
    public function edit(Request $request, SchoolSite $site, string $key): Response
    {
        $section = ContentSchema::find($key);

        abort_if($section === null, 404);

        $locale = $this->translationLocale($request, $site);
        $storageKey = $this->storageKey($key, $locale);

        return Inertia::render('Admin/Content/Edit', [
            'sectionKey' => $key,
            'section' => $section,
            'value' => $locale === null
                ? ContentSchema::valueFrom($site->data(), $key)
                : TranslationMerger::merge($site->translationBase($locale, $key), SiteContent::query()->where('key', $storageKey)->value('value')),
            'isEdited' => SiteContent::query()->where('key', $storageKey)->exists(),
            'locale' => $locale ?? $site->defaultLocale(),
            'locales' => $site->locales(),
            'defaultLocale' => $site->defaultLocale(),
            'icons' => self::icons(),
            'sections' => collect(ContentSchema::sections())->map(fn (array $item, string $itemKey): array => ['key' => $itemKey, 'label' => $item['label']])->values(),
        ]);
    }

    /**
     * Save a content section. It overrides the generated site data from now on. A
     * translation only stores what differs from the default language, so untranslated
     * fields keep following it.
     */
    public function update(UpdateContentRequest $request, SchoolSite $site, string $key): RedirectResponse
    {
        $locale = $this->translationLocale($request, $site);
        $value = ContentSchema::normalize($key, $request->validated('value'));

        if ($locale !== null) {
            $value = TranslationMerger::diff($site->translationBase($locale, $key), $value) ?? [];
        }

        SiteContent::query()->updateOrCreate(
            ['key' => $this->storageKey($key, $locale)],
            ['value' => $value, 'updated_by' => $request->user()->id],
        );

        $site->refresh();

        return back()->with('success', ContentSchema::find($key)['label'].' saved. The website is updated.');
    }

    /**
     * Discard admin edits for a section (or its translation) and fall back to the generated content.
     */
    public function destroy(Request $request, SchoolSite $site, string $key): RedirectResponse
    {
        abort_if(ContentSchema::find($key) === null, 404);

        SiteContent::query()->where('key', $this->storageKey($key, $this->translationLocale($request, $site)))->delete();
        $site->refresh();

        return back()->with('success', ContentSchema::find($key)['label'].' was reset to the original content.');
    }

    /**
     * The language being edited when it is not the default one.
     */
    private function translationLocale(Request $request, SchoolSite $site): ?string
    {
        $locale = $request->query('locale');

        return is_string($locale) && $locale !== $site->defaultLocale() && in_array($locale, $site->locales(), true) ? $locale : null;
    }

    private function storageKey(string $key, ?string $locale): string
    {
        return $locale === null ? $key : "{$locale}:{$key}";
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
