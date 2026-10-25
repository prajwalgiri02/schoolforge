<?php

namespace Tests\Unit;

use App\Support\ProcessEnvironment;
use PHPUnit\Framework\TestCase;

class ProcessEnvironmentTest extends TestCase
{
    public function test_windows_child_processes_get_the_whole_environment(): void
    {
        putenv('SCHOOLFORGE_PROCESS_TEST=1');

        try {
            $this->assertSame('1', ProcessEnvironment::variables('Windows')['SCHOOLFORGE_PROCESS_TEST'] ?? null);
            $this->assertSame(getenv(), ProcessEnvironment::variables('Windows'));
        } finally {
            putenv('SCHOOLFORGE_PROCESS_TEST');
        }
    }

    public function test_other_systems_keep_the_default_environment(): void
    {
        $this->assertSame([], ProcessEnvironment::variables('Linux'));
    }
}
