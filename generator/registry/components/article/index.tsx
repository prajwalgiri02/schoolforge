import { ArrowLeft } from 'lucide-react';
import { Container, Media, SmartLink, formatDate } from '../../runtime/ui';
import type { SectionProps } from '../../runtime/types';

type ArticleProps = SectionProps<{ newsSlug?: string }>;

export default function Article({ section, site }: ArticleProps) {
    const article = site.content.news?.find((item) => item.slug === section.newsSlug);

    if (!article) {
        return null;
    }

    return (
        <article className="bg-background py-14 md:py-20">
            <Container className="max-w-3xl">
                <SmartLink href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to news
                </SmartLink>
                <time className="mt-8 block text-sm font-semibold text-accent-strong" dateTime={article.date}>
                    {formatDate(article.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
                <h1 className="school-heading mt-3 text-4xl md:text-5xl">{article.title}</h1>
                {article.excerpt && <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{article.excerpt}</p>}
                <div className="mt-10 aspect-[16/9] overflow-hidden rounded-card">
                    <Media src={article.image} alt={article.title} icon="megaphone" />
                </div>
                <div className="school-prose mt-10 text-lg leading-relaxed text-foreground/85">
                    {(article.body ?? []).map((paragraph) => (
                        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                    ))}
                </div>
            </Container>
        </article>
    );
}
