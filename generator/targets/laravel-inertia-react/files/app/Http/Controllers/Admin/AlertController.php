<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendAlert;
use App\Models\Alert;
use App\Models\Subscriber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Email news and urgent notices to subscribers.
 */
class AlertController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Alerts', [
            'subscriberCount' => Subscriber::query()->active()->whereNotNull('email')->count(),
            'alerts' => Alert::query()->with('sender:id,name')->latest()->limit(30)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:160'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $alert = Alert::create([...$validated, 'sent_by' => $request->user()->id]);
        SendAlert::dispatch($alert);

        return back()->with('success', 'Alert queued. It is being sent to your subscribers.');
    }

    /**
     * Download active subscribers as CSV.
     */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['email', 'language', 'subscribed_at']);

            Subscriber::query()->active()->whereNotNull('email')->orderBy('id')->each(function (Subscriber $subscriber) use ($output): void {
                fputcsv($output, [$subscriber->email, $subscriber->locale, $subscriber->created_at->toDateTimeString()]);
            });

            fclose($output);
        }, 'subscribers.csv', ['Content-Type' => 'text/csv']);
    }
}
