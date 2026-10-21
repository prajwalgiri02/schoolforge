<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContactMessageController extends Controller
{
    /**
     * List contact form enquiries, newest first.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Messages', [
            'messages' => ContactMessage::query()->latest()->paginate(20),
        ]);
    }

    /**
     * Mark an enquiry as read or unread.
     */
    public function update(ContactMessage $message): RedirectResponse
    {
        $message->update(['read_at' => $message->read_at ? null : now()]);

        return back();
    }

    /**
     * Email a reply to the person who wrote, from the school, and keep a copy.
     */
    public function reply(Request $request, ContactMessage $message): RedirectResponse
    {
        $validated = $request->validate(['reply' => ['required', 'string', 'max:10000']]);
        $school = config('app.name');

        Mail::raw(
            $validated['reply']."\n\n—\n{$school}\n\nYou wrote:\n> ".str_replace("\n", "\n> ", $message->message),
            function ($mail) use ($message, $school): void {
                $mail->to($message->email, $message->name)->subject("Re: {$message->subject} – {$school}");

                if ($office = config('school.contact_recipient')) {
                    $mail->replyTo($office, $school);
                }
            },
        );

        $message->update(['reply' => $validated['reply'], 'replied_at' => now(), 'replied_by' => $request->user()->id, 'read_at' => $message->read_at ?? now()]);

        return back()->with('success', "Reply sent to {$message->email}.");
    }

    /**
     * Download every enquiry as CSV.
     */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['received', 'name', 'email', 'phone', 'subject', 'campus', 'message', 'replied'], escape: '\\');

            ContactMessage::query()->orderBy('id')->each(function (ContactMessage $message) use ($output): void {
                fputcsv($output, [$message->created_at->toDateTimeString(), $message->name, $message->email, $message->phone, $message->subject, $message->campus, $message->message, $message->replied_at?->toDateTimeString()], escape: '\\');
            });

            fclose($output);
        }, 'enquiries.csv', ['Content-Type' => 'text/csv']);
    }

    /**
     * Delete an enquiry.
     */
    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();

        return back()->with('success', 'Message deleted.');
    }
}
