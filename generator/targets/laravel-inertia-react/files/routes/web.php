<?php

use App\Http\Controllers\Admin\ContactMessageController as AdminContactMessageController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\SessionController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\SchoolPageController;
use App\Http\Controllers\SeoController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::middleware('guest')->group(function (): void {
        Route::get('login', [SessionController::class, 'create'])->name('login');
        Route::post('login', [SessionController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
    });

    Route::middleware('auth')->group(function (): void {
        Route::get('/', DashboardController::class)->name('dashboard');
        Route::post('logout', [SessionController::class, 'destroy'])->name('logout');

        Route::get('content/{key}', [ContentController::class, 'edit'])->name('content.edit');
        Route::put('content/{key}', [ContentController::class, 'update'])->name('content.update');
        Route::delete('content/{key}', [ContentController::class, 'destroy'])->name('content.destroy');

        Route::post('uploads', UploadController::class)->middleware('throttle:60,1')->name('uploads.store');

        Route::get('messages', [AdminContactMessageController::class, 'index'])->name('messages.index');
        Route::patch('messages/{message}', [AdminContactMessageController::class, 'update'])->name('messages.update');
        Route::delete('messages/{message}', [AdminContactMessageController::class, 'destroy'])->name('messages.destroy');
    });
});

Route::get('sitemap.xml', [SeoController::class, 'sitemap'])->name('school.sitemap');
Route::get('robots.txt', [SeoController::class, 'robots'])->name('school.robots');
Route::get('events.ics', [SeoController::class, 'calendar'])->name('school.calendar');

Route::post('/contact', ContactMessageController::class)
    ->middleware('throttle:6,1')
    ->name('school.contact');

Route::get('/{path?}', SchoolPageController::class)
    ->where('path', '^(?!up$|build/|storage/|admin(/|$))[a-z0-9\-/]*$')
    ->name('school.page');
