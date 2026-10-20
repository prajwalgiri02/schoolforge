<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUploadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    /**
     * Store an uploaded image on the public disk and return its URL. The URL is
     * root-relative so content keeps working if the site moves to another domain.
     */
    public function __invoke(StoreUploadRequest $request): JsonResponse
    {
        $path = $request->file('file')->store('school/'.now()->format('Y/m'), 'public');

        return response()->json([
            'url' => parse_url(Storage::disk('public')->url($path), PHP_URL_PATH),
        ], 201);
    }
}
