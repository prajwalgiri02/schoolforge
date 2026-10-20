<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
    }

    public function test_projects_are_listed_with_theme_colours(): void
    {
        $project = Project::factory()->create();

        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Index')
                ->has('projects', 1)
                ->where('projects.0.slug', $project->slug)
                ->where('projects.0.themeLabel', 'Classic Heritage')
                ->where('projects.0.colors.primary', '#1b365d'));
    }

    public function test_create_page_offers_themes_and_targets(): void
    {
        $this->get('/projects/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Create')
                ->has('themes', 4)
                ->has('targets', 2));
    }

    public function test_school_can_be_created_from_sample_content(): void
    {
        $this->post('/projects', [
            'name' => 'Lakeside Academy',
            'short_name' => 'Lakeside',
            'tagline' => 'Learning by the lake',
            'target' => 'laravel-inertia-react',
            'theme' => 'modern',
            'start_with' => 'sample',
        ])->assertRedirect('/projects/lakeside-academy/content');

        $project = Project::query()->sole();

        $this->assertSame('Lakeside Academy', $project->name);
        $this->assertSame('laravel-inertia-react', $project->config['target']);
        $this->assertSame('modern', $project->config['theme']);
        $this->assertSame('Lakeside', $project->config['school']['shortName']);
        $this->assertSame('Learning by the lake', $project->config['school']['tagline']);
        $this->assertNotEmpty($project->config['programs']);
    }

    public function test_school_can_be_created_blank(): void
    {
        $this->post('/projects', ['name' => 'Hilltop School', 'target' => 'nextjs', 'theme' => 'classic', 'start_with' => 'blank']);

        $this->assertSame(['target' => 'nextjs', 'theme' => 'classic', 'school' => ['name' => 'Hilltop School']], Project::query()->sole()->config);
    }

    public function test_slugs_are_unique(): void
    {
        Project::factory()->create(['config' => ['school' => ['name' => 'Twin School']]]);

        $this->post('/projects', ['name' => 'Twin School', 'target' => 'nextjs', 'theme' => 'classic', 'start_with' => 'blank']);

        $this->assertSame(['twin-school', 'twin-school-2'], Project::query()->orderBy('id')->pluck('slug')->all());
    }

    public function test_creation_is_validated(): void
    {
        $this->post('/projects', ['name' => '', 'target' => 'rails', 'theme' => 'missing', 'start_with' => 'magic'])
            ->assertSessionHasErrors(['name', 'target', 'theme', 'start_with']);

        $this->assertDatabaseCount(Project::class, 0);
    }

    public function test_config_files_can_be_imported(): void
    {
        $file = UploadedFile::fake()->createWithContent('school.config.json', file_get_contents(base_path('generator/examples/school.config.json')));

        $this->post('/projects/import', ['file' => $file])->assertRedirect('/projects/riverside-heights-school/content');

        $project = Project::query()->sole();
        $this->assertArrayNotHasKey('$schema', $project->config);
        $this->assertSame('Riverside Heights School', $project->name);
    }

    public function test_invalid_imports_are_rejected(): void
    {
        $this->post('/projects/import', ['file' => UploadedFile::fake()->createWithContent('bad.json', '{ nope')])
            ->assertSessionHasErrors(['file' => 'This file is not valid JSON.']);

        $this->post('/projects/import', ['file' => UploadedFile::fake()->createWithContent('bad.json', '{"school": {}}')])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount(Project::class, 0);
    }

    public function test_config_can_be_downloaded(): void
    {
        $project = Project::factory()->create();

        $response = $this->get("/projects/{$project->slug}/config.json")->assertOk()->assertDownload("{$project->slug}.school.config.json");

        $this->assertSame($project->config, json_decode($response->streamedContent(), true));
    }

    public function test_project_can_be_deleted(): void
    {
        $project = Project::factory()->create();

        $this->delete("/projects/{$project->slug}")->assertRedirect('/');

        $this->assertModelMissing($project);
    }
}
