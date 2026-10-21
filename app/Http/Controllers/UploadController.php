<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUploadRequest;
use App\Support\MediaUpload;
use App\Support\ProjectAssets;
use Illuminate\Http\JsonResponse;

class UploadController extends Controller
{
    /**
     * Store an image (as responsive WebP) or document for use in a project.
     * Generation copies it into the project's codebase.
     */
    public function __invoke(StoreUploadRequest $request): JsonResponse
    {
        return response()->json(['url' => MediaUpload::store($request->file('file'), ProjectAssets::DIRECTORY.'/'.now()->format('Y/m'))], 201);
    }
}
