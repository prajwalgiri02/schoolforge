'use client';

import { Menu, Phone, Mail, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentPath } from '../../adapter';
import { isActivePath } from '../../runtime/pages';
import { ButtonLink, Container, SmartLink, cn } from '../../runtime/ui';
import { SocialIcon, socialLabels } from '../../runtime/icons';
import type { SectionProps, SiteData } from '../../runtime/types';

type NavbarProps = SectionProps<{ cta?: { label: string; href: string } | false; sticky?: boolean }>;

function Brand({ site, light = false }: { site: SiteData; light?: boolean }) {
    const { school } = site;

    return (
        <SmartLink href="/" className="flex items-center gap-3" aria-label={`${school.name} home`}>
            {school.logo ? (
                <img src={school.logo} alt="" className="h-11 w-11 object-contain" />
            ) : (
                <span className="school-heading flex h-11 w-11 items-center justify-center rounded-button bg-primary text-lg text-primary-foreground">
                    {(school.shortName ?? school.name).slice(0, 1)}
                </span>
            )}
            <span className="flex flex-col leading-tight">
                <span className={cn('school-heading text-lg', light ? 'text-white' : 'text-primary')}>{school.shortName ?? school.name}</span>
                {school.motto && <span className={cn('text-xs', light ? 'text-white/75' : 'text-muted-foreground')}>{school.motto}</span>}
            </span>
        </SmartLink>
    );
}

function UtilityBar({ site }: { site: SiteData }) {
    const contact = site.school.contact ?? {};
    const social = Object.entries(site.school.social ?? {}).filter(([, url]) => Boolean(url));

    return (
        <div className="hidden bg-primary text-primary-foreground md:block">
            <Container className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-6 opacity-90">
                    {contact.phone?.[0] && (
                        <a href={`tel:${contact.phone[0].replace(/\s/g, '')}`} className="flex items-center gap-2 hover:opacity-100">
                            <Phone className="h-4 w-4" aria-hidden="true" /> {contact.phone[0]}
                        </a>
                    )}
                    {contact.email?.[0] && (
                        <a href={`mailto:${contact.email[0]}`} className="flex items-center gap-2 hover:opacity-100">
                            <Mail className="h-4 w-4" aria-hidden="true" /> {contact.email[0]}
                        </a>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {social.map(([network, url]) => (
                        <a key={network} href={url} target="_blank" rel="noopener noreferrer" aria-label={socialLabels[network] ?? network} className="opacity-80 hover:opacity-100">
                            <SocialIcon network={network} className="h-4 w-4" />
                        </a>
                    ))}
                </div>
            </Container>
        </div>
    );
}

export default function Navbar({ section, site }: NavbarProps) {
    const variant = section.variant ?? 'classic';
    const currentPath = useCurrentPath();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const cta = section.cta === false ? null : (section.cta ?? (site.content.admissions?.open !== false && site.pages.some((p) => p.slug === '/admissions') ? { label: 'Apply Now', href: '/admissions' } : null));

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setOpen(false), [currentPath]);

    const links = site.navigation.map((item) => {
        const active = isActivePath(currentPath, item.href);

        return (
            <SmartLink
                key={item.href}
                href={item.href}
                className={cn(
                    'relative px-1 py-2 text-[0.93rem] font-medium transition-colors',
                    active ? 'text-primary' : 'text-foreground/75 hover:text-primary',
                    variant === 'classic' && active && 'after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:bg-accent',
                )}
            >
                {item.label}
            </SmartLink>
        );
    });

    const mobileMenu = open && (
        <div className="border-t border-border bg-background lg:hidden">
            <Container className="flex flex-col py-4">
                {site.navigation.map((item) => (
                    <SmartLink
                        key={item.href}
                        href={item.href}
                        className={cn('border-b border-border/60 py-3 font-medium', isActivePath(currentPath, item.href) ? 'text-primary' : 'text-foreground/80')}
                    >
                        {item.label}
                    </SmartLink>
                ))}
                {cta && (
                    <ButtonLink href={cta.href} className="mt-4">
                        {cta.label}
                    </ButtonLink>
                )}
            </Container>
        </div>
    );

    const toggle = (
        <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-button text-foreground lg:hidden"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
        >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
    );

    if (variant === 'centered') {
        return (
            <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
                <Container className="flex items-center justify-between py-4 lg:flex-col lg:gap-4 lg:py-6">
                    <Brand site={site} />
                    {toggle}
                    <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
                        {links}
                        {cta && (
                            <SmartLink href={cta.href} className="school-eyebrow border-b-2 border-accent pb-1 text-primary">
                                {cta.label}
                            </SmartLink>
                        )}
                    </nav>
                </Container>
                {mobileMenu}
            </header>
        );
    }

    if (variant === 'minimal') {
        return (
            <header className={cn('sticky top-0 z-40 transition-all', scrolled || open ? 'bg-background/90 shadow-sm backdrop-blur' : 'bg-background')}>
                <Container className="flex items-center justify-between py-4">
                    <Brand site={site} />
                    <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 lg:flex">
                        {site.navigation.map((item) => (
                            <SmartLink
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'rounded-full px-4 py-2 text-sm font-medium transition',
                                    isActivePath(currentPath, item.href) ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:text-primary',
                                )}
                            >
                                {item.label}
                            </SmartLink>
                        ))}
                    </nav>
                    <div className="flex items-center gap-2">
                        {cta && (
                            <ButtonLink href={cta.href} size="sm" className="hidden sm:inline-flex">
                                {cta.label}
                            </ButtonLink>
                        )}
                        {toggle}
                    </div>
                </Container>
                {mobileMenu}
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-40">
            <UtilityBar site={site} />
            <div className={cn('border-b border-border bg-background transition-shadow', scrolled && 'shadow-md')}>
                <Container className="flex items-center justify-between py-4">
                    <Brand site={site} />
                    <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
                        {links}
                    </nav>
                    <div className="flex items-center gap-2">
                        {cta && (
                            <ButtonLink href={cta.href} variant="accent" size="sm" className="hidden sm:inline-flex">
                                {cta.label}
                            </ButtonLink>
                        )}
                        {toggle}
                    </div>
                </Container>
            </div>
            {mobileMenu}
        </header>
    );
}
