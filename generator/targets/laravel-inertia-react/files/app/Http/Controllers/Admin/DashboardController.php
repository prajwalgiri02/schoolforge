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
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * What needs attention: first steps, new enquiries and applications, and how the website is doing.
     */
    public function __invoke(Request $request, SchoolSite $site): Response
    {
        $data = $site->data();
        $lastEdit = SiteContent::query()->max('updated_at');
        $editedCount = SiteContent::query()->pluck('key')
            ->map(fn (string $key): string => str_contains($key, ':') ? explode(':', $key, 2)[1] : $key)
            ->filter(fn (string $key): bool => ContentSchema::find($key) !== null)
            ->unique()
            ->count();
        $since = now()->startOfMonth()->subMonths(5);

        return Inertia::render('Admin/Dashboard', [
            'stats' => array_values(array_filter([
                [
                    'key' => 'messages',
                    'label' => 'New enquiries',
                    'value' => ContactMessage::query()->whereNull('read_at')->count(),
                    'hint' => ContactMessage::query()->where('created_at', '>=', now()->subDays(30))->count().' in the last 30 days',
                ],
                [
                    'key' => 'submissions',
                    'label' => 'Applications to review',
                    'value' => FormSubmission::query()->whereNull('reviewed_at')->count(),
                    'hint' => FormSubmission::query()->count().' received in total',
                ],
                [
                    'key' => 'updated',
                    'label' => 'Last edited',
                    'value' => $lastEdit === null ? null : now()->parse($lastEdit)->toIso8601String(),
                    'hint' => "{$editedCount} of ".count(ContentSchema::sections()).' sections changed',
                ],
                $request->user()->isAdmin() ? [
                    'key' => 'subscribers',
                    'label' => 'Subscribers',
                    'value' => Subscriber::query()->active()->count(),
                    'hint' => 'People who get your email alerts',
                ] : null,
            ])),
            'checklist' => ContentSchema::checklist($data),
            'activity' => self::activity(
                ContactMessage::query()->where('created_at', '>=', $since)->pluck('created_at'),
                FormSubmission::query()->where('created_at', '>=', $since)->pluck('created_at'),
            ),
            'summary' => ContentSchema::summary($data, count($data['pages'])),
            'recentMessages' => ContactMessage::query()->latest()->limit(5)->get(['id', 'name', 'email', 'subject', 'created_at', 'read_at', 'replied_at']),
            'recentSubmissions' => FormSubmission::query()->latest()->limit(5)->get(['id', 'type', 'reference', 'name', 'status', 'created_at', 'reviewed_at'])
                ->map(fn (FormSubmission $submission): array => [
                    ...$submission->only('id', 'reference', 'name', 'status', 'created_at', 'reviewed_at'),
                    'form' => FormSchema::find($submission->type)['label']['en'] ?? $submission->type,
                ]),
        ]);
    }

    /**
     * Enquiries and applications received in each of the last six months.
     *
     * @param  Collection<int, mixed>  $messages
     * @param  Collection<int, mixed>  $submissions
     * @return list<array{month: string, enquiries: int, applications: int}>
     */
    public static function activity(Collection $messages, Collection $submissions): array
    {
        $count = fn (Collection $dates): Collection => $dates->countBy(fn ($date): string => now()->parse($date)->format('Y-m'));
        [$messages, $submissions] = [$count($messages), $count($submissions)];

        return collect(range(5, 0))->map(function (int $ago) use ($messages, $submissions): array {
            $month = now()->startOfMonth()->subMonths($ago)->format('Y-m');

            return ['month' => $month, 'enquiries' => $messages[$month] ?? 0, 'applications' => $submissions[$month] ?? 0];
        })->all();
    }
}
