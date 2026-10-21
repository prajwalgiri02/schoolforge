<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\SiteCheck;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Tells Studio owners that a school website stopped working, or works again.
 */
class SiteStatusChanged extends Notification
{
    public function __construct(public Project $project, public SiteCheck $check) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $name = $this->project->name;

        if (! $this->check->isProblem()) {
            return (new MailMessage)
                ->subject("{$name} is working again")
                ->line("The {$name} website is answering normally again.")
                ->action('Open status', route('status.index'));
        }

        $message = (new MailMessage)
            ->error()
            ->subject($this->check->status === SiteCheck::STATUS_DOWN ? "{$name} is down" : "{$name} has a problem")
            ->line($this->check->status === SiteCheck::STATUS_DOWN
                ? "The {$name} website did not answer at {$this->check->url}."
                : "The {$name} website reports a problem.");

        foreach (collect($this->check->checks ?? [])->where('status', SiteCheck::STATUS_FAILING) as $failing) {
            $message->line("• {$failing['name']}: {$failing['message']}");
        }

        if ($this->check->error) {
            $message->line($this->check->error);
        }

        return $message->action('Open status', route('status.index'));
    }
}
