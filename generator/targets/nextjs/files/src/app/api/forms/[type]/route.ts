import { NextResponse } from 'next/server';
import { formFields, forms, newReference, validateFields, type FileInfo, type FormType } from '@/school/runtime/forms';
import { defaultLocale, sites } from '@/school/sites';

type Params = Promise<{ type: string }>;

/**
 * Receives admission and job applications, alumni registrations and testimonials.
 * Next.js sites have no database, so each submission (with its files) is
 * forwarded to FORMS_WEBHOOK_URL (Zapier, Make, n8n, a Google Apps Script...).
 */
export async function POST(request: Request, { params }: { params: Params }) {
    const { type } = await params;

    if (!(type in forms)) {
        return NextResponse.json({ message: 'Unknown form.' }, { status: 404 });
    }

    const formType = type as FormType;
    const input = await request.formData().catch(() => null);

    if (!input) {
        return NextResponse.json({ message: 'Send the form as multipart/form-data.' }, { status: 400 });
    }

    const locale = String(input.get('locale') ?? defaultLocale);
    const site = sites[locale] ?? sites[defaultLocale];
    const fields = formFields(formType);
    const values: Record<string, string> = {};
    const files: Record<string, File> = {};

    for (const field of fields) {
        const value = input.get(field.name);

        if (value instanceof File) {
            files[field.name] = value;
        } else if (typeof value === 'string') {
            values[field.name] = value.trim();
        }
    }

    const errors = validateFields(site, fields, values, files as Record<string, FileInfo>);

    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ errors }, { status: 422 });
    }

    const reference = newReference(formType);
    const webhook = process.env.FORMS_WEBHOOK_URL;

    if (webhook) {
        const forward = new FormData();
        forward.append('form', formType);
        forward.append('reference', reference);
        forward.append('receivedAt', new Date().toISOString());
        Object.entries(values).forEach(([name, value]) => forward.append(name, value));
        Object.entries(files).forEach(([name, file]) => file.size > 0 && forward.append(name, file, file.name));

        const response = await fetch(webhook, { method: 'POST', body: forward });

        if (!response.ok) {
            return NextResponse.json({ message: 'Could not deliver your application. Please try again later.' }, { status: 502 });
        }
    } else {
        console.info(`[forms] New ${formType} ${reference} (set FORMS_WEBHOOK_URL to forward these):`, values, Object.keys(files));
    }

    return NextResponse.json({ reference }, { status: 201 });
}
