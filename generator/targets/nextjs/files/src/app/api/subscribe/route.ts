import { NextResponse } from 'next/server';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-ups, forwarded to FORMS_WEBHOOK_URL as
 * { form: "subscribe", email, locale } (e.g. into a Google Sheet or Mailchimp via Zapier).
 */
export async function POST(request: Request) {
    const input = (await request.json().catch(() => ({}))) as { email?: string; locale?: string };
    const email = input.email?.trim() ?? '';

    if (!EMAIL.test(email) || email.length > 190) {
        return NextResponse.json({ errors: { email: 'Please enter a valid email address.' } }, { status: 422 });
    }

    const subscription = { form: 'subscribe', email, locale: input.locale ?? null, receivedAt: new Date().toISOString() };
    const webhook = process.env.FORMS_WEBHOOK_URL;

    if (webhook) {
        const response = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(subscription) });

        if (!response.ok) {
            return NextResponse.json({ message: 'Could not sign you up. Please try again later.' }, { status: 502 });
        }
    } else {
        console.info('[subscribe] New subscriber (set FORMS_WEBHOOK_URL to forward these):', subscription);
    }

    return NextResponse.json({ subscribed: true }, { status: 201 });
}
