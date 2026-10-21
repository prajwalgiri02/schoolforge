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
        Schema::table('generation_runs', function (Blueprint $table) {
            $table->boolean('git_commit')->default(false)->after('install');
            $table->string('git_remote', 500)->nullable()->after('git_commit');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->string('git_remote', 500)->nullable()->after('output_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('generation_runs', function (Blueprint $table) {
            $table->dropColumn(['git_commit', 'git_remote']);
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('git_remote');
        });
    }
};
