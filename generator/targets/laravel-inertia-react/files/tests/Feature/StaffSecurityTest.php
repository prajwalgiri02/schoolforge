<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Models\User;
use App\Support\Totp;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StaffSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.ssr.enabled' => false]);
    }

    public function test_totp_codes_match_the_rfc_test_vectors(): void
    {
        $secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

        $this->assertSame('287082', Totp::code($secret, 59));
        $this->assertSame('081804', Totp::code($secret, 1111111109));
        $this->assertSame('005924', Totp::code($secret, 1234567890));
        $this->assertTrue(Totp::verify($secret, '287 082', 59 + 30), 'the previous step is accepted for clock drift');
        $this->assertFalse(Totp::verify($secret, '287082', 59 + 90));
        $this->assertMatchesRegularExpression('/^[A-Z2-7]{32}$/', Totp::newSecret());
    }

    public function test_two_factor_sign_in(): void
    {
        $user = User::factory()->create(['password' => 'secret-password']);

        $this->actingAs($user)->post('/admin/account/two-factor');
        $secret = str_replace(' ', '', session('two_factor.pending_secret'));

        $this->actingAs($user)->post('/admin/account/two-factor/confirm', ['code' => '000000'])->assertSessionHasErrors('code');
        $this->actingAs($user)->post('/admin/account/two-factor/confirm', ['code' => Totp::code($secret)])->assertSessionHas('success');

        $user->refresh();
        $this->assertTrue($user->hasTwoFactor());
        $this->assertCount(8, $user->two_factor_recovery_codes);
        $recoveryCode = $user->two_factor_recovery_codes[0];

        auth()->logout();
        $this->post('/admin/login', ['email' => $user->email, 'password' => 'secret-password'])->assertRedirect('/admin/two-factor');
        $this->assertGuest();

        $this->post('/admin/two-factor', ['code' => '123456'])->assertSessionHasErrors('code');
        $this->post('/admin/two-factor', ['code' => Totp::code($secret)])->assertRedirect('/admin');
        $this->assertAuthenticatedAs($user);

        auth()->logout();
        $this->post('/admin/login', ['email' => $user->email, 'password' => 'secret-password']);
        $this->post('/admin/two-factor', ['code' => strtolower($recoveryCode)])->assertRedirect('/admin');
        $this->assertNotContains($recoveryCode, $user->fresh()->two_factor_recovery_codes, 'recovery codes work once');
    }

    public function test_the_challenge_needs_a_password_first(): void
    {
        $this->get('/admin/two-factor')->assertRedirect('/admin/login');
        $this->post('/admin/two-factor', ['code' => '123456'])->assertSessionHasErrors('code');
        $this->assertGuest();
    }

    public function test_two_factor_can_be_turned_off_with_the_password(): void
    {
        $user = User::factory()->create(['password' => 'secret-password']);
        $user->forceFill(['two_factor_secret' => Totp::newSecret(), 'two_factor_recovery_codes' => ['A'], 'two_factor_confirmed_at' => now()])->save();

        $this->actingAs($user)->delete('/admin/account/two-factor', ['current_password' => 'wrong'])->assertSessionHasErrors('current_password');
        $this->actingAs($user)->delete('/admin/account/two-factor', ['current_password' => 'secret-password'])->assertSessionHas('success');

        $this->assertFalse($user->fresh()->hasTwoFactor());
    }

    public function test_forgotten_passwords_are_reset_by_email(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->post('/admin/forgot-password', ['email' => $user->email])->assertSessionHas('success');
        $this->post('/admin/forgot-password', ['email' => 'nobody@example.com'])->assertSessionHas('success');

        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringContainsString('/admin/reset-password/', $url);

            $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component('Admin/ResetPassword')->where('email', $user->email));
            $this->post('/admin/reset-password', ['token' => $notification->token, 'email' => $user->email, 'password' => 'brand-new-password', 'password_confirmation' => 'brand-new-password'])
                ->assertRedirect('/admin/login');

            return true;
        });

        $this->post('/admin/login', ['email' => $user->email, 'password' => 'brand-new-password'])->assertRedirect('/admin');
    }

    public function test_admins_invite_staff_and_editors_have_limited_access(): void
    {
        Notification::fake();
        $admin = User::factory()->create();

        $this->actingAs($admin)->post('/admin/staff', ['name' => 'Ram', 'email' => 'ram@example.com', 'role' => 'editor'])->assertSessionHas('success');
        $editor = User::query()->where('email', 'ram@example.com')->sole();
        $this->assertSame(StaffRole::Editor, $editor->role);
        Notification::assertSentTo($editor, ResetPassword::class);

        $this->actingAs($editor)->get('/admin')->assertOk()->assertInertia(fn (Assert $page) => $page->where('auth.user.isAdmin', false));
        $this->actingAs($editor)->get('/admin/messages')->assertOk();
        $this->actingAs($editor)->get('/admin/submissions')->assertOk();
        $this->actingAs($editor)->get('/admin/account')->assertOk();
        foreach (['/admin/staff', '/admin/payments', '/admin/results', '/admin/alerts'] as $url) {
            $this->actingAs($editor)->get($url)->assertForbidden();
        }

        $this->actingAs($admin)->patch("/admin/staff/{$admin->id}", ['role' => 'editor'])->assertSessionHasErrors('user');
        $this->actingAs($admin)->delete("/admin/staff/{$admin->id}")->assertSessionHasErrors('user');
        $this->actingAs($admin)->delete("/admin/staff/{$editor->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing(User::class, ['email' => 'ram@example.com']);
    }

    public function test_passwords_can_be_changed(): void
    {
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($user)->put('/admin/account/password', ['current_password' => 'nope', 'password' => 'new-password', 'password_confirmation' => 'new-password'])
            ->assertSessionHasErrors('current_password');
        $this->actingAs($user)->put('/admin/account/password', ['current_password' => 'old-password', 'password' => 'new-password', 'password_confirmation' => 'new-password'])
            ->assertSessionHas('success');

        $this->assertTrue(password_verify('new-password', $user->fresh()->password));
    }

    public function test_the_admin_command_sets_a_role(): void
    {
        $this->artisan('school:admin', ['email' => 'office@example.com', '--password' => 'secret-password', '--role' => 'editor'])->assertSuccessful();

        $this->assertSame(StaffRole::Editor, User::query()->where('email', 'office@example.com')->sole()->role);
    }
}
