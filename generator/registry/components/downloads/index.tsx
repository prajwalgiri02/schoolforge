import { Download, FileSpreadsheet, FileText, Image as ImageIcon } from 'lucide-react';
import { Container, Section, SectionHeading } from '../../runtime/ui';
import { formatSiteDate, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

function fileIcon(file: string) {
    const extension = file.split('?')[0].split('.').pop()?.toLowerCase() ?? '';

    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return FileSpreadsheet;
    }

    return ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? ImageIcon : FileText;
}

export default function Downloads({ section, site }: SectionProps) {
    const downloads = site.content.downloads ?? [];

    if (downloads.length === 0) {
        return null;
    }

    const groups = downloads.reduce<Record<string, typeof downloads>>((all, item) => {
        const key = item.category ?? t(site, 'otherFiles');
        (all[key] ??= []).push(item);

        return all;
    }, {});

    return (
        <Section>
            <Container className="max-w-4xl">
                <SectionHeading eyebrow={section.eyebrow ?? t(site, 'downloads')} title={section.title ?? t(site, 'downloadsTitle')} subtitle={section.subtitle} />
                <div className="space-y-10">
                    {Object.entries(groups).map(([category, items]) => (
                        <div key={category}>
                            {Object.keys(groups).length > 1 && <h3 className="school-heading mb-4 text-xl">{category}</h3>}
                            <ul className="divide-y divide-border rounded-card border border-border bg-surface">
                                {items.map((item) => {
                                    const Icon = fileIcon(item.file);
                                    const extension = item.file.split('?')[0].split('.').pop()?.toUpperCase();

                                    return (
                                        <li key={`${item.title}-${item.file}`}>
                                            <a href={item.file} download target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 p-4 hover:bg-muted">
                                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block font-medium group-hover:text-primary">{item.title}</span>
                                                    <span className="block text-sm text-muted-foreground">
                                                        {[extension, item.date && formatSiteDate(site, item.date), item.description].filter(Boolean).join(' · ')}
                                                    </span>
                                                </span>
                                                <Download className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" aria-label={t(site, 'download')} />
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
