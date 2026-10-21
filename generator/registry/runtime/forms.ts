import definitions from './forms.json';
import { localeOf, t } from './i18n';
import type { SiteData } from './types';

export type LocalizedText = { en: string; ne?: string } & Record<string, string | undefined>;

export type FormField = {
    name: string;
    type: 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox' | 'hidden';
    label: LocalizedText;
    placeholder?: LocalizedText;
    required?: boolean;
    max?: number;
    half?: boolean;
    options?: { value: string; label: LocalizedText }[];
    accept?: string[];
    maxSizeMb?: number;
};

export type FormStep = { title?: LocalizedText; review?: boolean; fields: FormField[] };

export type FormDefinition = { label: LocalizedText; referencePrefix: string; statuses: string[]; steps: FormStep[] };

export type FormType = 'admission' | 'job' | 'alumni' | 'testimonial';

/** What a submitted file looks like to the validator (a browser File or a server upload). */
export type FileInfo = { name: string; size: number };

export const forms = definitions as unknown as Record<FormType, FormDefinition>;

export function formFields(type: FormType): FormField[] {
    return forms[type].steps.flatMap((step) => step.fields);
}

/** A label in the site's language, falling back to English. */
export function localized(site: SiteData | null, text: LocalizedText | undefined): string {
    if (!text) {
        return '';
    }

    return (site ? text[localeOf(site)] : undefined) ?? text.en;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks one field. The Next.js API route and the browser use this; Laravel
 * applies the same rules in App\Support\FormSchema.
 */
export function validateField(site: SiteData | null, field: FormField, value: string | undefined, file: FileInfo | null | undefined): string | null {
    const label = localized(site, field.label);
    const text = (value ?? '').trim();
    const message = (key: Parameters<typeof t>[1], vars: Record<string, string | number> = {}) => (site ? t(site, key, { field: label, ...vars }) : `${label}: ${key}`);

    if (field.type === 'file') {
        if (!file || file.size === 0) {
            return field.required ? message('fieldRequired') : null;
        }

        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

        if (field.accept && !field.accept.includes(extension)) {
            return message('fileType', { types: field.accept.join(', ').toUpperCase() });
        }

        if (field.maxSizeMb && file.size > field.maxSizeMb * 1024 * 1024) {
            return message('fileTooLarge', { size: field.maxSizeMb });
        }

        return null;
    }

    if (field.type === 'checkbox') {
        return field.required && !['1', 'on', 'true', 'yes'].includes(text) ? message('mustAccept') : null;
    }

    if (!text) {
        return field.required ? message('fieldRequired') : null;
    }

    if (field.max && text.length > field.max) {
        return message('fieldTooLong', { max: field.max });
    }

    if (field.type === 'email' && !EMAIL.test(text)) {
        return message('invalidEmail');
    }

    if (field.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return message('invalidDate');
    }

    if (field.type === 'select' && field.options && !field.options.some((option) => option.value === text)) {
        return message('invalidChoice');
    }

    return null;
}

export function validateFields(site: SiteData | null, fields: FormField[], values: Record<string, string | undefined>, files: Record<string, FileInfo | null | undefined>): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const field of fields) {
        const error = validateField(site, field, values[field.name], files[field.name]);

        if (error) {
            errors[field.name] = error;
        }
    }

    return errors;
}

/** A reference like ADM-26-7KQ2XD that applicants quote and use to track their application. */
export function newReference(type: FormType, date = new Date()): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const random = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

    return `${forms[type].referencePrefix}-${String(date.getFullYear()).slice(2)}-${random}`;
}
