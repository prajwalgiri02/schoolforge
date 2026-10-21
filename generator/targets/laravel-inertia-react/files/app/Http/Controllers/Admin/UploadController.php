<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUploadRequest;
use App\Support\MediaUpload;
use Illuminate\Http\JsonResponse;

class UploadController extends Controller
{
    /**
     * Store an uploaded image (as responsive WebP) or document on the public disk
     * and return its URL. The URL is root-relative so content keeps working if the
     * site moves to another domain.
     */
    public function __invoke(StoreUploadRequest $request): JsonResponse
    {
        return response()->json(['url' => MediaUpload::store($request->file('file'), 'school/'.now()->format('Y/m'))], 201);
    }
}
