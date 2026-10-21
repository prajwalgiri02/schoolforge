import { NextResponse } from 'next/server';

type ContactInput = { name?: string; email?: string; phone?: string; subject?: string; campus?: string; message?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: ContactInput): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!input.name?.trim()) {
        errors.name = 'Please tell us your name.';
    } else if (input.name.length > 120) {
        errors.name = 'Name must be 120 characters or fewer.';
    }

    if (!input.email?.trim() || !EMAIL.test(input.email)) {
        errors.email = 'Please enter a valid email address.';
    }

    if (input.phone && input.phone.length > 40) {
        errors.phone = 'Phone number must be 40 characters or fewer.';
    }

    if (input.campus && input.campus.length > 120) {
        errors.campus = 'Campus must be 120 characters or fewer.';
    }

    if (!input.message?.trim()) {
        errors.message = 'Please write a message.';
    } else if (input.message.length > 5000) {
        errors.message = 'Message must be 5000 characters or fewer.';
    }

    return errors;
}

export async function POST(request: Request) {
    const input = (await request.json().catch(() => ({}))) as ContactInput;
    const errors = validate(input);

    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ errors }, { status: 422 });
    }

    const submission = {
        name: input.name!.trim(),
        email: input.email!.trim(),
        phone: input.phone?.trim() || null,
        subject: input.subject?.trim() || 'General question',
        campus: input.campus?.trim() || null,
        message: input.message!.trim(),
        receivedAt: new Date().toISOString(),
    };

    const webhook = process.env.CONTACT_WEBHOOK_URL;

    if (webhook) {
        const response = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submission) });

        if (!response.ok) {
            return NextResponse.json({ message: 'Could not deliver your message. Please try again later.' }, { status: 502 });
        }
    } else {
        console.info('[contact] New enquiry (set CONTACT_WEBHOOK_URL to forward these):', submission);
    }

    return NextResponse.json({ ok: true });
}
