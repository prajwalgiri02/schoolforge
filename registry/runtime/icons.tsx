import {
    ArrowRight,
    Award,
    Baby,
    Bell,
    BookOpen,
    BrainCircuit,
    Building2,
    Bus,
    Calculator,
    Calendar,
    Camera,
    CircleCheck,
    Clock,
    Dumbbell,
    Eye,
    FlaskConical,
    Globe,
    GraduationCap,
    Heart,
    HeartPulse,
    Languages,
    Laptop,
    Leaf,
    Library,
    Lightbulb,
    Mail,
    MapPin,
    Medal,
    Megaphone,
    Microscope,
    Monitor,
    Music,
    Palette,
    Phone,
    School,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    Theater,
    TreePine,
    Trophy,
    Users,
    Utensils,
    Wifi,
    type LucideIcon,
} from 'lucide-react';

/**
 * Icons that content authors can reference by name in the school config
 * (for example `"icon": "flask"` on a facility). Add entries here to expose more.
 */
export const iconMap: Record<string, LucideIcon> = {
    'arrow-right': ArrowRight,
    award: Award,
    baby: Baby,
    bell: Bell,
    book: BookOpen,
    brain: BrainCircuit,
    building: Building2,
    bus: Bus,
    calculator: Calculator,
    calendar: Calendar,
    camera: Camera,
    check: CircleCheck,
    clock: Clock,
    computer: Monitor,
    eye: Eye,
    flask: FlaskConical,
    globe: Globe,
    'graduation-cap': GraduationCap,
    gym: Dumbbell,
    heart: Heart,
    health: HeartPulse,
    languages: Languages,
    laptop: Laptop,
    leaf: Leaf,
    library: Library,
    lightbulb: Lightbulb,
    mail: Mail,
    'map-pin': MapPin,
    medal: Medal,
    megaphone: Megaphone,
    microscope: Microscope,
    music: Music,
    palette: Palette,
    phone: Phone,
    school: School,
    shield: ShieldCheck,
    sparkles: Sparkles,
    star: Star,
    target: Target,
    theater: Theater,
    tree: TreePine,
    trophy: Trophy,
    users: Users,
    utensils: Utensils,
    wifi: Wifi,
};

export function Icon({ name, className }: { name?: string; className?: string }) {
    const Component = (name && iconMap[name]) || GraduationCap;

    return <Component className={className} aria-hidden="true" strokeWidth={1.75} />;
}

const socialPaths: Record<string, string> = {
    facebook: 'M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z',
    instagram:
        'M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM21.9 7c-.1-1.6-.4-3-1.6-4.2S17.6 1.3 16 1.2C14.3 1.1 9.7 1.1 8 1.2 6.4 1.3 5 1.6 3.8 2.8S2.2 5.4 2.1 7c-.1 1.7-.1 6.3 0 8 .1 1.6.4 3 1.7 4.2s2.6 1.5 4.2 1.6c1.7.1 6.3.1 8 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.7.1-6.3.2-8zm-2.4 10.6a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.4.4-5.7.4s-4.5.1-5.7-.4a3.3 3.3 0 0 1-1.9-1.8c-.5-1.3-.4-4.3-.4-5.6s-.1-4.4.4-5.7a3.3 3.3 0 0 1 1.9-1.8C7.5 4 10.6 4.1 12 4.1s4.4-.1 5.7.4a3.3 3.3 0 0 1 1.8 1.8c.5 1.3.4 4.3.4 5.7s.1 4.4-.4 5.6z',
    youtube:
        'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15V9l5.8 3-5.8 3z',
    x: 'M17.8 2.5h3.3l-7.2 8.3 8.5 11.2h-6.7l-5.2-6.8-6 6.8H1.2l7.7-8.8L.8 2.5h6.8l4.7 6.2 5.5-6.2zm-1.2 17.6h1.8L6.6 4.4H4.6l12 15.7z',
    linkedin:
        'M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5z',
    tiktok: 'M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.4 7.4 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z',
};

export function SocialIcon({ network, className }: { network: string; className?: string }) {
    const path = socialPaths[network];

    if (!path) {
        return <Globe className={className} aria-hidden="true" />;
    }

    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
            <path d={path} />
        </svg>
    );
}

export const socialLabels: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    x: 'X',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
};
