<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUploadRequest;
use App\Support\ImageOptimizer;
use App\Support\ProjectAssets;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Store an image (as responsive WebP) for use in a project. Generation copies it
     * into the project's codebase.
     */
    public function __invoke(StoreUploadRequest $request): JsonResponse
    {
        $path = ImageOptimizer::store($request->file('file'), ProjectAssets::DIRECTORY.'/'.now()->format('Y/m'));

        return response()->json([
            'url' => parse_url(Storage::disk('public')->url($path), PHP_URL_PATH),
        ], 201);
    }
}
