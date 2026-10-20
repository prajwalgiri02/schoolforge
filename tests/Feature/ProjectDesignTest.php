<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectDesignTest extends TestCase
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

    public function test_design_page_shows_themes_and_layouts(): void
    {
        $this->get("/projects/{$this->project->slug}/design")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Design')
                ->has('themes', 4)
                ->where('design.theme', 'classic')
                ->where('themeDetails.modern.variants.hero', 'split')
                ->where('components', fn ($components) => collect($components)->contains('name', 'hero')));
    }

    public function test_design_choices_are_saved_to_the_config(): void
    {
        $this->put("/projects/{$this->project->slug}/design", [
            'theme' => 'playful',
            'colors' => ['primary' => '#7f1d1d', 'accent' => ''],
            'fonts' => ['heading' => 'Merriweather', 'body' => ''],
            'variants' => ['hero' => 'split', 'stats' => ''],
        ])->assertSessionHasNoErrors();

        $config = $this->project->fresh()->config;
        $this->assertSame('playful', $config['theme']);
        $this->assertSame(['primary' => '#7f1d1d'], $config['colors']);
        $this->assertSame(['heading' => 'Merriweather'], $config['fonts']);
        $this->assertSame(['hero' => 'split'], $config['variants']);
    }

    public function test_clearing_overrides_removes_them(): void
    {
        $this->project->update(['config' => [...$this->project->config, 'colors' => ['primary' => '#000000'], 'variants' => ['hero' => 'split']]]);

        $this->put("/projects/{$this->project->slug}/design", ['theme' => 'classic', 'colors' => ['primary' => ''], 'variants' => []]);

        $config = $this->project->fresh()->config;
        $this->assertArrayNotHasKey('colors', $config);
        $this->assertArrayNotHasKey('variants', $config);
    }

    public function test_design_is_validated(): void
    {
        $this->put("/projects/{$this->project->slug}/design", [
            'theme' => 'missing',
            'colors' => ['primary' => 'blue', 'sparkle' => '#ffffff'],
            'fonts' => ['heading' => '<script>'],
            'variants' => ['hero' => 'sideways'],
        ])->assertSessionHasErrors(['theme', 'colors', 'colors.primary', 'fonts.heading']);

        $this->put("/projects/{$this->project->slug}/design", ['theme' => 'classic', 'variants' => ['hero' => 'sideways']])
            ->assertSessionHasErrors('variants.hero');
    }
}
