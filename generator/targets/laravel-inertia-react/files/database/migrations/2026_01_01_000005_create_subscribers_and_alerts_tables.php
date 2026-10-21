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
        if (! Schema::hasTable('subscribers')) {
            Schema::create('subscribers', function (Blueprint $table) {
                $table->id();
                $table->string('email', 190)->nullable()->unique();
                $table->string('phone', 20)->nullable()->unique();
                $table->string('locale', 10)->nullable();
                $table->string('token', 64)->unique();
                $table->timestamp('unsubscribed_at')->nullable()->index();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('alerts')) {
            Schema::create('alerts', function (Blueprint $table) {
                $table->id();
                $table->string('subject', 160);
                $table->text('message');
                $table->json('channels');
                $table->unsignedInteger('email_count')->default(0);
                $table->unsignedInteger('sms_count')->default(0);
                $table->string('error', 500)->nullable();
                $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('sent_at')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('subscribers');
    }
};
