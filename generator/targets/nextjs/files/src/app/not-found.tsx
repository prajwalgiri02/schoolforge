import Link from 'next/link';
import { defaultLocale, sites } from '@/school/sites';

const site = sites[defaultLocale];

export default function NotFound() {
    return (
        <main className={`school-site theme-${site.theme.name} flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground`}>
            <p className="school-eyebrow text-accent-strong">Error 404</p>
            <h1 className="school-heading mt-3 text-4xl">This page could not be found</h1>
            <p className="mt-4 max-w-md text-muted-foreground">The page you are looking for may have moved. Head back to the {site.school.name} home page.</p>
            <Link href="/" className="school-button mt-8 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                Back to home
            </Link>
        </main>
    );
}
