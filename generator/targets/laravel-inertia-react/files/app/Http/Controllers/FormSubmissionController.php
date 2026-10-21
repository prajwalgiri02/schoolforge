<?php

namespace App\Http\Controllers;

use App\Models\FormSubmission;
use App\Support\FormSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Receives the website's application forms (admissions, jobs, alumni, testimonials)
 * and lets applicants look up the status of their application.
 */
class FormSubmissionController extends Controller
{
    public function store(Request $request, string $type): JsonResponse
    {
        $definition = FormSchema::find($type);

        abort_if($definition === null, 404);

        $validated = $request->validate(FormSchema::rules($type), [], FormSchema::attributes($type));
        $reference = $this->newReference($definition['referencePrefix']);
        $files = [];

        foreach ($validated as $name => $value) {
            if ($value instanceof UploadedFile) {
                $files[$name] = [
                    'path' => $value->storeAs("submissions/{$reference}", $name.'.'.$value->extension(), 'local'),
                    'name' => $value->getClientOriginalName(),
                    'size' => $value->getSize(),
                ];
            }
        }

        $data = Arr::except(array_filter($validated, fn ($value): bool => ! $value instanceof UploadedFile && $value !== null), ['consent']);

        $submission = FormSubmission::create([
            'type' => $type,
            'reference' => $reference,
            'status' => FormSchema::statuses($type)[0],
            'name' => $data['name'] ?? $data['studentName'] ?? 'Unknown',
            'email' => $data['email'],
            'data' => $data,
            'files' => $files,
            'locale' => Str::limit((string) $request->input('locale', ''), 10, ''),
            'ip_address' => $request->ip(),
        ]);

        $this->notify($submission, $definition['label']['en']);

        return response()->json(['reference' => $submission->reference], 201);
    }

    /**
     * Status of an admission or job application, for applicants who know its
     * reference number and the email address they applied with.
     */
    public function status(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reference' => ['required', 'string', 'max:40'],
            'email' => ['required', 'email', 'max:190'],
        ]);

        $submission = FormSubmission::query()
            ->whereIn('type', ['admission', 'job'])
            ->where('reference', Str::upper(trim($validated['reference'])))
            ->first();

        if ($submission === null || Str::lower($submission->email) !== Str::lower(trim($validated['email']))) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'reference' => $submission->reference,
            'status' => $submission->status,
            'updatedAt' => $submission->updated_at->toIso8601String(),
        ]);
    }

    private function newReference(string $prefix): string
    {
        do {
            $reference = $prefix.'-'.now()->format('y').'-'.Str::upper(Str::password(6, symbols: false));
        } while (FormSubmission::query()->where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Emails the school office (when configured) and confirms receipt to the applicant.
     */
    private function notify(FormSubmission $submission, string $label): void
    {
        $school = config('app.name');
        $summary = collect($submission->data)
            ->map(fn ($value, string $name): string => FormSchema::label($submission->type, $name).': '.(is_bool($value) ? ($value ? 'Yes' : 'No') : $value))
            ->implode("\n");

        if ($recipient = config('school.contact_recipient')) {
            Mail::raw(
                "New {$label} ({$submission->reference})\n\n{$summary}\n\nReview it in the admin panel: ".url('/admin/submissions/'.$submission->id),
                fn ($mail) => $mail->to($recipient)->replyTo($submission->email, $submission->name)->subject("{$label}: {$submission->name} ({$submission->reference})"),
            );
        }

        Mail::raw(
            "Dear {$submission->name},\n\nThank you. {$school} has received your ".Str::lower($label).".\nYour reference number is {$submission->reference}.\n\n{$summary}",
            fn ($mail) => $mail->to($submission->email, $submission->name)->subject("{$label} received ({$submission->reference})"),
        );
    }
}
