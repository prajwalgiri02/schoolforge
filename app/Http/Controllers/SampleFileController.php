<?php

namespace App\Http\Controllers;

use App\Support\SampleFiles;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SampleFileController extends Controller
{
    public function __invoke(string $file): BinaryFileResponse
    {
        $path = SampleFiles::path($file);
        abort_if($path === null, 404);

        return SampleFiles::response($path);
    }
}
