<?php

namespace App\Enums;

/**
 * What an admin panel account may do. Administrators run the whole site;
 * editors keep content up to date and answer enquiries and applications.
 */
enum StaffRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrator',
            self::Editor => 'Editor',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Admin => 'Everything, including staff accounts, payments, results and alerts.',
            self::Editor => 'Website content, enquiries and applications.',
        };
    }
}
