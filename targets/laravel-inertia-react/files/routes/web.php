<?php

use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\SchoolPageController;
use Illuminate\Support\Facades\Route;

Route::post('/contact', ContactMessageController::class)
    ->middleware('throttle:6,1')
    ->name('school.contact');

Route::get('/{path?}', SchoolPageController::class)
    ->where('path', '^(?!up$|build/|storage/)[a-z0-9\-/]*$')
    ->name('school.page');
