import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Container, SmartLink, cn } from '../../runtime/ui';
import { SocialIcon, socialLabels } from '../../runtime/icons';
import { localizeDigits, t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

type FooterProps = SectionProps<{ quickLinks?: { label: string; href: string }[] }>;

export default function Footer({ section, site }: FooterProps) {
    const variant = section.variant ?? 'columns';
    const { school } = site;
    const contact = school.contact ?? {};
    const social = Object.entries(school.social ?? {}).filter(([, url]) => Boolean(url));
    const footerPages = site.pages.filter((page) => page.showInFooter && !site.navigation.some((link) => link.href === page.slug)).map((page) => ({ label: page.navLabel ?? page.title, href: page.slug }));
    const quickLinks = section.quickLinks ?? [...site.navigation, ...footerPages];
    const year = new Date().getFullYear();

    const socialRow = social.length > 0 && (
        <div className="flex gap-3">
            {social.map(([network, url]) => (
                <a
                    key={network}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={socialLabels[network] ?? network}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-current/25 transition hover:bg-accent hover:text-accent-foreground"
                >
                    <SocialIcon network={network} className="h-4 w-4" />
                </a>
            ))}
        </div>
    );

    if (variant === 'simple') {
        return (
            <footer className="border-t border-border bg-background text-foreground">
                <Container className="flex flex-col items-center gap-6 py-12 text-center">
                    <p className="school-heading text-2xl text-primary">{school.name}</p>
                    {school.motto && <p className="text-muted-foreground italic">{school.motto}</p>}
                    <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                        {quickLinks.map((link) => (
                            <SmartLink key={link.href} href={link.href} className="text-muted-foreground hover:text-primary">
                                {link.label}
                            </SmartLink>
                        ))}
                    </nav>
                    {socialRow}
                    <p className="text-xs text-muted-foreground">
                        © {year} {school.name}. {t(site, 'allRightsReserved')}
                    </p>
                </Container>
            </footer>
        );
    }

    return (
        <footer className="bg-secondary text-secondary-foreground">
            <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
                <div className="lg:col-span-2 lg:pr-12">
                    <p className="school-heading text-2xl">{school.name}</p>
                    {school.motto && <p className="mt-2 text-accent italic">{school.motto}</p>}
                    {school.about?.summary && <p className="mt-5 max-w-md leading-relaxed opacity-80">{school.about.summary}</p>}
                    {(school.affiliation || school.established) && (
                        <p className="mt-5 text-sm opacity-70">
                            {[school.established && t(site, 'established', { year: localizeDigits(site, school.established) }), school.affiliation].filter(Boolean).join(' · ')}
                        </p>
                    )}
                    <div className="mt-6">{socialRow}</div>
                </div>
                <div>
                    <p className="school-eyebrow mb-5 text-accent">{t(site, 'quickLinks')}</p>
                    <ul className="space-y-3">
                        {quickLinks.map((link) => (
                            <li key={link.href}>
                                <SmartLink href={link.href} className="opacity-80 transition hover:opacity-100">
                                    {link.label}
                                </SmartLink>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <p className="school-eyebrow mb-5 text-accent">{t(site, 'contact')}</p>
                    <ul className="space-y-4 text-sm">
                        {contact.address && (
                            <li className="flex gap-3 opacity-85">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {contact.address}
                            </li>
                        )}
                        {contact.phone?.map((phone) => (
                            <li key={phone}>
                                <a href={`tel:${phone.replace(/\s/g, '')}`} className="flex gap-3 opacity-85 hover:opacity-100">
                                    <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {phone}
                                </a>
                            </li>
                        ))}
                        {contact.email?.map((email) => (
                            <li key={email}>
                                <a href={`mailto:${email}`} className="flex gap-3 opacity-85 hover:opacity-100">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {email}
                                </a>
                            </li>
                        ))}
                        {contact.hours && (
                            <li className="flex gap-3 opacity-85">
                                <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {contact.hours}
                            </li>
                        )}
                    </ul>
                </div>
            </Container>
            <div className={cn('border-t border-current/15')}>
                <Container className="flex flex-col items-center justify-between gap-2 py-6 text-xs opacity-70 sm:flex-row">
                    <p>
                        © {year} {school.name}. {t(site, 'allRightsReserved')}
                    </p>
                    {school.tagline && <p>{school.tagline}</p>}
                </Container>
            </div>
        </footer>
    );
}
