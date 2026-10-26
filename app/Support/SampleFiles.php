<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Mime\MimeTypes;

/**
 * The example school's downloads (generator/examples/files). Generated sites
 * ship them in public/files; Studio serves them at the same /files/<name>
 * address for previews and hosted schools.
 */
class SampleFiles
{
    public static function path(string $name): ?string
    {
        if (preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $name) !== 1) {
            return null;
        }

        $path = config('studio.generator_path')."/examples/files/{$name}";

        return is_file($path) ? $path : null;
    }

    public static function response(string $path): BinaryFileResponse
    {
        $type = MimeTypes::getDefault()->getMimeTypes(pathinfo($path, PATHINFO_EXTENSION))[0] ?? 'application/octet-stream';

        return response()->file($path, ['Content-Type' => $type]);
    }
}
