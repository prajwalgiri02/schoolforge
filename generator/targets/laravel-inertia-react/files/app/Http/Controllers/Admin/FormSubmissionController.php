<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FormSubmission;
use App\Models\SiteContent;
use App\Support\FormSchema;
use App\Support\SchoolSite;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Review applications and submissions sent through the website's forms.
 */
class FormSubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        $types = collect(FormSchema::all())->map(fn (array $form, string $type): array => [
            'type' => $type,
            'label' => $form['label']['en'],
            'statuses' => $form['statuses'],
            'open' => FormSubmission::query()->where('type', $type)->whereNull('reviewed_at')->count(),
        ])->values();
        $type = $request->query('type', $types->first()['type']);
        $status = $request->query('status');

        abort_unless(FormSchema::find($type), 404);

        return Inertia::render('Admin/Submissions/Index', [
            'types' => $types,
            'type' => $type,
            'status' => $status,
            'search' => $request->query('search'),
            'submissions' => FormSubmission::query()
                ->where('type', $type)
                ->when($status, fn ($query) => $query->where('status', $status))
                ->when($request->query('search'), fn ($query, string $search) => $query->where(fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")))
                ->latest()
                ->paginate(25)
                ->withQueryString(),
        ]);
    }

    public function show(FormSubmission $submission): Response
    {
        return Inertia::render('Admin/Submissions/Show', [
            'submission' => $submission,
            'label' => FormSchema::find($submission->type)['label']['en'] ?? $submission->type,
            'statuses' => FormSchema::statuses($submission->type),
            'fields' => collect(FormSchema::fields($submission->type))
                ->reject(fn (array $field): bool => in_array($field['type'], ['checkbox'], true))
                ->map(fn (array $field): array => [
                    'name' => $field['name'],
                    'label' => $field['label']['en'],
                    'type' => $field['type'],
                    'value' => $field['type'] === 'select'
                        ? (collect($field['options'])->firstWhere('value', $submission->data[$field['name']] ?? null)['label']['en'] ?? null)
                        : ($submission->data[$field['name']] ?? null),
                    'file' => $submission->files[$field['name']] ?? null,
                ])
                ->values(),
            'publishable' => in_array($submission->type, ['testimonial', 'alumni'], true),
        ]);
    }

    /**
     * Change the status and notes. Approving a testimonial or alumni registration
     * publishes it on the website.
     */
    public function update(Request $request, FormSubmission $submission, SchoolSite $site): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(FormSchema::statuses($submission->type))],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $publish = $validated['status'] === 'approved' && $submission->status !== 'approved' && in_array($submission->type, ['testimonial', 'alumni'], true);
        $submission->update([...$validated, 'reviewed_at' => now()]);

        if ($publish) {
            $this->publish($submission, $site, $request->user()->id);

            return back()->with('success', 'Approved and published on the website.');
        }

        return back()->with('success', 'Saved.');
    }

    public function file(FormSubmission $submission, string $field): StreamedResponse
    {
        $file = $submission->files[$field] ?? null;

        abort_if($file === null || ! Storage::disk('local')->exists($file['path']), 404);

        return Storage::disk('local')->download($file['path'], $file['name']);
    }

    public function destroy(FormSubmission $submission): RedirectResponse
    {
        Storage::disk('local')->deleteDirectory("submissions/{$submission->reference}");
        $submission->delete();

        return to_route('admin.submissions.index', ['type' => $submission->type])->with('success', 'Submission deleted.');
    }

    /**
     * Adds an approved testimonial or alumni profile to the site's content, with
     * its photo copied to public storage.
     */
    private function publish(FormSubmission $submission, SchoolSite $site, int $userId): void
    {
        $key = $submission->type === 'testimonial' ? 'testimonials' : 'alumni';
        $photo = $submission->files['photo']['path'] ?? null;
        $photoUrl = null;

        if ($photo && Storage::disk('local')->exists($photo)) {
            $public = 'school/submissions/'.$submission->reference.'.'.pathinfo($photo, PATHINFO_EXTENSION);
            Storage::disk('public')->put($public, Storage::disk('local')->get($photo));
            $photoUrl = parse_url(Storage::disk('public')->url($public), PHP_URL_PATH);
        }

        $item = array_filter($submission->type === 'testimonial'
            ? ['quote' => $submission->data['quote'] ?? '', 'name' => $submission->name, 'role' => $submission->data['role'] ?? null, 'photo' => $photoUrl]
            : ['name' => $submission->name, 'batch' => $submission->data['batch'] ?? null, 'role' => $submission->data['role'] ?? null, 'quote' => $submission->data['quote'] ?? null, 'photo' => $photoUrl]);

        SiteContent::query()->updateOrCreate(
            ['key' => $key],
            ['value' => [...($site->data()['content'][$key] ?? []), $item], 'updated_by' => $userId],
        );

        $site->refresh();
    }
}
