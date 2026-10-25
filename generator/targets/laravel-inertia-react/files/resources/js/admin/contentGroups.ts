const groups: { title: string; keys: string[] }[] = [
    { title: 'School', keys: ['school', 'about', 'principal', 'contact', 'campuses', 'social', 'seo'] },
    { title: 'Home page', keys: ['hero', 'announcement', 'popup', 'stats', 'testimonials'] },
    { title: 'Academics & campus', keys: ['programs', 'facilities', 'faculty', 'achievements'] },
    { title: 'News & admissions', keys: ['news', 'events', 'notices', 'admissions', 'faqs', 'downloads'] },
    { title: 'Gallery & media', keys: ['gallery', 'albums', 'videos'] },
    { title: 'People & community', keys: ['jobs', 'alumni'] },
];

/** Content sections grouped by where they appear on the website; unknown sections go under "Other". */
export function groupSections<T extends { key: string }>(sections: T[]): { title: string; sections: T[] }[] {
    const byKey = new Map(sections.map((section) => [section.key, section]));
    const grouped = new Set(groups.flatMap((group) => group.keys));

    return [...groups, { title: 'Other', keys: sections.map((section) => section.key).filter((key) => !grouped.has(key)) }]
        .map((group) => ({ title: group.title, sections: group.keys.map((key) => byKey.get(key)).filter((section): section is T => section !== undefined) }))
        .filter((group) => group.sections.length > 0);
}
