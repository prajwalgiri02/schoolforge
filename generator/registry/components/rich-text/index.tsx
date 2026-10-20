import { Container, Section, SectionHeading, type SectionTone } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type RichTextProps = SectionProps<{ paragraphs?: string[]; tone?: SectionTone; align?: 'center' | 'left' }>;

/**
 * Free-form text block for custom content that no dedicated component covers.
 */
export default function RichText({ section }: RichTextProps) {
    const paragraphs = section.paragraphs ?? [];

    if (!section.title && paragraphs.length === 0) {
        return null;
    }

    return (
        <Section tone={section.tone ?? 'default'}>
            <Container className="max-w-3xl">
                <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.subtitle} align={section.align ?? 'left'} />
                <div className="school-prose text-lg leading-relaxed text-foreground/85">
                    {paragraphs.map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
