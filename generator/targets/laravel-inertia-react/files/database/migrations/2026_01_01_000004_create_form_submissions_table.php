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
        if (Schema::hasTable('form_submissions')) {
            return;
        }

        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->string('type', 40)->index();
            $table->string('reference', 40)->unique();
            $table->string('status', 40)->index();
            $table->string('name', 120);
            $table->string('email', 190)->index();
            $table->json('data');
            $table->json('files')->nullable();
            $table->text('notes')->nullable();
            $table->string('locale', 10)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};
