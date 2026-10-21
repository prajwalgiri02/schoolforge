<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\Project;
use App\Notifications\InvoiceIssued;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

/**
 * Hosting bills: issuing invoices before a school's paid period ends,
 * recording payments, and suspending hosted schools that stay unpaid.
 */
class Billing
{
    public const STATUS_NONE = 'none';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_DUE = 'due';

    public const STATUS_OVERDUE = 'overdue';

    public const STATUS_SUSPENDED = 'suspended';

    /**
     * Where a school stands: no plan, paid up, invoice waiting, late, or
     * suspended (late beyond the grace period).
     */
    public static function status(Project $project): string
    {
        return match (true) {
            $project->plan_id === null => self::STATUS_NONE,
            static::isSuspended($project) => self::STATUS_SUSPENDED,
            $project->paid_until === null || $project->paid_until->lt(today()) => self::STATUS_OVERDUE,
            $project->invoices()->where('status', Invoice::STATUS_UNPAID)->exists() => self::STATUS_DUE,
            default => self::STATUS_ACTIVE,
        };
    }

    /**
     * Whether a school that signed itself up still has to buy a plan (or
     * renew it) before it can publish.
     */
    public static function needsPackage(Project $project): bool
    {
        return $project->signed_up_at !== null && ($project->paid_until === null || $project->paid_until->lt(today()));
    }

    /**
     * Whether a signed-up school's free trial is over and it has no paid plan,
     * so Studio only lets it buy one.
     */
    public static function trialEnded(Project $project): bool
    {
        return static::needsPackage($project) && $project->trial_ends_at?->isPast() === true;
    }

    /**
     * Whether a school on a plan is paid up to a date more than the grace
     * period ago. Schools without a plan are never suspended.
     */
    public static function isSuspended(Project $project): bool
    {
        if ($project->plan_id === null) {
            return false;
        }

        $paidThrough = $project->paid_until ?? $project->invoices()->where('status', Invoice::STATUS_UNPAID)->min('due_on');

        return $paidThrough !== null && Carbon::parse($paidThrough)->addDays(config('studio.grace_days'))->lt(today());
    }

    /**
     * Issues the next invoice for every school on a plan whose paid period ends
     * soon and that has no unpaid invoice yet.
     *
     * @return list<Invoice>
     */
    public static function issueDueInvoices(): array
    {
        $issued = [];

        Project::query()->whereNotNull('plan_id')->with('plan')->each(function (Project $project) use (&$issued): void {
            if ($project->paid_until?->gt(today()->addDays(config('studio.invoice_days_before'))) || $project->invoices()->where('status', Invoice::STATUS_UNPAID)->exists()) {
                return;
            }

            $issued[] = static::issue($project);
        });

        return $issued;
    }

    /**
     * Issues an invoice for the period after the school's paid period, and
     * emails it to the school.
     */
    public static function issue(Project $project): Invoice
    {
        $plan = $project->plan;
        $start = $project->paid_until?->copy()->addDay() ?? today();

        $invoice = DB::transaction(function () use ($project, $plan, $start): Invoice {
            $invoice = $project->invoices()->create([
                'number' => 'pending-'.uniqid(),
                'description' => "{$plan->name} hosting for {$project->name}",
                'amount' => $plan->price,
                'period_start' => $start,
                'period_end' => $plan->periodEnd($start),
                'due_on' => $start->isPast() ? today() : $start,
                'status' => Invoice::STATUS_UNPAID,
            ]);

            $invoice->update(['number' => 'INV-'.now()->format('Y').'-'.str_pad((string) $invoice->id, 5, '0', STR_PAD_LEFT)]);

            return $invoice;
        });

        if ($email = static::billingEmail($project)) {
            Notification::route('mail', $email)->notify(new InvoiceIssued($invoice));
        }

        return $invoice;
    }

    /**
     * Records a payment and extends the school's paid period.
     */
    public static function markPaid(Invoice $invoice, ?string $reference = null): void
    {
        DB::transaction(function () use ($invoice, $reference): void {
            $invoice->update(['status' => Invoice::STATUS_PAID, 'paid_at' => now(), 'payment_reference' => $reference]);

            $project = $invoice->project;

            if ($project->paid_until === null || $project->paid_until->lt($invoice->period_end)) {
                $project->forceFill(['paid_until' => $invoice->period_end])->save();
            }
        });
    }

    /**
     * The school's billing address, else its first contact email.
     */
    public static function billingEmail(Project $project): ?string
    {
        $email = $project->billing_email ?: Arr::first(Arr::wrap($project->config['school']['contact']['email'] ?? []));

        return is_string($email) && filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }

    public static function formatAmount(int $amount): string
    {
        return 'Rs. '.number_format($amount);
    }
}
