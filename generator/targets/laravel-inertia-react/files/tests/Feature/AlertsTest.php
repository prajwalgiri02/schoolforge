<?php

namespace Tests\Feature;

use App\Jobs\SendAlert;
use App\Models\Alert;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AlertsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false, 'mail.default' => 'array']);
    }

    public function test_visitors_subscribe_by_email(): void
    {
        $this->postJson('/subscribe', ['email' => 'Parent@Example.com'])->assertCreated();
        $this->postJson('/subscribe', ['email' => 'parent@example.com', 'locale' => 'ne'])->assertCreated();

        $subscriber = Subscriber::query()->sole();
        $this->assertSame('parent@example.com', $subscriber->email);
        $this->assertSame('ne', $subscriber->locale);

        $this->postJson('/subscribe', [])->assertJsonValidationErrors('email');
        $this->postJson('/subscribe', ['phone' => '9801234567'])->assertJsonValidationErrors('email');
    }

    public function test_subscribers_can_unsubscribe(): void
    {
        $subscriber = Subscriber::factory()->create();

        $this->get("/unsubscribe/{$subscriber->token}")->assertOk()->assertSee('You are unsubscribed');

        $this->assertNotNull($subscriber->fresh()->unsubscribed_at);
        $this->assertSame(0, Subscriber::query()->active()->count());
    }

    public function test_admins_queue_alerts(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        Subscriber::factory()->count(2)->create();

        $this->actingAs($admin)->get('/admin/alerts')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Alerts')->where('subscriberCount', 2));

        $this->actingAs($admin)->post('/admin/alerts', ['subject' => 'Closed', 'message' => ''])
            ->assertSessionHasErrors('message');

        $this->actingAs($admin)->post('/admin/alerts', ['subject' => 'Closed', 'message' => 'Heavy rain.'])
            ->assertSessionHasNoErrors();

        Queue::assertPushed(SendAlert::class, fn (SendAlert $job): bool => $job->alert->subject === 'Closed');
    }

    public function test_alerts_are_emailed_to_active_subscribers(): void
    {
        Subscriber::factory()->create(['email' => 'a@example.com']);
        Subscriber::factory()->create(['email' => 'b@example.com']);
        Subscriber::factory()->create(['email' => 'gone@example.com', 'unsubscribed_at' => now()]);

        $alert = Alert::create(['subject' => 'School closed tomorrow', 'message' => 'Due to heavy rain.']);
        (new SendAlert($alert))->handle();

        $alert->refresh();
        $this->assertSame(2, $alert->email_count);
        $this->assertNotNull($alert->sent_at);

        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(2, $messages);
        $this->assertStringContainsString('Due to heavy rain.', $messages[0]->getOriginalMessage()->getTextBody());
        $this->assertStringContainsString('/unsubscribe/', $messages[0]->getOriginalMessage()->getTextBody());
    }

    public function test_subscribers_export_as_csv(): void
    {
        Subscriber::factory()->create(['email' => 'csv@example.com']);

        $csv = $this->actingAs(User::factory()->create())->get('/admin/alerts/subscribers.csv')->assertOk()->streamedContent();

        $this->assertStringContainsString('csv@example.com', $csv);
    }
}
