<?php

use App\Http\Controllers\Admin\AlertController;
use App\Http\Controllers\Admin\ContactMessageController as AdminContactMessageController;
use App\Http\Controllers\Admin\ContentController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FormSubmissionController as AdminFormSubmissionController;
use App\Http\Controllers\Admin\MediaController;
use App\Http\Controllers\Admin\PasswordResetController;
use App\Http\Controllers\Admin\SecurityController;
use App\Http\Controllers\Admin\SessionController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\Admin\WebsiteController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\FormSubmissionController;
use App\Http\Controllers\SchoolPageController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\SubscriberController;
use App\Support\SiteHealth;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->name('admin.')->group(function (): void {
    Route::middleware('guest')->group(function (): void {
        Route::get('login', [SessionController::class, 'create'])->name('login');
        Route::post('login', [SessionController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
        Route::get('two-factor', [SessionController::class, 'twoFactor'])->name('two-factor');
        Route::post('two-factor', [SessionController::class, 'confirmTwoFactor'])->middleware('throttle:5,1')->name('two-factor.store');
        Route::get('forgot-password', [PasswordResetController::class, 'create'])->name('password.request');
        Route::post('forgot-password', [PasswordResetController::class, 'store'])->middleware('throttle:5,1')->name('password.email');
        Route::get('reset-password/{token}', [PasswordResetController::class, 'edit'])->name('password.reset');
        Route::post('reset-password', [PasswordResetController::class, 'update'])->middleware('throttle:5,1')->name('password.update');
    });

    Route::middleware('auth')->group(function (): void {
        Route::get('/', DashboardController::class)->name('dashboard');
        Route::post('logout', [SessionController::class, 'destroy'])->name('logout');

        Route::get('content/{key}', [ContentController::class, 'edit'])->name('content.edit');
        Route::put('content/{key}', [ContentController::class, 'update'])->name('content.update');
        Route::delete('content/{key}', [ContentController::class, 'destroy'])->name('content.destroy');

        Route::post('uploads', UploadController::class)->middleware('throttle:60,1')->name('uploads.store');
        Route::get('media', MediaController::class)->name('media.index');

        Route::get('messages', [AdminContactMessageController::class, 'index'])->name('messages.index');
        Route::get('messages/export.csv', [AdminContactMessageController::class, 'export'])->name('messages.export');
        Route::post('messages/{message}/reply', [AdminContactMessageController::class, 'reply'])->middleware('throttle:30,1')->name('messages.reply');

        Route::get('website', [WebsiteController::class, 'edit'])->name('website.edit');
        Route::put('website/pages', [WebsiteController::class, 'updatePages'])->name('website.pages');
        Route::delete('website/pages', [WebsiteController::class, 'resetPages'])->name('website.pages.reset');
        Route::put('website/design', [WebsiteController::class, 'updateDesign'])->name('website.design');
        Route::patch('messages/{message}', [AdminContactMessageController::class, 'update'])->name('messages.update');
        Route::delete('messages/{message}', [AdminContactMessageController::class, 'destroy'])->name('messages.destroy');

        Route::get('account', [SecurityController::class, 'show'])->name('security.show');
        Route::put('account/password', [SecurityController::class, 'updatePassword'])->name('security.password');
        Route::post('account/two-factor', [SecurityController::class, 'enable'])->name('security.two-factor.enable');
        Route::post('account/two-factor/confirm', [SecurityController::class, 'confirm'])->name('security.two-factor.confirm');
        Route::post('account/two-factor/recovery-codes', [SecurityController::class, 'regenerateCodes'])->name('security.two-factor.codes');
        Route::delete('account/two-factor', [SecurityController::class, 'disable'])->name('security.two-factor.disable');

        Route::middleware('can:manage-school')->group(function (): void {
            Route::get('staff', [StaffController::class, 'index'])->name('staff.index');
            Route::post('staff', [StaffController::class, 'store'])->middleware('throttle:10,1')->name('staff.store');
            Route::patch('staff/{user}', [StaffController::class, 'update'])->name('staff.update');
            Route::delete('staff/{user}', [StaffController::class, 'destroy'])->name('staff.destroy');

            Route::get('alerts', [AlertController::class, 'index'])->name('alerts.index');
            Route::post('alerts', [AlertController::class, 'store'])->middleware('throttle:10,1')->name('alerts.store');
            Route::get('alerts/subscribers.csv', [AlertController::class, 'export'])->name('alerts.export');
        });

        Route::get('submissions', [AdminFormSubmissionController::class, 'index'])->name('submissions.index');
        Route::get('submissions/{submission}', [AdminFormSubmissionController::class, 'show'])->name('submissions.show');
        Route::patch('submissions/{submission}', [AdminFormSubmissionController::class, 'update'])->name('submissions.update');
        Route::delete('submissions/{submission}', [AdminFormSubmissionController::class, 'destroy'])->name('submissions.destroy');
        Route::get('submissions/{submission}/files/{field}', [AdminFormSubmissionController::class, 'file'])->name('submissions.file');
    });
});

Route::get('health', fn () => response()->json($health = SiteHealth::run(), $health['status'] === 'failing' ? 503 : 200))->middleware('throttle:30,1')->name('school.health');
Route::get('sitemap.xml', [SeoController::class, 'sitemap'])->name('school.sitemap');
Route::get('robots.txt', [SeoController::class, 'robots'])->name('school.robots');
Route::get('events.ics', [SeoController::class, 'calendar'])->name('school.calendar');

Route::post('subscribe', [SubscriberController::class, 'store'])->middleware('throttle:10,1')->name('school.subscribe');
Route::get('unsubscribe/{token}', [SubscriberController::class, 'destroy'])->name('school.unsubscribe');
Route::get('forms/status', [FormSubmissionController::class, 'status'])->middleware('throttle:20,1')->name('school.forms.status');
Route::post('forms/{type}', [FormSubmissionController::class, 'store'])->middleware('throttle:10,1')->name('school.forms.store');

Route::post('/contact', ContactMessageController::class)
    ->middleware('throttle:6,1')
    ->name('school.contact');

Route::get('/{path?}', SchoolPageController::class)
    ->where('path', '^(?!up$|build/|storage/|admin(/|$))[a-z0-9\-/]*$')
    ->name('school.page');
