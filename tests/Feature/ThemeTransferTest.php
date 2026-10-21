<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Tests\Concerns\UsesTemporaryGenerator;
use Tests\TestCase;

class ThemeTransferTest extends TestCase
{
    use RefreshDatabase, UsesTemporaryGenerator;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->actingAs(User::factory()->create());
    }

    private function upload(array $bundle): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('theme.json', json_encode($bundle));
    }

    public function test_themes_round_trip_through_a_file(): void
    {
        $directory = "{$this->generatorPath}/registry/themes/playful";
        File::ensureDirectoryExists("{$directory}/components/hero");
        File::put("{$directory}/components/hero/index.tsx", 'export default function Hero() { return null; }');

        $bundle = json_decode($this->get('/themes/playful/export')->assertOk()->streamedContent(), true);

        $this->assertSame('schoolforge-theme', $bundle['format']);
        $this->assertSame('playful', $bundle['name']);
        $this->assertArrayHasKey('tokens', $bundle['theme']);
        $this->assertNotSame('', $bundle['extraCss']);
        $this->assertArrayHasKey('hero/index.tsx', $bundle['components']);

        $this->post('/themes/import', ['file' => $this->upload($bundle), 'name' => 'playful-copy'])->assertRedirect('/themes/playful-copy/edit');

        $imported = "{$this->generatorPath}/registry/themes/playful-copy";
        $this->assertSame($bundle['theme']['tokens'], json_decode(File::get("{$imported}/theme.json"), true)['tokens']);
        $this->assertSame($bundle['extraCss'], File::get("{$imported}/extra.css"));
        $this->assertFileExists("{$imported}/components/hero/index.tsx");
        $this->get('/themes/playful-copy/edit')->assertOk();
    }

    public function test_bad_theme_files_are_rejected(): void
    {
        $theme = ['label' => 'X', 'tokens' => []];

        $this->post('/themes/import', ['file' => $this->upload(['hello' => 'world'])])->assertSessionHasErrors('file');
        $this->post('/themes/import', ['file' => $this->upload(['format' => 'schoolforge-theme', 'name' => 'classic', 'theme' => $theme])])
            ->assertSessionHasErrors(['file' => 'A theme called “classic” already exists. Choose another name for the imported theme.']);
        $this->post('/themes/import', ['file' => $this->upload(['format' => 'schoolforge-theme', 'name' => 'x', 'theme' => [...$theme, 'extends' => 'missing']])])
            ->assertSessionHasErrors('file');
        $this->post('/themes/import', ['file' => $this->upload(['format' => 'schoolforge-theme', 'name' => 'evil', 'theme' => $theme, 'components' => ['../../../app/x.php' => '<?php']])])
            ->assertSessionHasErrors('file');

        $this->assertDirectoryDoesNotExist("{$this->generatorPath}/registry/themes/evil");
        $this->assertDirectoryDoesNotExist("{$this->generatorPath}/registry/themes/x");
    }
}
