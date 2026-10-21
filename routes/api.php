<?php

use App\Http\Controllers\ContentApiController;
use Illuminate\Support\Facades\Route;

Route::get('sites/{project}/content', ContentApiController::class)->middleware('throttle:120,1')->name('api.content');
