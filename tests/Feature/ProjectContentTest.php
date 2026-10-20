<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use App\Support\ContentSchema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectContentTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
        $this->project = Project::factory()->create();
    }

    public function test_content_overview_lists_every_section(): void
    {
        $this->get("/projects/{$this->project->slug}/content")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Content/Index')
                ->has('sections', count(ContentSchema::sections()))
                ->where('sections', fn ($sections) => collect($sections)->firstWhere('key', 'stats')['count'] === 2
                    && collect($sections)->firstWhere('key', 'news')['filled'] === false));
    }

    public function test_editor_reads_config_shaped_content(): void
    {
        $this->get("/projects/{$this->project->slug}/content/faqs")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Content/Edit')
                ->where('section.kind', 'list')
                ->where('value.0.question', 'When does school start?'));

        $this->get("/projects/{$this->project->slug}/content/school")
            ->assertInertia(fn (Assert $page) => $page->where('value.name', $this->project->name));
    }

    public function test_unknown_section_returns_not_found(): void
    {
        $this->get("/projects/{$this->project->slug}/content/unicorns")->assertNotFound();
        $this->put("/projects/{$this->project->slug}/content/unicorns", ['value' => []])->assertNotFound();
    }

    public function test_saving_content_writes_to_the_top_level_config(): void
    {
        $this->put("/projects/{$this->project->slug}/content/hero", ['value' => ['title' => 'Welcome!', 'subtitle' => ' ']])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->put("/projects/{$this->project->slug}/content/principal", ['value' => ['name' => 'Ms. Rana', 'message' => ['Hello families.']]]);

        $config = $this->project->fresh()->config;
        $this->assertSame(['title' => 'Welcome!'], $config['hero']);
        $this->assertSame(['name' => 'Ms. Rana', 'message' => ['Hello families.']], $config['school']['principal']);
        $this->assertArrayNotHasKey('content', $config);
    }

    public function test_renaming_the_school_renames_the_project(): void
    {
        $this->put("/projects/{$this->project->slug}/content/school", ['value' => ['name' => 'Brand New Name']]);

        $this->assertSame('Brand New Name', $this->project->fresh()->name);
        $this->assertSame($this->project->slug, $this->project->fresh()->slug, 'the URL stays stable');
    }

    public function test_emptying_a_list_removes_it(): void
    {
        $this->put("/projects/{$this->project->slug}/content/faqs", ['value' => []])->assertSessionHasNoErrors();

        $this->assertArrayNotHasKey('faqs', $this->project->fresh()->config);
    }

    public function test_content_is_validated(): void
    {
        $this->put("/projects/{$this->project->slug}/content/events", ['value' => [['title' => '', 'date' => 'tomorrow']]])
            ->assertSessionHasErrors(['value.0.title', 'value.0.date']);
    }

    public function test_images_can_be_uploaded(): void
    {
        Storage::fake('public');

        $response = $this->post('/uploads', ['file' => UploadedFile::fake()->image('logo.png')])->assertCreated();

        $this->assertStringStartsWith('/storage/studio/', $response->json('url'));
        $this->assertCount(1, Storage::disk('public')->allFiles('studio'));
    }
}
