<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    private string $backups;

    protected function setUp(): void
    {
        parent::setUp();

        $this->backups = storage_path('app/private/backups');
        File::deleteDirectory($this->backups);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->backups);
        File::delete(storage_path('app/public/backup-test.txt'));

        parent::tearDown();
    }

    public function test_backup_and_restore_round_trip(): void
    {
        SiteContent::factory()->create(['key' => 'hero', 'value' => ['title' => 'Backed up headline']]);
        ContactMessage::factory()->count(3)->create();
        User::factory()->create(['email' => 'office@example.com']);
        File::put(storage_path('app/public/backup-test.txt'), 'uploaded file');

        $this->artisan('school:backup')->assertSuccessful();

        $backup = File::glob("{$this->backups}/school-backup-*.zip")[0];
        $this->assertFileExists($backup);

        SiteContent::query()->delete();
        ContactMessage::query()->delete();
        User::query()->delete();
        File::delete(storage_path('app/public/backup-test.txt'));

        $this->artisan('school:backup', ['--restore' => $backup, '--force' => true])->assertSuccessful();

        $this->assertSame('Backed up headline', SiteContent::query()->sole()->value['title']);
        $this->assertSame(3, ContactMessage::query()->count());
        $this->assertTrue(User::query()->where('email', 'office@example.com')->exists());
        $this->assertSame('uploaded file', File::get(storage_path('app/public/backup-test.txt')));
    }

    public function test_old_backups_are_pruned(): void
    {
        File::ensureDirectoryExists($this->backups);

        foreach (['20260101-000000', '20260102-000000', '20260103-000000'] as $stamp) {
            File::put("{$this->backups}/school-backup-{$stamp}.zip", 'old');
        }

        $this->artisan('school:backup', ['--keep' => 2])->assertSuccessful();

        $remaining = array_map('basename', File::glob("{$this->backups}/school-backup-*.zip"));
        $this->assertCount(2, $remaining);
        $this->assertNotContains('school-backup-20260101-000000.zip', $remaining);
    }

    public function test_restore_requires_an_existing_file(): void
    {
        $this->artisan('school:backup', ['--restore' => '/nope.zip', '--force' => true])->assertFailed();
    }

    public function test_backup_is_scheduled_nightly(): void
    {
        $this->artisan('schedule:list')->expectsOutputToContain('school:backup')->assertSuccessful();
    }
}
