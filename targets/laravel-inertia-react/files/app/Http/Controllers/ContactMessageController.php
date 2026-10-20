<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactMessageRequest;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;

class ContactMessageController extends Controller
{
    /**
     * Store a contact form enquiry and optionally notify the school office.
     */
    public function __invoke(StoreContactMessageRequest $request): RedirectResponse
    {
        $message = ContactMessage::create([
            ...$request->validated(),
            'subject' => $request->validated('subject') ?? 'General question',
            'ip_address' => $request->ip(),
        ]);

        if ($recipient = config('school.contact_recipient')) {
            Mail::raw(
                "New enquiry from {$message->name} <{$message->email}>\nPhone: {$message->phone}\nSubject: {$message->subject}\n\n{$message->message}",
                fn ($mail) => $mail->to($recipient)->replyTo($message->email, $message->name)->subject("Website enquiry: {$message->subject}"),
            );
        }

        return back()->with('success', 'Thank you! Our team will get back to you shortly.');
    }
}
