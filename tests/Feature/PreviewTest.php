<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PreviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
    }

    public function test_preview_renders_site_data_and_theme_tokens(): void
    {
        $project = Project::factory()->example()->create();
        $project->update(['config' => [...$project->config, 'theme' => 'modern', 'colors' => ['primary' => '#7f1d1d']]]);

        $this->get("/preview/{$project->slug}/about")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Preview')
                ->where('base', "/preview/{$project->slug}")
                ->where('slug', '/about')
                ->where('site.theme.name', 'modern')
                ->where('tokens.cssVariables.--color-primary', '#7f1d1d')
                ->has('site.pages'));
    }

    public function test_the_events_calendar_feed_can_be_previewed(): void
    {
        $project = Project::factory()->example()->create();

        $this->get("/preview/{$project->slug}/events.ics")
            ->assertOk()
            ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
            ->assertSee('SUMMARY:Winter Concert', false);
    }

    public function test_article_pages_can_be_previewed(): void
    {
        $project = Project::factory()->example()->create();

        $this->get("/preview/{$project->slug}/news/new-robotics-and-innovation-lab-opens")->assertOk();
    }

    public function test_unknown_pages_return_not_found(): void
    {
        $project = Project::factory()->create();

        $this->get("/preview/{$project->slug}/faculty")->assertNotFound();
    }

    public function test_invalid_config_shows_problems(): void
    {
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'events' => [['title' => 'Bad date', 'date' => 'soon']]]]);

        $this->get("/preview/{$project->slug}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Preview')->missing('site')->where('problems.0', 'events[0].date must use YYYY-MM-DD (got "soon").'));
    }
}
