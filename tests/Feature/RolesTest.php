<?php

namespace Tests\Feature;

use App\Enums\StudioRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RolesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_viewers_can_look_but_not_change(): void
    {
        $project = Project::factory()->create();
        $this->actingAs(User::factory()->viewer()->create());

        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->where('auth.user.canEdit', false));
        $this->get("/projects/{$project->slug}/content/hero")->assertOk();
        $this->get("/preview/{$project->slug}")->assertOk();

        $this->put("/projects/{$project->slug}/content/hero", ['value' => ['title' => 'Hacked']])->assertForbidden();
        $this->put("/projects/{$project->slug}/design", ['theme' => 'modern'])->assertForbidden();
        $this->post('/projects', ['name' => 'X', 'target' => 'nextjs', 'theme' => 'classic', 'start_with' => 'blank'])->assertForbidden();
        $this->post("/projects/{$project->slug}/generate")->assertForbidden();
        $this->post('/logout')->assertRedirect();
    }

    public function test_editors_edit_schools_but_do_not_run_studio(): void
    {
        $project = Project::factory()->create();
        $this->actingAs(User::factory()->editor()->create());

        $this->put("/projects/{$project->slug}/design", ['theme' => 'modern'])->assertSessionHasNoErrors();
        $this->assertSame('modern', $project->fresh()->config['theme']);

        $this->delete("/projects/{$project->slug}")->assertForbidden();
        $this->post('/themes', ['name' => 'x', 'from' => 'classic'])->assertForbidden();
        $this->get('/users')->assertForbidden();
    }

    public function test_owners_manage_users(): void
    {
        $owner = User::factory()->create();
        $this->actingAs($owner);

        $this->get('/users')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Users/Index')->has('roles', 3));

        $this->post('/users', ['name' => 'Gita', 'email' => 'gita@example.com', 'role' => 'editor', 'password' => 'secret-password'])->assertSessionHasNoErrors();
        $gita = User::query()->where('email', 'gita@example.com')->sole();
        $this->assertSame(StudioRole::Editor, $gita->role);

        $this->patch("/users/{$gita->id}", ['role' => 'viewer']);
        $this->assertSame(StudioRole::Viewer, $gita->fresh()->role);

        $this->patch("/users/{$owner->id}", ['role' => 'editor'])->assertSessionHasErrors(['user' => 'Studio needs at least one owner.']);
        $this->delete("/users/{$owner->id}")->assertSessionHasErrors('user');

        $this->delete("/users/{$gita->id}")->assertSessionHas('success');
        $this->assertDatabaseMissing(User::class, ['email' => 'gita@example.com']);
    }

    public function test_the_command_sets_a_role(): void
    {
        $this->artisan('studio:user', ['email' => 'teacher@example.com', '--name' => 'Teacher', '--password' => 'secret-password', '--role' => 'viewer'])->assertSuccessful();

        $this->assertSame(StudioRole::Viewer, User::query()->where('email', 'teacher@example.com')->sole()->role);

        $this->artisan('studio:user', ['email' => 'x@example.com', '--password' => 'secret-password', '--role' => 'king'])->assertFailed();
    }
}
