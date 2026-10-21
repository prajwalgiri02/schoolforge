<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\Subscriber;
use App\Support\SparrowSms;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

/**
 * Delivers an alert to every active subscriber on the chosen channels.
 */
class SendAlert implements ShouldQueue
{
    use Queueable;

    public int $timeout = 900;

    public function __construct(public Alert $alert) {}

    public function handle(): void
    {
        $emails = 0;
        $texts = 0;
        $error = null;
        $school = config('app.name');

        if (in_array('email', $this->alert->channels, true)) {
            Subscriber::query()->active()->whereNotNull('email')->each(function (Subscriber $subscriber) use (&$emails, $school): void {
                Mail::raw(
                    $this->alert->message."\n\n—\n{$school}\nUnsubscribe: ".route('school.unsubscribe', $subscriber->token),
                    fn ($mail) => $mail->to($subscriber->email)->subject($this->alert->subject),
                );
                $emails++;
            });
        }

        if (in_array('sms', $this->alert->channels, true)) {
            try {
                $numbers = Subscriber::query()->active()->whereNotNull('phone')->pluck('phone')->all();
                $texts = $numbers === [] ? 0 : SparrowSms::send($numbers, Str::limit("{$school}: {$this->alert->message}", 450));
            } catch (Throwable $exception) {
                $error = Str::limit($exception->getMessage(), 490);
            }
        }

        $this->alert->update(['email_count' => $emails, 'sms_count' => $texts, 'error' => $error, 'sent_at' => now()]);
    }
}
