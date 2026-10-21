<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Project;
use App\Support\Billing;
use App\Support\HostedSites;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Hosting plans, each school's plan and paid period, and invoices.
 */
class BillingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Billing/Index', [
            'plans' => Plan::query()->withCount('projects')->orderBy('price')->get(['id', 'name', 'price', 'period', 'description']),
            'schools' => Project::query()->where('is_template', false)->with('plan:id,name')->orderBy('name')->get()->map(fn (Project $project): array => [
                'slug' => $project->slug,
                'name' => $project->name,
                'planId' => $project->plan_id,
                'paidUntil' => $project->paid_until?->toDateString(),
                'billingEmail' => $project->billing_email,
                'defaultEmail' => Billing::billingEmail($project->replicate(['billing_email'])),
                'status' => Billing::status($project),
                'hosted' => $project->isPublished(),
                'url' => $project->isPublished() ? HostedSites::url($project) : null,
            ]),
            'invoices' => Invoice::query()->with('project:id,name,slug')->latest('id')->paginate(25)->through(fn (Invoice $invoice): array => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'school' => $invoice->project->name,
                'description' => $invoice->description,
                'amount' => $invoice->amount,
                'periodStart' => $invoice->period_start->toDateString(),
                'periodEnd' => $invoice->period_end->toDateString(),
                'dueOn' => $invoice->due_on->toDateString(),
                'status' => $invoice->status,
                'paidAt' => $invoice->paid_at?->toIso8601String(),
                'paymentReference' => $invoice->payment_reference,
            ]),
            'graceDays' => config('studio.grace_days'),
        ]);
    }

    public function storePlan(Request $request): RedirectResponse
    {
        Plan::create($this->validatePlan($request));

        return back()->with('success', 'Plan added.');
    }

    public function updatePlan(Request $request, Plan $plan): RedirectResponse
    {
        $plan->update($this->validatePlan($request));

        return back()->with('success', 'Plan saved. New invoices use the new price.');
    }

    public function destroyPlan(Plan $plan): RedirectResponse
    {
        if ($plan->projects()->exists()) {
            return back()->withErrors(['plan' => 'Move the schools on this plan to another plan first.']);
        }

        $plan->delete();

        return back()->with('success', 'Plan deleted.');
    }

    /**
     * A school's plan, paid-until date and billing email.
     */
    public function updateSchool(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'plan_id' => ['nullable', 'integer', Rule::exists('plans', 'id')],
            'paid_until' => ['nullable', 'date_format:Y-m-d'],
            'billing_email' => ['nullable', 'email', 'max:190'],
        ]);

        $project->forceFill($validated)->save();

        return back()->with('success', "Billing for {$project->name} saved.");
    }

    public function issue(Project $project): RedirectResponse
    {
        if ($project->plan === null) {
            return back()->with('error', "Choose a plan for {$project->name} first.");
        }

        $invoice = Billing::issue($project);

        return back()->with('success', "Invoice {$invoice->number} issued".(Billing::billingEmail($project) ? ' and emailed.' : '. The school has no email address to send it to.'));
    }

    public function pay(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_unless($invoice->status === Invoice::STATUS_UNPAID, 422, 'Only unpaid invoices can be marked paid.');

        $validated = $request->validate(['payment_reference' => ['nullable', 'string', 'max:120']]);
        Billing::markPaid($invoice, $validated['payment_reference'] ?? null);

        return back()->with('success', "{$invoice->number} marked paid. {$invoice->project->name} is paid until ".$invoice->project->fresh()->paid_until->format('j M Y').'.');
    }

    public function void(Invoice $invoice): RedirectResponse
    {
        abort_unless($invoice->status === Invoice::STATUS_UNPAID, 422, 'Only unpaid invoices can be cancelled.');

        $invoice->update(['status' => Invoice::STATUS_VOID]);

        return back()->with('success', "{$invoice->number} cancelled.");
    }

    /**
     * A printable invoice to send or save as PDF.
     */
    public function show(Invoice $invoice): View
    {
        return view('invoice', ['invoice' => $invoice->load('project'), 'billingEmail' => Billing::billingEmail($invoice->project)]);
    }

    /**
     * @return array{name: string, price: int, period: string, description: string|null}
     */
    private function validatePlan(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'price' => ['required', 'integer', 'min:0', 'max:10000000'],
            'period' => ['required', Rule::in(Plan::PERIODS)],
            'description' => ['nullable', 'string', 'max:255'],
        ]);
    }
}
