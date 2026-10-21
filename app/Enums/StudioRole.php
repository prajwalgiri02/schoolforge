<?php

namespace App\Enums;

/**
 * What a Studio login may do: owners run Studio, editors work on schools,
 * viewers look without changing anything.
 */
enum StudioRole: string
{
    case Owner = 'owner';
    case Editor = 'editor';
    case Viewer = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Editor => 'Editor',
            self::Viewer => 'Viewer',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Owner => 'Everything, including users, themes, components and deleting schools.',
            self::Editor => 'Create and edit schools, upload media and generate websites.',
            self::Viewer => 'Look at schools and previews without changing anything.',
        };
    }

    public function canEditProjects(): bool
    {
        return $this !== self::Viewer;
    }

    public function canManageStudio(): bool
    {
        return $this === self::Owner;
    }
}
