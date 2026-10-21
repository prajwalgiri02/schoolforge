<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\UsesTemporaryGenerator;
use Tests\TestCase;

class ComponentManagementTest extends TestCase
{
    use RefreshDatabase, UsesTemporaryGenerator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
        config(['studio.code_editing' => true]);
    }

    private function componentPath(string $name, string $file): string
    {
        return "{$this->generatorPath}/registry/components/{$name}/{$file}";
    }

    public function test_components_are_listed(): void
    {
        $project = Project::factory()->create();
        $project->update(['config' => [...$project->config, 'pages' => [['slug' => '/', 'title' => 'Home', 'sections' => [['type' => 'faq']]]]]]);

        $this->get('/components')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Components/Index')
                ->has('components', 38)
                ->where('components', fn ($components) => collect($components)->firstWhere('name', 'faq')['customPages'] === 1));
    }

    public function test_new_component_is_scaffolded(): void
    {
        $this->post('/components', ['name' => 'sports-highlights', 'label' => 'Sports Highlights', 'variants' => 'grid, list'])
            ->assertRedirect('/components/sports-highlights/edit');

        $manifest = json_decode(File::get($this->componentPath('sports-highlights', 'component.json')), true);
        $this->assertSame(['grid', 'list'], $manifest['variants']);
        $this->assertStringContainsString('export default function SportsHighlights', File::get($this->componentPath('sports-highlights', 'index.tsx')));

        $this->get('/components/sports-highlights/edit')->assertOk()->assertInertia(fn (Assert $page) => $page->where('component.label', 'Sports Highlights'));
    }

    public function test_component_creation_is_validated(): void
    {
        $this->post('/components', ['name' => 'hero', 'variants' => 'Bad Variant!'])->assertSessionHasErrors(['name', 'variants']);
        $this->post('/components', ['name' => '../escape'])->assertSessionHasErrors('name');
    }

    public function test_manifest_and_code_are_saved(): void
    {
        $this->put('/components/faq', [
            'label' => 'Questions',
            'description' => 'Common questions.',
            'variants' => 'accordion, two-column',
            'code' => "export default function Faq() { return null; }\n",
        ])->assertSessionHasNoErrors();

        $manifest = json_decode(File::get($this->componentPath('faq', 'component.json')), true);
        $this->assertSame('Questions', $manifest['label']);
        $this->assertSame(['accordion', 'two-column'], $manifest['variants']);
        $this->assertSame(['content.faqs'], $manifest['requires'], 'other manifest keys are kept');
        $this->assertSame("export default function Faq() { return null; }\n", File::get($this->componentPath('faq', 'index.tsx')));
    }

    public function test_code_is_read_only_when_editing_is_disabled(): void
    {
        config(['studio.code_editing' => false]);
        $original = File::get($this->componentPath('faq', 'index.tsx'));

        $this->get('/components/faq/edit')->assertInertia(fn (Assert $page) => $page->where('canEditCode', false)->where('code', $original));

        $this->put('/components/faq', ['label' => 'FAQ', 'variants' => 'accordion', 'code' => 'hacked'])->assertSessionHasNoErrors();

        $this->assertSame($original, File::get($this->componentPath('faq', 'index.tsx')));
    }

    public function test_unknown_components_return_not_found(): void
    {
        $this->get('/components/missing/edit')->assertNotFound();
        $this->put('/components/missing', ['label' => 'x', 'variants' => 'a'])->assertNotFound();
    }
}
