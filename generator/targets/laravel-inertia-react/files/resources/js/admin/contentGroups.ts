import {
    Award,
    BarChart3,
    Briefcase,
    Building2,
    CalendarDays,
    CircleHelp,
    Download,
    GraduationCap,
    Image,
    Images,
    Info,
    Landmark,
    Megaphone,
    MessageSquareQuote,
    Newspaper,
    PanelTop,
    Phone,
    School,
    Search,
    Share2,
    SquareUserRound,
    UserRound,
    Users,
    Video,
    BellRing,
    ClipboardList,
    FileText,
    type LucideIcon,
} from 'lucide-react';

export type ContentGroup = { title: string; description: string; icon: LucideIcon; keys: string[] };

/** The Content menu: each group is one entry in the sidebar and one page with a tab per section. */
export const contentGroups: ContentGroup[] = [
    { title: 'About the school', description: 'Who you are and how to reach you.', icon: School, keys: ['school', 'about', 'principal', 'contact', 'campuses', 'social'] },
    { title: 'Home page', description: 'What visitors see first.', icon: PanelTop, keys: ['hero', 'announcement', 'popup', 'stats', 'testimonials'] },
    { title: 'News and events', description: 'What is happening at school.', icon: Newspaper, keys: ['news', 'events', 'notices'] },
    { title: 'Admissions', description: 'Help families apply.', icon: GraduationCap, keys: ['admissions', 'faqs', 'downloads'] },
    { title: 'Learning and campus', description: 'What you teach and where.', icon: Landmark, keys: ['programs', 'facilities', 'faculty', 'achievements'] },
    { title: 'Photos and videos', description: 'Pictures and films of school life.', icon: Images, keys: ['gallery', 'albums', 'videos'] },
    { title: 'Jobs and alumni', description: 'Vacancies and former students.', icon: Briefcase, keys: ['jobs', 'alumni'] },
    { title: 'Search engines', description: 'How the website appears on Google and when shared.', icon: Search, keys: ['seo'] },
];

export const groupOf = (key: string): ContentGroup | undefined => contentGroups.find((group) => group.keys.includes(key));

export const sectionIcons: Record<string, LucideIcon> = {
    school: School,
    about: Info,
    principal: UserRound,
    contact: Phone,
    campuses: Building2,
    social: Share2,
    hero: PanelTop,
    announcement: Megaphone,
    popup: BellRing,
    stats: BarChart3,
    testimonials: MessageSquareQuote,
    news: Newspaper,
    events: CalendarDays,
    notices: ClipboardList,
    admissions: GraduationCap,
    faqs: CircleHelp,
    downloads: Download,
    programs: Landmark,
    facilities: Building2,
    faculty: Users,
    achievements: Award,
    gallery: Image,
    albums: Images,
    videos: Video,
    jobs: Briefcase,
    alumni: SquareUserRound,
    seo: Search,
};

/** Content sections grouped by where they appear on the website; unknown sections go under "More". */
export function groupSections<T extends { key: string }>(sections: T[]): { title: string; description: string; icon: LucideIcon; sections: T[] }[] {
    const byKey = new Map(sections.map((section) => [section.key, section]));
    const grouped = new Set(contentGroups.flatMap((group) => group.keys));

    return [...contentGroups, { title: 'More', description: 'Other parts of the website.', icon: FileText, keys: sections.map((section) => section.key).filter((key) => !grouped.has(key)) }]
        .map((group) => ({ title: group.title, description: group.description, icon: group.icon, sections: group.keys.map((key) => byKey.get(key)).filter((section): section is T => section !== undefined) }))
        .filter((group) => group.sections.length > 0);
}
