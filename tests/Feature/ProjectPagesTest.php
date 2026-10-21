<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
    }

    public function test_default_pages_come_from_the_generator(): void
    {
        $project = Project::factory()->example()->create();

        $this->get("/projects/{$project->slug}/pages")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Projects/Pages')
                ->where('isCustom', false)
                ->where('pages.0.slug', '/')
                ->where('pages', fn ($pages) => collect($pages)->doesntContain(fn ($item) => str_starts_with($item['slug'], '/news/'))
                    && collect($pages)->firstWhere('slug', '/academics')['sections'][1]['variant'] === 'list')
                ->where('components', fn ($components) => collect($components)->doesntContain('name', 'navbar') && collect($components)->contains('name', 'rich-text')));
    }

    public function test_custom_pages_are_saved_and_cleaned(): void
    {
        $project = Project::factory()->create();

        $this->put("/projects/{$project->slug}/pages", ['pages' => [
            ['slug' => '/', 'title' => 'Home', 'navLabel' => '', 'sections' => [['type' => 'hero', 'variant' => 'split', 'title' => ''], ['type' => 'stats']]],
            ['slug' => '/sports', 'title' => 'Sports', 'showInNav' => false, 'sections' => [['type' => 'rich-text', 'title' => 'Houses', 'paragraphs' => ['Red and blue.']]]],
        ]])->assertSessionHasNoErrors();

        $this->assertSame([
            ['slug' => '/', 'title' => 'Home', 'showInNav' => true, 'sections' => [['type' => 'hero', 'variant' => 'split'], ['type' => 'stats']]],
            ['slug' => '/sports', 'title' => 'Sports', 'showInNav' => false, 'sections' => [['type' => 'rich-text', 'title' => 'Houses', 'paragraphs' => ['Red and blue.']]]],
        ], $project->fresh()->config['pages']);

        $this->get("/projects/{$project->slug}/pages")->assertInertia(fn (Assert $page) => $page->where('isCustom', true)->has('pages', 2));
    }

    public function test_pages_are_validated(): void
    {
        $project = Project::factory()->create();

        $this->put("/projects/{$project->slug}/pages", ['pages' => [
            ['slug' => '/About Us', 'title' => '', 'sections' => [['type' => 'unicorn']]],
            ['slug' => '/About Us', 'title' => 'Again', 'sections' => []],
        ]])->assertSessionHasErrors(['pages.0.slug', 'pages.0.title', 'pages.0.sections.0.type', 'pages.1.slug']);

        $this->put("/projects/{$project->slug}/pages", ['pages' => [['slug' => '/about', 'title' => 'About', 'sections' => []]]])
            ->assertSessionHasErrors('pages');

        $this->put("/projects/{$project->slug}/pages", ['pages' => [['slug' => '/', 'title' => 'Home', 'sections' => [['type' => 'hero', 'variant' => 'sideways']]]]])
            ->assertSessionHasErrors('pages.0.sections.0.variant');

        $this->assertArrayNotHasKey('pages', $project->fresh()->config);
    }

    public function test_pages_can_be_reset_to_defaults(): void
    {
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'pages' => [['slug' => '/', 'title' => 'Home', 'sections' => []]]]]);

        $this->delete("/projects/{$project->slug}/pages")->assertSessionHas('success');

        $this->assertArrayNotHasKey('pages', $project->fresh()->config);
    }

    public function test_component_settings_are_offered_and_saved(): void
    {
        $project = Project::factory()->create();

        $this->get("/projects/{$project->slug}/pages")->assertInertia(fn (Assert $page) => $page
            ->where('components', fn ($components): bool => collect(collect($components)->firstWhere('name', 'events')['props'])->contains('name', 'subscribe')));

        $this->put("/projects/{$project->slug}/pages", ['pages' => [
            ['slug' => '/', 'title' => 'Home', 'sections' => [
                ['type' => 'events', 'subscribe' => false],
                ['type' => 'about', 'mode' => 'full', 'link' => false],
                ['type' => 'cta', 'primary' => ['label' => 'Apply', 'href' => '/admissions']],
            ]],
        ]])->assertSessionHasNoErrors();

        $sections = $project->fresh()->config['pages'][0]['sections'];
        $this->assertFalse($sections[0]['subscribe']);
        $this->assertFalse($sections[1]['link']);
        $this->assertSame(['label' => 'Apply', 'href' => '/admissions'], $sections[2]['primary']);
    }

    public function test_retired_sections_are_taken_out_of_saved_site_maps(): void
    {
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'pages' => [
            ['slug' => '/', 'title' => 'Home', 'sections' => [['type' => 'hero'], ['type' => 'result-lookup']]],
            ['slug' => '/pay-fees', 'title' => 'Pay Fees', 'sections' => [['type' => 'page-header'], ['type' => 'fee-payment']]],
            ['slug' => '/about', 'title' => 'About', 'sections' => [['type' => 'page-header'], ['type' => 'about']]],
        ]]]);
        $untouched = Project::factory()->create();

        (require database_path('migrations/2026_10_21_140527_remove_retired_sections_from_projects.php'))->up();

        $pages = $project->fresh()->config['pages'];
        $this->assertSame(['/', '/about'], array_column($pages, 'slug'));
        $this->assertSame([['type' => 'hero']], $pages[0]['sections']);
        $this->assertSame($untouched->config, $untouched->fresh()->config);
    }
}
