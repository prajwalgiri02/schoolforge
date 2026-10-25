<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\FormSubmission;
use App\Models\SiteContent;
use App\Models\Subscriber;
use App\Support\ContentSchema;
use App\Support\FormSchema;
use App\Support\SchoolSite;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * What needs attention: first steps, new enquiries and applications, and recent content changes.
     */
    public function __invoke(Request $request, SchoolSite $site): Response
    {
        $data = $site->data();
        $sections = ContentSchema::sections();
        $edits = SiteContent::query()->latest('updated_at')->get(['key', 'updated_at'])
            ->map(function (SiteContent $content) use ($sections): ?array {
                [$locale, $key] = str_contains($content->key, ':') ? explode(':', $content->key, 2) : [null, $content->key];

                return isset($sections[$key]) ? ['key' => $key, 'label' => $sections[$key]['label'], 'locale' => $locale, 'updatedAt' => $content->updated_at->toIso8601String()] : null;
            })
            ->filter();

        return Inertia::render('Admin/Dashboard', [
            'stats' => array_values(array_filter([
                ['key' => 'messages', 'label' => 'New enquiries', 'value' => ContactMessage::query()->whereNull('read_at')->count()],
                ['key' => 'submissions', 'label' => 'Applications to review', 'value' => FormSubmission::query()->whereNull('reviewed_at')->count()],
                ['key' => 'updated', 'label' => 'Last edited', 'value' => $edits->first()['updatedAt'] ?? null],
                $request->user()->isAdmin() ? ['key' => 'subscribers', 'label' => 'Subscribers', 'value' => Subscriber::query()->active()->count()] : null,
            ])),
            'checklist' => ContentSchema::checklist($data),
            'pageCount' => count($data['pages']),
            'sectionCount' => count($sections),
            'recentMessages' => ContactMessage::query()->latest()->limit(5)->get(['id', 'name', 'subject', 'created_at', 'read_at']),
            'recentSubmissions' => FormSubmission::query()->latest()->limit(5)->get(['id', 'type', 'reference', 'name', 'status', 'created_at', 'reviewed_at'])
                ->map(fn (FormSubmission $submission): array => [
                    ...$submission->only('id', 'reference', 'name', 'status', 'created_at', 'reviewed_at'),
                    'form' => FormSchema::find($submission->type)['label']['en'] ?? $submission->type,
                ]),
            'editedCount' => $edits->pluck('key')->unique()->count(),
            'recentEdits' => $edits->take(5)->values(),
        ]);
    }
}
