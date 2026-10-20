<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Concerns\UsesTemporaryGenerator;
use Tests\TestCase;

class ThemeManagementTest extends TestCase
{
    use RefreshDatabase, UsesTemporaryGenerator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
    }

    private function themeJson(string $name): array
    {
        return json_decode(File::get("{$this->generatorPath}/registry/themes/{$name}/theme.json"), true);
    }

    public function test_themes_are_listed_with_usage(): void
    {
        Project::factory()->count(2)->create();

        $this->get('/themes')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Themes/Index')
                ->has('themes', 4)
                ->where('themes', fn ($themes) => collect($themes)->firstWhere('name', 'classic')['projects'] === 2));
    }

    public function test_new_theme_extends_an_existing_one(): void
    {
        $this->post('/themes', ['name' => 'royal-blue', 'from' => 'modern', 'label' => 'Royal Blue'])->assertRedirect('/themes/royal-blue/edit');

        $theme = $this->themeJson('royal-blue');
        $this->assertSame('modern', $theme['extends']);
        $this->assertSame('Royal Blue', $theme['label']);

        $this->get('/themes/royal-blue/edit')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Themes/Edit')
                ->where('theme.extends', 'modern')
                ->where('resolved.fonts.heading.family', 'Plus Jakarta Sans'));
    }

    public function test_theme_names_are_validated(): void
    {
        $this->post('/themes', ['name' => 'Bad Name', 'from' => 'nope'])->assertSessionHasErrors(['name', 'from']);
        $this->post('/themes', ['name' => 'classic', 'from' => 'modern'])->assertSessionHasErrors('name');
    }

    public function test_theme_tokens_and_css_are_saved(): void
    {
        $this->post('/themes', ['name' => 'sunrise', 'from' => 'classic']);

        $this->put('/themes/sunrise', [
            'label' => 'Sunrise',
            'description' => 'Warm and bright.',
            'colors' => ['primary' => '#ea580c', 'secondary' => ''],
            'fonts' => ['heading' => 'Lora', 'body' => ''],
            'radius' => ['card' => '1rem', 'button' => ''],
            'heading_weight' => '800',
            'variants' => ['hero' => 'centered', 'stats' => ''],
            'extra_css' => '.theme-sunrise .school-card { border-width: 2px; }',
        ])->assertSessionHasNoErrors();

        $theme = $this->themeJson('sunrise');
        $this->assertSame('classic', $theme['extends']);
        $this->assertSame(['primary' => '#ea580c'], $theme['tokens']['colors']);
        $this->assertSame('Lora', $theme['tokens']['fonts']['heading']['family']);
        $this->assertArrayNotHasKey('body', $theme['tokens']['fonts']);
        $this->assertSame(['card' => '1rem'], $theme['tokens']['radius']);
        $this->assertSame(800, $theme['tokens']['heading']['weight']);
        $this->assertSame(['hero' => 'centered'], $theme['variants']);
        $this->assertStringContainsString('border-width: 2px', File::get("{$this->generatorPath}/registry/themes/sunrise/extra.css"));

        $this->get('/themes/sunrise/edit')->assertInertia(fn (Assert $page) => $page->where('resolved.colors.primary', '#ea580c')->where('resolved.colors.accent', '#c9a227'));
    }

    public function test_base_themes_must_keep_every_colour(): void
    {
        $this->put('/themes/classic', ['label' => 'Classic', 'colors' => ['primary' => '#000000'], 'fonts' => ['heading' => 'Lora', 'body' => 'Inter']])
            ->assertSessionHasErrors(['colors.secondary', 'colors.border']);
    }

    public function test_theme_updates_are_validated(): void
    {
        $this->post('/themes', ['name' => 'oops', 'from' => 'classic']);

        $this->put('/themes/oops', ['label' => '', 'colors' => ['primary' => 'red'], 'radius' => ['card' => '10 parsecs'], 'heading_weight' => '450', 'variants' => ['hero' => 'sideways']])
            ->assertSessionHasErrors(['label', 'colors.primary', 'radius.card', 'heading_weight', 'variants.hero']);
    }

    public function test_unknown_themes_return_not_found(): void
    {
        $this->get('/themes/../../etc/edit')->assertNotFound();
        $this->get('/themes/missing/edit')->assertNotFound();
        $this->put('/themes/missing', ['label' => 'x'])->assertNotFound();
    }
}
