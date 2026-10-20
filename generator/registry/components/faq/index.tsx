import { ChevronDown } from 'lucide-react';
import { Container, Section, SectionHeading, limitItems } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

export default function Faq({ section, site }: SectionProps) {
    const faqs = limitItems(site.content.faqs, section.limit);

    if (faqs.length === 0) {
        return null;
    }

    return (
        <Section tone="muted">
            <Container className="max-w-3xl">
                <SectionHeading eyebrow={section.eyebrow ?? 'FAQ'} title={section.title ?? 'Frequently asked questions'} subtitle={section.subtitle} />
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <details key={faq.question} className="school-card group p-0" open={index === 0}>
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold [&::-webkit-details-marker]:hidden">
                                {faq.question}
                                <ChevronDown className="h-5 w-5 shrink-0 text-accent-strong transition group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <p className="px-5 pb-5 leading-relaxed text-muted-foreground">{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
