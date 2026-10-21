<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Project;
use App\Support\Audit;
use App\Support\Billing;
use App\Support\ProjectPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where a school picks a monthly or yearly package and sees how to pay for it.
 * A school that signed itself up publishes once its package is paid.
 */
class ProjectPackageController extends Controller
{
    public function show(Project $project, ProjectPresenter $presenter): Response
    {
        $invoice = $project->invoices()->where('status', Invoice::STATUS_UNPAID)->latest('id')->first();

        return Inertia::render('Projects/Package', [
            'project' => $presenter->summary($project),
            'plans' => Plan::query()->orderByRaw("period = 'year'")->orderBy('price')->get(['id', 'name', 'price', 'period', 'description'])->map(fn (Plan $plan): array => [
                ...$plan->only(['id', 'name', 'period', 'description']),
                'price' => Billing::formatAmount($plan->price),
            ]),
            'currentPlanId' => $project->plan_id,
            'paidUntil' => $project->paid_until?->toDateString(),
            'isPaid' => $project->paid_until !== null && ! $project->paid_until->lt(today()),
            'trialEndsAt' => $project->trial_ends_at?->toIso8601String(),
            'trialEnded' => Billing::trialEnded($project),
            'invoice' => $invoice ? [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'description' => $invoice->description,
                'amount' => Billing::formatAmount($invoice->amount),
                'dueOn' => $invoice->due_on->toDateString(),
            ] : null,
            'paymentInstructions' => config('studio.payment_instructions'),
        ]);
    }

    /**
     * Chooses a package and issues its invoice, replacing an unpaid one.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate(['plan_id' => ['required', 'integer', Rule::exists(Plan::class, 'id')]]);

        $invoice = DB::transaction(function () use ($project, $validated): Invoice {
            $project->invoices()->where('status', Invoice::STATUS_UNPAID)->update(['status' => Invoice::STATUS_VOID]);
            $project->forceFill(['plan_id' => $validated['plan_id']])->save();

            return Billing::issue($project->load('plan'));
        });

        Audit::record('billing.package', "{$project->name} chose the {$project->plan->name} package ({$invoice->number})", $project);

        return back()->with('success', "Invoice {$invoice->number} issued. Your website can be published as soon as the payment is confirmed.");
    }

    /**
     * The school's own invoice, to print or save as PDF.
     */
    public function invoice(Project $project, Invoice $invoice): View
    {
        abort_unless($invoice->project_id === $project->id, 404);

        return view('invoice', ['invoice' => $invoice->load('project'), 'billingEmail' => Billing::billingEmail($project)]);
    }
}
