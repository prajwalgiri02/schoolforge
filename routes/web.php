<?php

use App\Http\Controllers\Auth\SessionController;
use App\Http\Controllers\ComponentController;
use App\Http\Controllers\PreviewController;
use App\Http\Controllers\ProjectContentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectDesignController;
use App\Http\Controllers\ProjectGenerateController;
use App\Http\Controllers\ProjectHistoryController;
use App\Http\Controllers\ProjectPagesController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function (): void {
    Route::get('login', [SessionController::class, 'create'])->name('login');
    Route::post('login', [SessionController::class, 'store'])->middleware('throttle:5,1')->name('login.store');
});

Route::middleware('auth')->group(function (): void {
    Route::post('logout', [SessionController::class, 'destroy'])->name('logout');

    Route::get('/', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::post('projects/import', [ProjectController::class, 'import'])->name('projects.import');
    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');
    Route::get('projects/{project}/config.json', [ProjectController::class, 'export'])->name('projects.export');

    Route::get('projects/{project}/content', [ProjectContentController::class, 'index'])->name('projects.content.index');
    Route::get('projects/{project}/content/{key}', [ProjectContentController::class, 'edit'])->name('projects.content.edit');
    Route::put('projects/{project}/content/{key}', [ProjectContentController::class, 'update'])->name('projects.content.update');

    Route::get('projects/{project}/design', [ProjectDesignController::class, 'edit'])->name('projects.design.edit');
    Route::put('projects/{project}/design', [ProjectDesignController::class, 'update'])->name('projects.design.update');

    Route::get('projects/{project}/pages', [ProjectPagesController::class, 'edit'])->name('projects.pages.edit');
    Route::put('projects/{project}/pages', [ProjectPagesController::class, 'update'])->name('projects.pages.update');
    Route::delete('projects/{project}/pages', [ProjectPagesController::class, 'destroy'])->name('projects.pages.destroy');

    Route::get('projects/{project}/history', [ProjectHistoryController::class, 'index'])->name('projects.history.index');
    Route::post('projects/{project}/history/{version}/restore', [ProjectHistoryController::class, 'restore'])->name('projects.history.restore');
    Route::post('projects/{project}/duplicate', [ProjectHistoryController::class, 'duplicate'])->name('projects.duplicate');
    Route::post('projects/{project}/template', [ProjectHistoryController::class, 'template'])->name('projects.template');
    Route::get('projects/{project}/generate', [ProjectGenerateController::class, 'show'])->name('projects.generate.show');
    Route::post('projects/{project}/generate', [ProjectGenerateController::class, 'store'])->name('projects.generate.store');

    Route::get('preview/{project}/{path?}', PreviewController::class)->where('path', '[a-z0-9\-/]*')->name('preview');

    Route::post('uploads', UploadController::class)->middleware('throttle:60,1')->name('uploads.store');

    Route::get('themes', [ThemeController::class, 'index'])->name('themes.index');
    Route::post('themes', [ThemeController::class, 'store'])->name('themes.store');
    Route::get('themes/{theme}/edit', [ThemeController::class, 'edit'])->name('themes.edit');
    Route::put('themes/{theme}', [ThemeController::class, 'update'])->name('themes.update');

    Route::get('components', [ComponentController::class, 'index'])->name('components.index');
    Route::post('components', [ComponentController::class, 'store'])->name('components.store');
    Route::get('components/{component}/edit', [ComponentController::class, 'edit'])->name('components.edit');
    Route::put('components/{component}', [ComponentController::class, 'update'])->name('components.update');
});
