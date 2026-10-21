<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Project;
use App\Models\User;
use App\Notifications\InvoiceIssued;
use App\Support\Billing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Notification::fake();
        config(['app.url' => 'http://studio.test', 'studio.grace_days' => 14, 'studio.invoice_days_before' => 14]);
        $this->travelTo('2026-10-21 09:00:00');
    }

    private function hostedSchool(Plan $plan, ?string $paidUntil): Project
    {
        $project = Project::factory()->create(['domain' => 'school.edu.np', 'published_at' => now(), 'published_site' => ['languages' => ['en'], 'locales' => ['en' => ['site' => ['pages' => [], 'school' => []], 'tokens' => [], 'extraCss' => '']], 'configHash' => '']]);
        $project->forceFill(['plan_id' => $plan->id, 'paid_until' => $paidUntil, 'billing_email' => 'accounts@school.edu.np'])->save();

        return $project;
    }

    public function test_invoices_are_issued_before_the_paid_period_ends(): void
    {
        $plan = Plan::factory()->create();
        $soon = $this->hostedSchool($plan, '2026-10-31');
        $later = Project::factory()->create(['plan_id' => $plan->id, 'paid_until' => '2026-12-31']);
        Project::factory()->create();

        $this->artisan('studio:invoices')->expectsOutputToContain('1 invoice issued')->assertSuccessful();

        $invoice = $soon->invoices()->sole();
        $this->assertSame('2026-11-01', $invoice->period_start->toDateString());
        $this->assertSame('2026-11-30', $invoice->period_end->toDateString());
        $this->assertSame('2026-11-01', $invoice->due_on->toDateString());
        $this->assertSame(1500, $invoice->amount);
        $this->assertSame('INV-2026-'.str_pad((string) $invoice->id, 5, '0', STR_PAD_LEFT), $invoice->number);
        $this->assertSame(Billing::STATUS_DUE, Billing::status($soon));
        $this->assertSame(0, $later->invoices()->count());
        Notification::assertSentOnDemand(InvoiceIssued::class, fn (InvoiceIssued $notification, array $channels, AnonymousNotifiable $notifiable): bool => $notifiable->routes['mail'] === 'accounts@school.edu.np'
            && str_contains($notification->toMail($notifiable)->subject, 'Rs. 1,500'));

        $this->artisan('studio:invoices')->expectsOutputToContain('0 invoices issued');
    }

    public function test_paying_extends_the_period_and_yearly_plans_bill_a_year(): void
    {
        $project = $this->hostedSchool(Plan::factory()->yearly()->create(), '2026-10-25');
        $invoice = Billing::issue($project);
        $this->assertSame('2027-10-25', $invoice->period_end->toDateString());

        $this->actingAs(User::factory()->create())->post("/invoices/{$invoice->id}/pay", ['payment_reference' => 'ESEWA-123'])->assertSessionHas('success');

        $this->assertSame('2027-10-25', $project->fresh()->paid_until->toDateString());
        $this->assertSame('ESEWA-123', $invoice->fresh()->payment_reference);
        $this->assertSame(Billing::STATUS_ACTIVE, Billing::status($project->fresh()));
        $this->post("/invoices/{$invoice->id}/pay")->assertStatus(422);
    }

    public function test_unpaid_hosted_schools_are_suspended_after_the_grace_period(): void
    {
        $project = $this->hostedSchool(Plan::factory()->create(), '2026-10-15');
        $invoice = Billing::issue($project);

        $this->assertSame(Billing::STATUS_OVERDUE, Billing::status($project));
        $this->assertFalse(Billing::isSuspended($project));

        $this->travelTo('2026-10-30 09:00:00');
        $this->assertTrue(Billing::isSuspended($project));
        $this->get('http://school.edu.np/')->assertStatus(503)->assertSee('temporarily unavailable');
        $this->postJson('http://school.edu.np/_school/contact', ['name' => 'X'])->assertStatus(503);

        Billing::markPaid($invoice);
        $this->assertFalse(Billing::isSuspended($project->fresh()));
        $this->get('http://school.edu.np/missing-page')->assertNotFound();
    }

    public function test_a_new_school_on_a_plan_is_suspended_only_after_its_first_invoice_is_late(): void
    {
        $project = $this->hostedSchool(Plan::factory()->create(), null);
        $this->assertFalse(Billing::isSuspended($project));

        Billing::issueDueInvoices();
        $this->assertSame('2026-10-21', $project->invoices()->sole()->due_on->toDateString());

        $this->travel(15)->days();
        $this->assertTrue(Billing::isSuspended($project));
    }

    public function test_schools_without_a_plan_are_never_billed_or_suspended(): void
    {
        $project = Project::factory()->create(['paid_until' => '2020-01-01']);

        $this->assertSame(Billing::STATUS_NONE, Billing::status($project));
        $this->assertFalse(Billing::isSuspended($project));
        $this->assertSame([], Billing::issueDueInvoices());
    }

    public function test_owners_manage_plans_school_billing_and_invoices(): void
    {
        $owner = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($owner)->post('/billing/plans', ['name' => 'Basic', 'price' => 900, 'period' => 'week'])->assertSessionHasErrors('period');
        $this->post('/billing/plans', ['name' => 'Basic', 'price' => 900, 'period' => 'month'])->assertSessionHas('success');
        $plan = Plan::query()->sole();
        $this->put("/billing/plans/{$plan->id}", ['name' => 'Basic', 'price' => 1000, 'period' => 'month'])->assertSessionHas('success');
        $this->assertSame(1000, $plan->fresh()->price);

        $this->post("/billing/schools/{$project->slug}/invoices")->assertSessionHas('error');
        $this->put("/billing/schools/{$project->slug}", ['plan_id' => $plan->id, 'paid_until' => '2026-11-30', 'billing_email' => 'not-an-email'])->assertSessionHasErrors('billing_email');
        $this->put("/billing/schools/{$project->slug}", ['plan_id' => $plan->id, 'paid_until' => '2026-11-30', 'billing_email' => null])->assertSessionHas('success');
        $this->delete("/billing/plans/{$plan->id}")->assertSessionHasErrors('plan');

        $this->post("/billing/schools/{$project->slug}/invoices")->assertSessionHas('success');
        $invoice = $project->invoices()->sole();
        $this->assertSame('2026-12-01', $invoice->period_start->toDateString());

        $this->get('/billing')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Billing/Index')
            ->where('plans.0.projects_count', 1)
            ->where('schools.0.status', Billing::STATUS_DUE)
            ->where('invoices.data.0.number', $invoice->number));
        $this->get("/invoices/{$invoice->id}")->assertOk()->assertSee($invoice->number)->assertSee('Rs. 1,000');

        $this->post("/invoices/{$invoice->id}/void")->assertSessionHas('success');
        $this->assertSame(Invoice::STATUS_VOID, $invoice->fresh()->status);
        $this->post("/invoices/{$invoice->id}/pay")->assertStatus(422);
    }

    public function test_billing_is_for_owners_only(): void
    {
        $invoice = Invoice::factory()->create();

        foreach ([User::factory()->editor()->create(), User::factory()->viewer()->create()] as $user) {
            $this->actingAs($user)->get('/billing')->assertForbidden();
            $this->get("/invoices/{$invoice->id}")->assertForbidden();
            $this->post("/invoices/{$invoice->id}/pay")->assertForbidden();
            $this->post('/billing/plans', ['name' => 'X', 'price' => 1, 'period' => 'month'])->assertForbidden();
        }
    }

    public function test_invoices_are_issued_daily(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('studio:invoices')->assertSuccessful();
    }
}
