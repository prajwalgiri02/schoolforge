<?php

namespace App\Support;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

/**
 * Renders Inertia pages to HTML with Studio's server bundle
 * (bootstrap/ssr/ssr.js, built by `npm run build`).
 */
class PagePrerenderer
{
    /**
     * @param  list<array<string, mixed>>  $pages  Inertia page objects.
     * @return list<string>|null The HTML of each page, or null when they could not be rendered.
     */
    public static function render(array $pages): ?array
    {
        $bundle = config('studio.ssr_bundle');

        if ($pages === [] || ! File::exists($bundle)) {
            return null;
        }

        $result = Process::timeout(180)
            ->env(ProcessEnvironment::variables())
            ->input(json_encode($pages, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE))
            ->run([config('studio.node_binary'), $bundle]);

        $html = $result->successful() ? json_decode($result->output(), true) : null;

        if (! is_array($html) || count($html) !== count($pages)) {
            Log::warning('Published pages could not be pre-rendered; they will render in the browser.', ['error' => $result->errorOutput()]);

            return null;
        }

        return $html;
    }
}
