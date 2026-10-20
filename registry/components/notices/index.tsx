import { Bell, FileText } from 'lucide-react';
import { Container, Section, SectionHeading, SmartLink, cn, formatDate, limitItems } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

export default function Notices({ section, site }: SectionProps) {
    const notices = limitItems(
        [...(site.content.notices ?? [])].sort((a, b) => Number(Boolean(b.important)) - Number(Boolean(a.important)) || (b.date ?? '').localeCompare(a.date ?? '')),
        section.limit,
    );

    if (notices.length === 0) {
        return null;
    }

    return (
        <Section>
            <Container className="max-w-4xl">
                <SectionHeading eyebrow={section.eyebrow ?? 'Notice Board'} title={section.title ?? 'Notices & circulars'} subtitle={section.subtitle} />
                <div className="school-card divide-y divide-border">
                    {notices.map((notice) => {
                        const body = (
                            <>
                                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', notice.important ? 'bg-accent text-accent-foreground' : 'bg-muted text-primary')}>
                                    {notice.important ? <Bell className="h-5 w-5" aria-hidden="true" /> : <FileText className="h-5 w-5" aria-hidden="true" />}
                                </span>
                                <span className="flex-1">
                                    <span className="font-semibold">{notice.title}</span>
                                    {notice.important && <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-strong">Important</span>}
                                </span>
                                {notice.date && <time className="shrink-0 text-sm text-muted-foreground">{formatDate(notice.date)}</time>}
                            </>
                        );

                        return notice.link ? (
                            <SmartLink key={notice.title} href={notice.link} className="flex items-center gap-4 p-5 transition hover:bg-muted">
                                {body}
                            </SmartLink>
                        ) : (
                            <div key={notice.title} className="flex items-center gap-4 p-5">
                                {body}
                            </div>
                        );
                    })}
                </div>
            </Container>
        </Section>
    );
}
