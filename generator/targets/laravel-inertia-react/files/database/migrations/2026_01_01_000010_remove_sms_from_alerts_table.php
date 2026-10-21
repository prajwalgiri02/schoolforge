<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations. Alerts are email only now; sites created before that
     * still have the SMS columns.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('alerts', 'channels')) {
            return;
        }

        Schema::table('alerts', function (Blueprint $table) {
            $table->dropColumn(['channels', 'sms_count']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
