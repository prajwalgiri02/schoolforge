<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_guests_are_redirected_to_sign_in(): void
    {
        $this->get('/projects/create')->assertRedirect('/login');
        $this->get('/themes')->assertRedirect('/login');
        $this->post('/projects', ['name' => 'Sneaky'])->assertRedirect('/login');
    }

    public function test_sign_in_page_renders(): void
    {
        $this->get('/login')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
    }

    public function test_users_can_sign_in_and_out(): void
    {
        User::factory()->create(['email' => 'me@example.com', 'password' => 'correct-horse']);

        $this->post('/login', ['email' => 'me@example.com', 'password' => 'correct-horse'])->assertRedirect('/');
        $this->assertAuthenticated();

        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_wrong_password_is_rejected(): void
    {
        User::factory()->create(['email' => 'me@example.com', 'password' => 'correct-horse']);

        $this->from('/login')
            ->post('/login', ['email' => 'me@example.com', 'password' => 'wrong'])
            ->assertRedirect('/login')
            ->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_too_many_sign_in_attempts_show_a_message(): void
    {
        foreach (range(1, 5) as $attempt) {
            $this->post('/login', ['email' => 'me@example.com', 'password' => 'wrong']);
        }

        $this->from('/login')
            ->post('/login', ['email' => 'me@example.com', 'password' => 'wrong'], ['X-Inertia' => 'true'])
            ->assertRedirect('/login')
            ->assertSessionHasErrors(['email' => 'Too many attempts. Please wait 1 minute and try again.']);
    }

    public function test_signed_in_users_skip_the_sign_in_page(): void
    {
        $this->actingAs(User::factory()->create())->get('/login')->assertRedirect('/');
    }

    public function test_studio_user_command_creates_and_updates_accounts(): void
    {
        $this->artisan('studio:user', ['email' => 'owner@example.com', '--name' => 'Owner', '--password' => 'first-password'])->assertSuccessful();
        $this->assertTrue(Hash::check('first-password', User::query()->where('email', 'owner@example.com')->sole()->password));

        $this->artisan('studio:user', ['email' => 'owner@example.com', '--password' => 'second-password'])->assertSuccessful();
        $this->assertTrue(Hash::check('second-password', User::query()->where('email', 'owner@example.com')->sole()->password));

        $this->artisan('studio:user', ['email' => 'nope', '--password' => 'x'])->assertFailed();
    }
}
