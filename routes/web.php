<?php

use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\ComponentController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PreviewController;
use App\Http\Controllers\ProjectContentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDesignController;
use App\Http\Controllers\ProjectGenerateController;
use App\Http\Controllers\ProjectHistoryController;
use App\Http\Controllers\ProjectPagesController;
use App\Http\Controllers\ProjectPublishController;
use App\Http\Controllers\SiteStatusController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\ThemeTransferController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function (): void {
    Route::get('login', [SessionController::class, 'create'])->name('login');
    Route::post('login', [SessionController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
});

Route::middleware('auth')->group(function (): void {
    Route::post('logout', [SessionController::class, 'destroy'])->name('logout');

    Route::get('/', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store')->can('edit-projects');
    Route::post('projects/import', [ProjectController::class, 'import'])->name('projects.import')->can('edit-projects');
    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy')->can('manage-studio');
    Route::get('projects/{project}/config.json', [ProjectController::class, 'export'])->name('projects.export');

    Route::get('projects/{project}/content', [ProjectContentController::class, 'index'])->name('projects.content.index');
    Route::get('projects/{project}/content/{key}', [ProjectContentController::class, 'edit'])->name('projects.content.edit');
    Route::put('projects/{project}/content/{key}', [ProjectContentController::class, 'update'])->name('projects.content.update')->can('edit-projects');

    Route::get('projects/{project}/design', [ProjectDesignController::class, 'edit'])->name('projects.design.edit');
    Route::put('projects/{project}/design', [ProjectDesignController::class, 'update'])->name('projects.design.update')->can('edit-projects');

    Route::get('projects/{project}/pages', [ProjectPagesController::class, 'edit'])->name('projects.pages.edit');
    Route::put('projects/{project}/pages', [ProjectPagesController::class, 'update'])->name('projects.pages.update')->can('edit-projects');
    Route::delete('projects/{project}/pages', [ProjectPagesController::class, 'destroy'])->name('projects.pages.destroy')->can('edit-projects');

    Route::get('projects/{project}/history', [ProjectHistoryController::class, 'index'])->name('projects.history.index');
    Route::post('projects/{project}/history/{version}/restore', [ProjectHistoryController::class, 'restore'])->name('projects.history.restore')->can('edit-projects');
    Route::post('projects/{project}/duplicate', [ProjectHistoryController::class, 'duplicate'])->name('projects.duplicate')->can('edit-projects');
    Route::post('projects/{project}/template', [ProjectHistoryController::class, 'template'])->name('projects.template')->can('edit-projects');
    Route::get('projects/{project}/generate', [ProjectGenerateController::class, 'show'])->name('projects.generate.show');
    Route::post('projects/{project}/generate', [ProjectGenerateController::class, 'store'])->name('projects.generate.store')->can('edit-projects');

    Route::get('projects/{project}/publish', [ProjectPublishController::class, 'show'])->name('projects.publish.show');
    Route::post('projects/{project}/publish', [ProjectPublishController::class, 'store'])->name('projects.publish.store')->can('edit-projects');
    Route::delete('projects/{project}/publish', [ProjectPublishController::class, 'destroy'])->name('projects.publish.destroy')->can('edit-projects');
    Route::put('projects/{project}/domain', [ProjectPublishController::class, 'updateDomain'])->name('projects.domain.update')->can('manage-studio');
    Route::patch('projects/{project}/submissions/{submission}', [ProjectPublishController::class, 'markRead'])->name('projects.submissions.update');
    Route::delete('projects/{project}/submissions/{submission}', [ProjectPublishController::class, 'destroySubmission'])->name('projects.submissions.destroy')->can('edit-projects');
    Route::get('projects/{project}/submissions/{submission}/files/{field}', [ProjectPublishController::class, 'download'])->name('projects.submissions.file');

    Route::get('preview/{project}/{path?}', PreviewController::class)->where('path', '[a-z0-9\-/]*')->name('preview');

    Route::post('uploads', UploadController::class)->middleware('throttle:60,1')->name('uploads.store')->can('edit-projects');
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    Route::get('media/library', [MediaController::class, 'library'])->name('media.library');
    Route::delete('media', [MediaController::class, 'destroy'])->name('media.destroy')->can('manage-studio');

    Route::get('status', [SiteStatusController::class, 'index'])->name('status.index');
    Route::post('status/{project}', [SiteStatusController::class, 'store'])->middleware('throttle:20,1')->name('status.check')->can('edit-projects');

    Route::get('themes', [ThemeController::class, 'index'])->name('themes.index');
    Route::post('themes', [ThemeController::class, 'store'])->name('themes.store')->can('manage-studio');
    Route::post('themes/import', [ThemeTransferController::class, 'import'])->name('themes.import')->can('manage-studio');
    Route::get('themes/{theme}/export', [ThemeTransferController::class, 'export'])->name('themes.export');
    Route::get('themes/{theme}/edit', [ThemeController::class, 'edit'])->name('themes.edit');
    Route::put('themes/{theme}', [ThemeController::class, 'update'])->name('themes.update')->can('manage-studio');

    Route::get('users', [UserController::class, 'index'])->can('manage-studio')->name('users.index');
    Route::post('users', [UserController::class, 'store'])->can('manage-studio')->name('users.store');
    Route::patch('users/{user}', [UserController::class, 'update'])->can('manage-studio')->name('users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->can('manage-studio')->name('users.destroy');

    Route::get('components', [ComponentController::class, 'index'])->name('components.index');
    Route::post('components', [ComponentController::class, 'store'])->name('components.store')->can('manage-studio');
    Route::get('components/{component}/edit', [ComponentController::class, 'edit'])->name('components.edit');
    Route::put('components/{component}', [ComponentController::class, 'update'])->name('components.update')->can('manage-studio');
});
