import { Megaphone } from 'lucide-react';
import { Container, SmartLink } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

export default function AnnouncementBar({ site }: SectionProps) {
    const announcement = site.content.announcement;

    if (!announcement?.text) {
        return null;
    }

    return (
        <div className="bg-accent text-accent-foreground">
            <Container className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm font-medium">
                <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{announcement.text}</span>
                {announcement.link && (
                    <SmartLink href={announcement.link.href} className="font-semibold underline underline-offset-4">
                        {announcement.link.label}
                    </SmartLink>
                )}
            </Container>
        </div>
    );
}
