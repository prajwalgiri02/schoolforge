<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\MediaLibrary;
use Illuminate\Http\JsonResponse;

class MediaController extends Controller
{
    /**
     * Uploaded images and documents, for the "Choose from library" picker.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json(MediaLibrary::list('school'));
    }
}
