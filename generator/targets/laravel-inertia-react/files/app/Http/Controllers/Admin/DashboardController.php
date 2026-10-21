<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\FormSubmission;
use App\Models\SiteContent;
use App\Models\Subscriber;
use App\Support\ContentSchema;
use App\Support\SchoolSite;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Overview of every editable content section and recent enquiries.
     */
    public function __invoke(Request $request, SchoolSite $site): Response
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
            'stats' => array_values(array_filter([
                ['label' => 'New enquiries', 'value' => ContactMessage::query()->whereNull('read_at')->count(), 'href' => '/admin/messages'],
                ['label' => 'Applications to review', 'value' => FormSubmission::query()->whereNull('reviewed_at')->count(), 'href' => '/admin/submissions'],
                ['label' => 'Enquiries in 30 days', 'value' => ContactMessage::query()->where('created_at', '>=', now()->subDays(30))->count(), 'href' => '/admin/messages'],
                $request->user()->isAdmin() ? ['label' => 'Subscribers', 'value' => Subscriber::query()->active()->count(), 'href' => '/admin/alerts'] : null,
            ])),
            'unreadMessages' => ContactMessage::query()->whereNull('read_at')->count(),
            'recentMessages' => ContactMessage::query()->latest()->limit(5)->get(['id', 'name', 'subject', 'created_at', 'read_at']),
        ]);
    }
}
