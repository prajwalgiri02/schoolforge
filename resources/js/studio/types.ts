export type ProjectSummary = {
    slug: string;
    name: string;
    theme: string;
    themeLabel: string;
    target: string;
    colors: Record<string, string>;
    updatedAt: string | null;
    outputPath: string | null;
    isTemplate: boolean;
    signedUpAt: string | null;
    needsOnboarding: boolean;
    needsPackage: boolean;
    unpaidInvoice: string | null;
    trialEndsAt: string | null;
};

export type ThemeSummary = {
    name: string;
    label: string;
    description: string;
    extends: string | null;
    colors: Record<string, string>;
    fonts: { heading: string; body: string };
};

export type Target = { name: string; label: string };

export type ComponentProp = {
    name: string;
    type: 'select' | 'boolean' | 'text' | 'image' | 'link';
    label: string;
    help?: string;
    options?: { value: string; label: string }[];
    hideable?: boolean;
    default?: boolean;
};

export type ComponentSummary = { name: string; label: string; description?: string; variants: string[]; props?: ComponentProp[] };

export type StudioSharedProps = {
    auth: { user: { id: number; name: string; email: string; role: 'owner' | 'editor' | 'viewer' | 'school'; canEdit: boolean; canManage: boolean; schoolSlug: string | null } | null };
    flash: { success?: string | null; error?: string | null };
    errors: Record<string, string>;
};

export const targetLabels: Record<string, string> = {
    nextjs: 'Next.js',
    'laravel-inertia-react': 'Laravel + Inertia',
};
