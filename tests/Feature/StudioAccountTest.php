<?php

namespace Tests\Feature;

use App\Models\AuditEvent;
use App\Models\Project;
use App\Models\User;
use App\Support\Totp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudioAccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_two_factor_sign_in(): void
    {
        $user = User::factory()->create(['password' => 'secret-password']);

        $this->actingAs($user)->post('/account/two-factor');
        $secret = str_replace(' ', '', session('two_factor.pending_secret'));
        $this->get('/account')->assertInertia(fn (Assert $page) => $page->component('Account/Index')->where('setup.uri', fn (string $uri): bool => str_starts_with($uri, 'otpauth://totp/')));

        $this->post('/account/two-factor/confirm', ['code' => '000000'])->assertSessionHasErrors('code');
        $this->post('/account/two-factor/confirm', ['code' => Totp::code($secret)])->assertSessionHas('success');
        $user->refresh();
        $this->assertTrue($user->hasTwoFactor());
        $recoveryCode = $user->two_factor_recovery_codes[0];

        auth()->logout();
        $this->post('/login', ['email' => $user->email, 'password' => 'secret-password'])->assertRedirect('/two-factor');
        $this->assertGuest();
        $this->get('/two-factor')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Auth/TwoFactor'));
        $this->post('/two-factor', ['code' => '123456'])->assertSessionHasErrors('code');
        $this->post('/two-factor', ['code' => Totp::code($secret)])->assertRedirect('/');
        $this->assertAuthenticatedAs($user);

        auth()->logout();
        $this->post('/login', ['email' => $user->email, 'password' => 'secret-password']);
        $this->post('/two-factor', ['code' => strtolower($recoveryCode)])->assertRedirect('/');
        $this->assertNotContains($recoveryCode, $user->fresh()->two_factor_recovery_codes);

        $this->delete('/account/two-factor', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->delete('/account/two-factor', ['current_password' => 'secret-password'])->assertSessionHas('success');
        $this->assertFalse($user->fresh()->hasTwoFactor());
    }

    public function test_the_challenge_needs_a_password_first(): void
    {
        $this->get('/two-factor')->assertRedirect('/login');
        $this->post('/two-factor', ['code' => '123456'])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_passwords_can_be_changed(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)->put('/account/password', ['current_password' => 'nope', 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertSessionHasErrors('current_password');
        $this->put('/account/password', ['current_password' => 'old-password', 'password' => 'new-password', 'password_confirmation' => 'new-password'])->assertSessionHas('success');

        $this->assertTrue(password_verify('new-password', $user->fresh()->password));
    }

    public function test_school_staff_manage_their_own_account(): void
    {
        $this->actingAs(User::factory()->schoolStaff(Project::factory()->create())->create());

        $this->get('/account')->assertOk();
        $this->post('/account/two-factor')->assertRedirect();
    }

    public function test_the_activity_log_records_who_did_what(): void
    {
        $owner = User::factory()->create(['name' => 'Asha', 'password' => 'secret-password']);
        $project = Project::factory()->create();

        $this->post('/login', ['email' => $owner->email, 'password' => 'wrong']);
        $this->post('/login', ['email' => $owner->email, 'password' => 'secret-password']);
        $this->put("/projects/{$project->slug}/content/stats", ['value' => [['label' => 'Students', 'value' => '900']]]);
        $this->post('/users', ['name' => 'Ram', 'email' => 'ram@example.com', 'role' => 'editor', 'password' => 'password123']);
        $this->delete("/projects/{$project->slug}");

        $this->assertSame(
            ['auth.failed', 'auth.signed-in', 'content.changed', 'users.created', 'projects.deleted'],
            AuditEvent::query()->where('action', '!=', 'content.changed')->orWhere('user_id', $owner->id)->orderBy('id')->pluck('action')->all(),
        );
        $this->assertSame("Failed sign-in as {$owner->email}", AuditEvent::query()->where('action', 'auth.failed')->value('description'));
        $this->assertSame('Added Ram (ram@example.com) as Editor', AuditEvent::query()->where('action', 'users.created')->value('description'));

        $this->get('/activity')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Activity/Index')
            ->where('events.data.0.description', "Deleted {$project->name}")
            ->where('events.data.0.user', 'Asha'));
        $this->get("/activity?user={$owner->id}")->assertInertia(fn (Assert $page) => $page->has('events.data', 4));

        $this->actingAs(User::factory()->editor()->create())->get('/activity')->assertForbidden();
    }

    public function test_old_activity_is_pruned(): void
    {
        AuditEvent::create(['action' => 'auth.signed-in', 'description' => 'Old', 'created_at' => now()->subYears(2)]);
        AuditEvent::create(['action' => 'auth.signed-in', 'description' => 'Recent', 'created_at' => now()]);

        $this->artisan('model:prune', ['--model' => [AuditEvent::class]])->assertSuccessful();

        $this->assertSame(['Recent'], AuditEvent::query()->pluck('description')->all());
    }
}
