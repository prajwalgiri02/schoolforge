<?php

namespace Tests\Feature;

use App\Jobs\SendAlert;
use App\Models\Alert;
use App\Models\Subscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
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

    public function test_visitors_subscribe_by_email_or_phone(): void
    {
        $this->postJson('/subscribe', ['email' => 'Parent@Example.com'])->assertCreated();
        $this->postJson('/subscribe', ['email' => 'parent@example.com', 'phone' => '+977 980-1234567'])->assertCreated();

        $subscriber = Subscriber::query()->sole();
        $this->assertSame('parent@example.com', $subscriber->email);
        $this->assertSame('9801234567', $subscriber->phone);

        $this->postJson('/subscribe', [])->assertJsonValidationErrors(['email', 'phone']);
        $this->postJson('/subscribe', ['phone' => '12345'])->assertJsonValidationErrors('phone');
    }

    public function test_subscribers_can_unsubscribe(): void
    {
        $subscriber = Subscriber::factory()->create();

        $this->get("/unsubscribe/{$subscriber->token}")->assertOk()->assertSee('You are unsubscribed');

        $this->assertNotNull($subscriber->fresh()->unsubscribed_at);
        $this->assertSame(0, Subscriber::query()->active()->count());
    }

    public function test_admins_queue_alerts_and_sms_needs_a_token(): void
    {
        Queue::fake();
        $admin = User::factory()->create();
        Subscriber::factory()->count(2)->create();

        $this->actingAs($admin)->get('/admin/alerts')
            ->assertInertia(fn (Assert $page) => $page->component('Admin/Alerts')->where('counts.email', 2)->where('smsConfigured', false));

        $this->actingAs($admin)->post('/admin/alerts', ['subject' => 'Closed', 'message' => 'Heavy rain.', 'channels' => ['sms']])
            ->assertSessionHasErrors('channels.0');

        $this->actingAs($admin)->post('/admin/alerts', ['subject' => 'Closed', 'message' => 'Heavy rain.', 'channels' => ['email']])
            ->assertSessionHasNoErrors();

        Queue::assertPushed(SendAlert::class, fn (SendAlert $job): bool => $job->alert->subject === 'Closed');
    }

    public function test_alerts_are_emailed_and_texted_to_active_subscribers(): void
    {
        config(['school.sms.token' => 'test-token', 'school.sms.from' => 'School']);
        Http::fake(['api.sparrowsms.com/*' => Http::response(['response_code' => 200, 'count' => 2])]);

        Subscriber::factory()->create(['email' => 'a@example.com', 'phone' => '9801111111']);
        Subscriber::factory()->create(['email' => null, 'phone' => '9812222222']);
        Subscriber::factory()->create(['email' => 'gone@example.com', 'phone' => '9803333333', 'unsubscribed_at' => now()]);

        $alert = Alert::create(['subject' => 'School closed tomorrow', 'message' => 'Due to heavy rain.', 'channels' => ['email', 'sms']]);
        (new SendAlert($alert))->handle();

        $alert->refresh();
        $this->assertSame(1, $alert->email_count);
        $this->assertSame(2, $alert->sms_count);
        $this->assertNull($alert->error);
        $this->assertNotNull($alert->sent_at);

        $messages = Mail::mailer('array')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);
        $this->assertStringContainsString('/unsubscribe/', $messages[0]->getOriginalMessage()->getTextBody());

        Http::assertSent(fn (Request $request): bool => $request['token'] === 'test-token'
            && $request['from'] === 'School'
            && $request['to'] === '9801111111,9812222222'
            && str_contains($request['text'], 'Due to heavy rain.'));
    }

    public function test_sms_failures_are_recorded_on_the_alert(): void
    {
        config(['school.sms.token' => 'bad-token']);
        Http::fake(['api.sparrowsms.com/*' => Http::response(['response' => 'Invalid Token'], 403)]);
        Subscriber::factory()->create();

        $alert = Alert::create(['subject' => 'Test', 'message' => 'Hello', 'channels' => ['sms']]);
        (new SendAlert($alert))->handle();

        $this->assertSame(0, $alert->fresh()->sms_count);
        $this->assertStringContainsString('Invalid Token', $alert->fresh()->error);
    }

    public function test_subscribers_export_as_csv(): void
    {
        Subscriber::factory()->create(['email' => 'csv@example.com']);

        $csv = $this->actingAs(User::factory()->create())->get('/admin/alerts/subscribers.csv')->assertOk()->streamedContent();

        $this->assertStringContainsString('csv@example.com', $csv);
    }
}
