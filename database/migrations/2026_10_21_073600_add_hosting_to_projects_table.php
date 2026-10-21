<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('domain')->nullable()->unique()->after('git_remote');
            $table->timestamp('published_at')->nullable()->after('domain');
            $table->longText('published_site')->nullable()->after('published_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropUnique(['domain']);
            $table->dropColumn(['domain', 'published_at', 'published_site']);
        });
    }
};
