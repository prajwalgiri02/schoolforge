<?php

namespace App\Notifications;

use App\Models\Invoice;
use App\Support\Billing;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sends a school its hosting invoice.
 */
class InvoiceIssued extends Notification
{
    public function __construct(public Invoice $invoice) {}

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
        $invoice = $this->invoice;

        return (new MailMessage)
            ->subject("Invoice {$invoice->number}: ".Billing::formatAmount($invoice->amount).' due '.$invoice->due_on->format('j M Y'))
            ->greeting("Invoice {$invoice->number}")
            ->line($invoice->description.', '.$invoice->period_start->format('j M Y').' to '.$invoice->period_end->format('j M Y').'.')
            ->line('Amount: '.Billing::formatAmount($invoice->amount))
            ->line('Due: '.$invoice->due_on->format('j M Y'))
            ->line('If it is not paid within '.config('studio.grace_days').' days of the due date, the website shows a "temporarily unavailable" page until it is paid.')
            ->salutation('Thank you, '.config('studio.billing_from'));
    }
}
