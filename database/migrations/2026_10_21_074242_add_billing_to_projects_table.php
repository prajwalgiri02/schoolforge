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
            $table->foreignId('plan_id')->nullable()->after('published_site')->constrained()->nullOnDelete();
            $table->date('paid_until')->nullable()->after('plan_id');
            $table->string('billing_email')->nullable()->after('paid_until');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plan_id');
            $table->dropColumn(['paid_until', 'billing_email']);
        });
    }
};
