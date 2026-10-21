import { Avatar, Container, Media, Section, SectionHeading, limitItems } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Faculty({ section, site }: SectionProps) {
    const variant = section.variant ?? 'grid';
    const faculty = limitItems(site.content.faculty, section.limit);

    if (faculty.length === 0) {
        return null;
    }

    const heading = (
        <SectionHeading
            eyebrow={section.eyebrow ?? t(site, 'ourPeople')}
            title={section.title ?? t(site, 'facultyTitle')}
            subtitle={section.subtitle ?? t(site, 'facultySubtitle')}
        />
    );

    if (variant === 'compact') {
        const departments = Array.from(new Set(faculty.map((member) => member.department ?? t(site, 'facultyDepartment'))));

        return (
            <Section>
                <Container className="max-w-5xl">
                    {heading}
                    <div className="space-y-12">
                        {departments.map((department) => (
                            <div key={department}>
                                <h3 className="school-eyebrow mb-5 border-b border-border pb-3 text-accent-strong">{department}</h3>
                                <ul className="grid gap-5 sm:grid-cols-2">
                                    {faculty
                                        .filter((member) => (member.department ?? t(site, 'facultyDepartment')) === department)
                                        .map((member) => (
                                            <li key={member.name} className="flex items-center gap-4">
                                                <Avatar src={member.photo} name={member.name} className="h-14 w-14 shrink-0" />
                                                <div>
                                                    <p className="font-semibold">{member.name}</p>
                                                    {member.role && <p className="text-sm text-muted-foreground">{member.role}</p>}
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>
        );
    }

    return (
        <Section tone="muted">
            <Container>
                {heading}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {faculty.map((member) => (
                        <article key={member.name} className="school-card overflow-hidden text-center">
                            <div className="aspect-square">
                                <Media sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" src={member.photo} alt={member.name} label={member.name} icon="users" />
                            </div>
                            <div className="p-5">
                                <h3 className="school-heading text-lg">{member.name}</h3>
                                {member.role && <p className="mt-1 text-sm font-medium text-accent-strong">{member.role}</p>}
                                {member.department && <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{member.department}</p>}
                                {member.bio && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>}
                            </div>
                        </article>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
