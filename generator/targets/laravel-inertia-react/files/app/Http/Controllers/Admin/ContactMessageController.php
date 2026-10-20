<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

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
     * Delete an enquiry.
     */
    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();

        return back()->with('success', 'Message deleted.');
    }
}
