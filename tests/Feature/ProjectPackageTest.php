<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Project;
use App\Models\User;
use App\Notifications\InvoiceIssued;
use App\Support\Billing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectPackageTest extends TestCase
{
    use RefreshDatabase;

    private Project $school;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        Notification::fake();
        config(['studio.hosting_domain' => 'schools.test', 'studio.payment_instructions' => 'Pay to NIC Asia A/C 0123456789.']);

        $this->school = Project::factory()->example()->create(['signed_up_at' => now(), 'onboarded_at' => now(), 'trial_ends_at' => now()->addDays(7), 'billing_email' => 'office@school.test']);
        $this->staff = User::factory()->schoolStaff($this->school)->create();
    }

    public function test_during_the_trial_schools_edit_and_preview_but_must_buy_a_package_to_publish(): void
    {
        $this->actingAs($this->staff);
        $slug = $this->school->slug;

        $this->get("/projects/{$slug}/content")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('project.needsPackage', true)
            ->where('project.trialEndsAt', $this->school->trial_ends_at->toIso8601String()));
        $this->put("/projects/{$slug}/content/hero", ['value' => [...$this->school->config['hero'], 'title' => 'Trial edit']])->assertSessionHasNoErrors();
        $this->get("/preview/{$slug}/about")->assertOk();

        $this->post("/projects/{$slug}/publish")
            ->assertRedirect("/projects/{$slug}/package")
            ->assertSessionHas('error', 'Choose a monthly or yearly package to publish your website.');
        $this->assertNull($this->school->fresh()->published_at);
    }

    public function test_schools_choose_a_monthly_or_yearly_package_and_publish_once_it_is_paid(): void
    {
        $monthly = Plan::factory()->create(['name' => 'Monthly', 'price' => 1500, 'period' => 'month']);
        $yearly = Plan::factory()->create(['name' => 'Yearly', 'price' => 15000, 'period' => 'year']);
        $this->actingAs($this->staff);
        $slug = $this->school->slug;

        $this->get("/projects/{$slug}/package")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Projects/Package')
            ->where('plans.0.name', 'Monthly')
            ->where('plans.1.name', 'Yearly')
            ->where('invoice', null)
            ->where('isPaid', false)
            ->where('paymentInstructions', 'Pay to NIC Asia A/C 0123456789.'));

        $this->post("/projects/{$slug}/package", ['plan_id' => $monthly->id])->assertSessionHas('success');
        $this->post("/projects/{$slug}/package", ['plan_id' => $yearly->id])->assertSessionHas('success');

        $invoices = $this->school->invoices()->orderBy('id')->get();
        $this->assertSame([Invoice::STATUS_VOID, Invoice::STATUS_UNPAID], $invoices->pluck('status')->all());
        $invoice = $invoices->last();
        $this->assertSame(15000, $invoice->amount);
        $this->assertTrue($this->school->fresh()->plan->is($yearly));
        Notification::assertSentOnDemand(InvoiceIssued::class, fn (InvoiceIssued $notification, array $channels, object $notifiable): bool => $notifiable->routes['mail'] === 'office@school.test');

        $this->get("/projects/{$slug}/package")->assertInertia(fn (Assert $page) => $page->where('invoice.number', $invoice->number));
        $this->get("/projects/{$slug}/invoices/{$invoice->id}")->assertOk()->assertSee($invoice->number)->assertSee('Pay to NIC Asia A/C 0123456789.');
        $this->post("/projects/{$slug}/publish")->assertRedirect("/projects/{$slug}/package");

        Billing::markPaid($invoice, 'BANK-1');

        $this->get("/projects/{$slug}/package")->assertInertia(fn (Assert $page) => $page->where('isPaid', true)->where('project.needsPackage', false));
        $this->post("/projects/{$slug}/publish")->assertSessionHas('success');
        $this->assertNotNull($this->school->fresh()->published_at);
    }

    public function test_after_the_trial_only_the_package_page_is_open(): void
    {
        $this->school->update(['trial_ends_at' => now()->subMinute()]);
        $plan = Plan::factory()->create();
        $this->actingAs($this->staff);
        $slug = $this->school->slug;

        $this->get('/')->assertRedirect("/projects/{$slug}/package");
        $this->get("/projects/{$slug}/content")->assertRedirect("/projects/{$slug}/package");
        $this->get("/preview/{$slug}")->assertRedirect("/projects/{$slug}/package");
        $this->get("/projects/{$slug}/package")->assertOk()->assertInertia(fn (Assert $page) => $page->where('trialEnded', true));
        $this->get('/account')->assertOk();

        $this->post("/projects/{$slug}/package", ['plan_id' => $plan->id])->assertSessionHas('success');
        Billing::markPaid($this->school->invoices()->sole());

        $this->actingAs($this->staff->fresh())->get("/projects/{$slug}/content")->assertOk();
    }

    public function test_schools_cannot_see_other_schools_invoices(): void
    {
        $other = Project::factory()->create(['plan_id' => Plan::factory()->create()->id]);
        $invoice = Billing::issue($other);
        $this->actingAs($this->staff);

        $this->get("/projects/{$this->school->slug}/invoices/{$invoice->id}")->assertNotFound();
        $this->get("/projects/{$other->slug}/invoices/{$invoice->id}")->assertForbidden();
        $this->get("/projects/{$other->slug}/package")->assertForbidden();
    }

    public function test_schools_made_in_studio_publish_without_a_package(): void
    {
        $project = Project::factory()->example()->create();
        $this->actingAs(User::factory()->create());

        $this->post("/projects/{$project->slug}/publish")->assertSessionHas('success');
    }
}
