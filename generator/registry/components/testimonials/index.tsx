'use client';

import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState } from 'react';
import { Avatar, Container, Section, SectionHeading, cn, limitItems } from '../../runtime/ui';
import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

export default function Testimonials({ section, site }: SectionProps) {
    const variant = section.variant ?? 'grid';
    const testimonials = limitItems(site.content.testimonials, section.limit);
    const [index, setIndex] = useState(0);

    if (testimonials.length === 0) {
        return null;
    }

    const heading = (
        <SectionHeading
            eyebrow={section.eyebrow ?? t(site, 'testimonials')}
            title={section.title ?? t(site, 'testimonialsTitle')}
            subtitle={section.subtitle}
            invert={variant === 'carousel'}
        />
    );

    if (variant === 'carousel') {
        const item = testimonials[index % testimonials.length];

        return (
            <Section tone="primary">
                <Container className="max-w-4xl text-center">
                    {heading}
                    <figure>
                        <Quote className="mx-auto h-10 w-10 text-accent" aria-hidden="true" />
                        <blockquote className="school-heading mt-6 text-2xl leading-snug md:text-3xl">“{item.quote}”</blockquote>
                        <figcaption className="mt-8 flex items-center justify-center gap-4">
                            <Avatar src={item.photo} name={item.name} className="h-12 w-12" />
                            <span className="text-left">
                                <span className="block font-semibold">{item.name}</span>
                                {item.role && <span className="block text-sm opacity-75">{item.role}</span>}
                            </span>
                        </figcaption>
                    </figure>
                    {testimonials.length > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <button
                                type="button"
                                aria-label={t(site, 'previousTestimonial')}
                                onClick={() => setIndex((value) => (value - 1 + testimonials.length) % testimonials.length)}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-current/30 hover:bg-white/10"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="flex gap-2">
                                {testimonials.map((testimonial, dot) => (
                                    <button
                                        key={testimonial.name}
                                        type="button"
                                        aria-label={t(site, 'showTestimonial', { number: dot + 1 })}
                                        aria-current={dot === index}
                                        onClick={() => setIndex(dot)}
                                        className={cn('h-2.5 rounded-full transition-all', dot === index ? 'w-8 bg-accent' : 'w-2.5 bg-current/30')}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                aria-label={t(site, 'nextTestimonial')}
                                onClick={() => setIndex((value) => (value + 1) % testimonials.length)}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-current/30 hover:bg-white/10"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </Container>
            </Section>
        );
    }

    return (
        <Section tone="muted">
            <Container>
                {heading}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((item) => (
                        <figure key={item.name} className="school-card flex flex-col p-8">
                            <Quote className="h-8 w-8 text-accent-strong" aria-hidden="true" />
                            <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-foreground/85">“{item.quote}”</blockquote>
                            <figcaption className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                                <Avatar src={item.photo} name={item.name} className="h-12 w-12" />
                                <span>
                                    <span className="block font-semibold">{item.name}</span>
                                    {item.role && <span className="block text-sm text-muted-foreground">{item.role}</span>}
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </Container>
        </Section>
    );
}
