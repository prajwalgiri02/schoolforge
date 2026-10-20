<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\SiteContent;
use App\Support\ContentSchema;
use App\Support\SchoolSite;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Overview of every editable content section and recent enquiries.
     */
    public function __invoke(SchoolSite $site): Response
    {
        $data = $site->data();
        $edited = SiteContent::query()->pluck('updated_at', 'key');

        $sections = collect(ContentSchema::sections())->map(function (array $section, string $key) use ($data, $edited): array {
            $value = ContentSchema::valueFrom($data, $key);

            return [
                'key' => $key,
                'label' => $section['label'],
                'description' => $section['description'],
                'kind' => $section['kind'],
                'count' => $section['kind'] === 'list' ? count($value) : null,
                'editedAt' => $edited->get($key)?->toIso8601String(),
            ];
        })->values();

        return Inertia::render('Admin/Dashboard', [
            'sections' => $sections,
            'pageCount' => count($data['pages']),
            'unreadMessages' => ContactMessage::query()->whereNull('read_at')->count(),
            'recentMessages' => ContactMessage::query()->latest()->limit(5)->get(['id', 'name', 'subject', 'created_at', 'read_at']),
        ]);
    }
}
