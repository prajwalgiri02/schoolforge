/**
 * Shape of the normalized site data that SchoolForge writes to `site.json`.
 * Every section component receives the whole site plus its own section block.
 */

export type LinkItem = { label: string; href: string };

export type ImageRef = string | null | undefined;

export type SectionBlock = {
    id?: string;
    type: string;
    variant?: string;
    title?: string;
    subtitle?: string;
    eyebrow?: string;
    limit?: number;
    [key: string]: unknown;
};

export type PageDefinition = {
    slug: string;
    title: string;
    navLabel?: string;
    description?: string;
    showInNav?: boolean;
    sections: SectionBlock[];
};

export type SchoolProfile = {
    name: string;
    shortName?: string;
    tagline?: string;
    motto?: string;
    established?: string | number;
    type?: string;
    affiliation?: string;
    logo?: ImageRef;
    favicon?: ImageRef;
    about?: {
        summary?: string;
        body?: string[];
        image?: ImageRef;
        mission?: string;
        vision?: string;
        values?: { title: string; description?: string }[];
    };
    principal?: {
        name: string;
        title?: string;
        photo?: ImageRef;
        message?: string[];
    };
    contact?: {
        address?: string;
        phone?: string[];
        email?: string[];
        hours?: string;
        mapEmbedUrl?: string;
    };
    social?: Partial<Record<'facebook' | 'instagram' | 'youtube' | 'x' | 'linkedin' | 'tiktok', string>>;
};

export type SiteContent = {
    hero?: {
        title?: string;
        subtitle?: string;
        image?: ImageRef;
        primaryCta?: LinkItem;
        secondaryCta?: LinkItem;
    };
    announcement?: { text: string; link?: LinkItem };
    popup?: { title?: string; message?: string; image?: ImageRef; link?: LinkItem; startDate?: string; endDate?: string; everyVisit?: boolean };
    stats?: { label: string; value: string }[];
    programs?: { name: string; level?: string; description?: string; image?: ImageRef; highlights?: string[] }[];
    facilities?: { name: string; description?: string; icon?: string; image?: ImageRef }[];
    faculty?: { name: string; role?: string; department?: string; photo?: ImageRef; bio?: string }[];
    gallery?: { src?: ImageRef; caption?: string; category?: string }[];
    albums?: { slug: string; title: string; date?: string; description?: string; cover?: ImageRef; photos?: { src?: ImageRef; caption?: string }[] }[];
    videos?: { title: string; url: string; date?: string; description?: string; thumbnail?: ImageRef }[];
    news?: { slug: string; title: string; date?: string; excerpt?: string; image?: ImageRef; body?: string[]; category?: string; tags?: string[] }[];
    events?: { title: string; date: string; endDate?: string; time?: string; location?: string; description?: string; category?: string }[];
    notices?: { title: string; date?: string; link?: string; important?: boolean }[];
    testimonials?: { quote: string; name: string; role?: string; photo?: ImageRef }[];
    achievements?: { title: string; year?: string | number; description?: string }[];
    admissions?: {
        open?: boolean;
        intro?: string;
        deadline?: string;
        steps?: { title: string; description?: string }[];
        requirements?: string[];
        cta?: LinkItem;
        feeStructureUrl?: string;
    };
    faqs?: { question: string; answer: string }[];
};

export type ThemeMeta = {
    name: string;
    label: string;
    variants: Record<string, string>;
    fontImports?: string[];
};

export type SeoSettings = {
    siteUrl: string | null;
    image: ImageRef;
    keywords: string[];
    googleSiteVerification: string | null;
};

export type LocaleInfo = {
    /** Language shown on this page, e.g. 'ne'. */
    locale: string;
    defaultLocale: string;
    /** Every language the site offers, with the path prefix of each. */
    locales: { code: string; label: string; basePath: string }[];
    /** 'bs' shows dates in Bikram Sambat. */
    calendar: 'ad' | 'bs';
    /** '' for the default language, '/ne' etc. otherwise. */
    basePath: string;
};

export type SiteData = {
    school: SchoolProfile;
    content: SiteContent;
    theme: ThemeMeta;
    navigation: LinkItem[];
    layout: { header: SectionBlock[]; footer: SectionBlock[] };
    pages: PageDefinition[];
    seo?: SeoSettings;
    i18n?: LocaleInfo;
};

export type SectionProps<Extra extends Record<string, unknown> = Record<string, never>> = {
    section: SectionBlock & Partial<Extra>;
    site: SiteData;
    page: PageDefinition;
};
