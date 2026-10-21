<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectVersion;
use App\Models\User;
use App\Support\ProjectChecks;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectHistoryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->user = User::factory()->create(['name' => 'Asha']);
        $this->actingAs($this->user);
    }

    public function test_every_config_change_is_recorded_with_who_and_what(): void
    {
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'hero' => ['title' => 'Welcome'], 'colors' => ['primary' => '#7f1d1d']]]);
        $project->update(['name' => 'Renamed only']);

        $this->assertSame(['Changed hero and colors', 'Created'], $project->versions()->latest('id')->pluck('summary')->all());
        $this->assertSame($this->user->id, $project->versions()->latest('id')->first()->user_id);

        $this->get("/projects/{$project->slug}/history")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/History')
                ->where('activity.0.summary', 'Changed hero and colors')
                ->where('activity.0.user', 'Asha'));
    }

    public function test_projects_from_before_history_get_a_starting_version(): void
    {
        $project = Project::factory()->create();
        $project->versions()->delete();

        $this->get("/projects/{$project->slug}/history")->assertInertia(fn (Assert $page) => $page->where('activity.0.summary', 'Content as it was when history started'));
        $this->assertSame(1, $project->versions()->count());
    }

    public function test_change_descriptions(): void
    {
        $this->assertSame('No changes', ProjectVersion::describe(['a' => 1], ['a' => 1]));
        $this->assertSame('Changed school details', ProjectVersion::describe(['school' => ['name' => 'A']], ['school' => ['name' => 'B']]));
        $this->assertSame('Changed ne translation', ProjectVersion::describe(['translations' => ['ne' => ['hero' => []]]], ['translations' => ['ne' => ['hero' => ['title' => 'x']]]]));
        $this->assertSame('Changed a, b and 2 more', ProjectVersion::describe([], ['a' => 1, 'b' => 1, 'c' => 1, 'd' => 1]));
    }

    public function test_earlier_versions_can_be_restored(): void
    {
        $project = Project::factory()->create();
        $original = $project->config;
        $first = $project->versions()->sole();
        $project->update(['config' => [...$original, 'theme' => 'modern']]);

        $this->post("/projects/{$project->slug}/history/{$first->id}/restore")->assertSessionHas('success');

        $this->assertSame($original, $project->fresh()->config);
        $this->assertStringStartsWith('Restored the version from', $project->versions()->latest('id')->first()->summary);

        $other = Project::factory()->create();
        $this->post("/projects/{$other->slug}/history/{$first->id}/restore")->assertNotFound();
    }

    public function test_history_is_capped(): void
    {
        $project = Project::factory()->create();

        foreach (range(1, ProjectVersion::KEEP + 5) as $index) {
            $project->update(['config' => [...$project->config, 'hero' => ['title' => "Title {$index}"]]]);
        }

        $this->assertSame(ProjectVersion::KEEP, $project->versions()->count());
    }

    public function test_projects_can_be_duplicated_and_used_as_templates(): void
    {
        $project = Project::factory()->create();

        $this->post("/projects/{$project->slug}/duplicate")->assertRedirect();
        $copy = Project::query()->latest('id')->first();
        $this->assertSame("{$project->name} (copy)", $copy->name);
        $this->assertSame($project->config['stats'], $copy->config['stats']);

        $this->post("/projects/{$project->slug}/template");
        $this->assertTrue($project->fresh()->is_template);

        $this->get('/projects/create')->assertInertia(fn (Assert $page) => $page->where('templates.0.slug', $project->slug));

        $this->post('/projects', ['name' => 'Valley School', 'target' => 'nextjs', 'theme' => 'classic', 'start_with' => "template:{$project->slug}"])->assertRedirect();
        $created = Project::query()->latest('id')->first();
        $this->assertSame('Valley School', $created->config['school']['name']);
        $this->assertSame($project->config['stats'], $created->config['stats']);

        $copySlug = $copy->slug;
        $this->post('/projects', ['name' => 'X', 'target' => 'nextjs', 'theme' => 'classic', 'start_with' => "template:{$copySlug}"])->assertSessionHasErrors('start_with');
    }

    public function test_quality_checks(): void
    {
        $checks = collect(ProjectChecks::run([
            'school' => ['name' => 'School', 'contact' => []],
            'hero' => ['title' => 'Hi', 'primaryCta' => ['label' => 'Go', 'href' => '/missing']],
            'events' => [['title' => 'Old', 'date' => '2020-01-01']],
            'admissions' => ['open' => true, 'deadline' => '2020-01-01'],
            'languages' => ['en', 'ne'],
        ], ['pages' => [['slug' => '/']]]))->pluck('message');

        $this->assertTrue($checks->contains(fn (string $message): bool => str_contains($message, 'phone number or email')));
        $this->assertTrue($checks->contains('A link points to /missing, but the site has no page there.'));
        $this->assertTrue($checks->contains(fn (string $message): bool => str_contains($message, '1 event already happened')));
        $this->assertTrue($checks->contains('Admissions are marked open but the deadline has passed.'));
        $this->assertTrue($checks->contains(fn (string $message): bool => str_starts_with($message, 'NE version: hero and admissions')));

        $project = Project::factory()->create();
        $this->get("/projects/{$project->slug}/generate")->assertInertia(fn (Assert $page) => $page->has('checks'));
    }
}
