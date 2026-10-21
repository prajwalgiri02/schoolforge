<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\Subscriber;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

/**
 * Emails an alert to every active subscriber.
 */
class SendAlert implements ShouldQueue
{
    use Queueable;

    public int $timeout = 900;

    public function __construct(public Alert $alert) {}

    public function handle(): void
    {
        $emails = 0;
        $school = config('app.name');

        Subscriber::query()->active()->whereNotNull('email')->each(function (Subscriber $subscriber) use (&$emails, $school): void {
            Mail::raw(
                $this->alert->message."\n\n—\n{$school}\nUnsubscribe: ".route('school.unsubscribe', $subscriber->token),
                fn ($mail) => $mail->to($subscriber->email)->subject($this->alert->subject),
            );
            $emails++;
        });

        $this->alert->update(['email_count' => $emails, 'sent_at' => now()]);
    }
}
