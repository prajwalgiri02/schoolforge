<?php

namespace App\Support;

/**
 * Environment for Node and git child processes. On Windows, Laravel's .env values
 * make Symfony Process pass only those variables when Studio runs under PHP's
 * built-in server (`php artisan serve`), and Node cannot start without SystemRoot.
 */
class ProcessEnvironment
{
    /**
     * @return array<string, string>
     */
    public static function variables(string $os = PHP_OS_FAMILY): array
    {
        return $os === 'Windows' ? getenv() : [];
    }
}
