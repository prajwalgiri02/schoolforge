<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendAlert;
use App\Models\Alert;
use App\Models\Subscriber;
use App\Support\SparrowSms;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Send news and urgent notices to subscribers by email and SMS.
 */
class AlertController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Alerts', [
            'counts' => [
                'email' => Subscriber::query()->active()->whereNotNull('email')->count(),
                'sms' => Subscriber::query()->active()->whereNotNull('phone')->count(),
            ],
            'smsConfigured' => SparrowSms::configured(),
            'alerts' => Alert::query()->with('sender:id,name')->latest()->limit(30)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:160'],
            'message' => ['required', 'string', 'max:5000'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => [Rule::in(SparrowSms::configured() ? ['email', 'sms'] : ['email'])],
        ]);

        $alert = Alert::create([...$validated, 'channels' => array_values(array_unique($validated['channels'])), 'sent_by' => $request->user()->id]);
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
            fputcsv($output, ['email', 'phone', 'language', 'subscribed_at']);

            Subscriber::query()->active()->orderBy('id')->each(function (Subscriber $subscriber) use ($output): void {
                fputcsv($output, [$subscriber->email, $subscriber->phone, $subscriber->locale, $subscriber->created_at->toDateTimeString()]);
            });

            fclose($output);
        }, 'subscribers.csv', ['Content-Type' => 'text/csv']);
    }
}
