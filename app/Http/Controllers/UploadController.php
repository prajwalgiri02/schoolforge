<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUploadRequest;
use App\Support\ProjectAssets;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Store an image for use in a project. Generation copies it into the project's codebase.
     */
    public function __invoke(StoreUploadRequest $request): JsonResponse
    {
        $path = $request->file('file')->store(ProjectAssets::DIRECTORY.'/'.now()->format('Y/m'), 'public');

        return response()->json([
            'url' => parse_url(Storage::disk('public')->url($path), PHP_URL_PATH),
        ], 201);
    }
}
