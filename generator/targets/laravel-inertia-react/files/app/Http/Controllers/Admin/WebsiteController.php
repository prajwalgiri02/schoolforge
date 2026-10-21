<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use App\Support\SchoolSite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Page titles, the menu and brand colours, editable without regenerating the site.
 */
class WebsiteController extends Controller
{
    public function edit(SchoolSite $site): Response
    {
        $settings = SiteContent::query()->where('key', SchoolSite::PAGE_SETTINGS)->value('value') ?? [];

        return Inertia::render('Admin/Website', [
            'pages' => collect($site->data()['pages'])
                ->reject(fn (array $page): bool => str_starts_with($page['slug'], '/news/') || str_starts_with($page['slug'], '/gallery/'))
                ->map(fn (array $page): array => [
                    'slug' => $page['slug'],
                    'title' => $page['title'],
                    'navLabel' => $page['navLabel'] ?? '',
                    'description' => $page['description'] ?? '',
                    'showInNav' => (bool) ($page['showInNav'] ?? false),
                    'edited' => isset($settings[$page['slug']]),
                ])
                ->values(),
            'colors' => (object) (SiteContent::query()->where('key', SchoolSite::DESIGN)->value('value')['colors'] ?? []),
        ]);
    }

    public function updatePages(Request $request, SchoolSite $site): RedirectResponse
    {
        $validated = $request->validate([
            'pages' => ['required', 'array', 'max:60'],
            'pages.*.slug' => ['required', 'string', 'max:120'],
            'pages.*.title' => ['required', 'string', 'max:120'],
            'pages.*.navLabel' => ['nullable', 'string', 'max:40'],
            'pages.*.description' => ['nullable', 'string', 'max:300'],
            'pages.*.showInNav' => ['boolean'],
        ]);

        $known = array_column($site->fileData()['pages'], 'slug');
        $settings = [];

        foreach (array_values($validated['pages']) as $position => $page) {
            if (in_array($page['slug'], $known, true)) {
                $settings[$page['slug']] = [...array_filter([
                    'title' => $page['title'],
                    'navLabel' => $page['navLabel'] ?? null,
                    'description' => $page['description'] ?? null,
                ], fn ($value): bool => filled($value)), 'showInNav' => (bool) ($page['showInNav'] ?? false), 'order' => $position];
            }
        }

        SiteContent::query()->updateOrCreate(['key' => SchoolSite::PAGE_SETTINGS], ['value' => $settings, 'updated_by' => $request->user()->id]);
        $site->refresh();

        return back()->with('success', 'Pages and menu saved.');
    }

    public function updateDesign(Request $request, SchoolSite $site): RedirectResponse
    {
        $validated = $request->validate([
            'colors' => ['array'],
            'colors.primary' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.secondary' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'colors.accent' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ], ['colors.*.regex' => 'Use a colour like #1e3a8a.']);

        $colors = array_map('strtolower', array_filter($validated['colors'] ?? [], fn ($value): bool => filled($value)));

        if ($colors === []) {
            SiteContent::query()->where('key', SchoolSite::DESIGN)->delete();
        } else {
            SiteContent::query()->updateOrCreate(['key' => SchoolSite::DESIGN], ['value' => ['colors' => $colors], 'updated_by' => $request->user()->id]);
        }

        $site->refresh();

        return back()->with('success', $colors === [] ? 'Back to the theme’s colours.' : 'Colours saved.');
    }

    /**
     * Forget page edits so the generated pages and menu apply again.
     */
    public function resetPages(SchoolSite $site): RedirectResponse
    {
        SiteContent::query()->where('key', SchoolSite::PAGE_SETTINGS)->delete();
        $site->refresh();

        return back()->with('success', 'Pages and menu reset.');
    }
}
