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
        if (Schema::hasTable('exams')) {
            return;
        }

        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $table->string('symbol_number', 40);
            $table->string('student_name', 160);
            $table->string('date_of_birth', 20)->nullable();
            $table->string('class', 60)->nullable();
            $table->string('gpa', 20)->nullable();
            $table->string('result', 40)->nullable();
            $table->json('subjects');
            $table->timestamps();

            $table->unique(['exam_id', 'symbol_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam_results');
        Schema::dropIfExists('exams');
    }
};
