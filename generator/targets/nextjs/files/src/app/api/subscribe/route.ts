import { NextResponse } from 'next/server';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter and SMS alert sign-ups, forwarded to FORMS_WEBHOOK_URL as
 * { form: "subscribe", email, phone, locale } (e.g. into a Google Sheet or Mailchimp via Zapier).
 */
export async function POST(request: Request) {
    const input = (await request.json().catch(() => ({}))) as { email?: string; phone?: string; locale?: string };
    const email = input.email?.trim() ?? '';
    const phone = (input.phone ?? '').replace(/\D/g, '').replace(/^977(?=\d{10}$)/, '');

    if (!email && !phone) {
        return NextResponse.json({ errors: { email: 'Enter an email address or a mobile number.' } }, { status: 422 });
    }

    if (email && (!EMAIL.test(email) || email.length > 190)) {
        return NextResponse.json({ errors: { email: 'Please enter a valid email address.' } }, { status: 422 });
    }

    if (phone && !/^9[678]\d{8}$/.test(phone)) {
        return NextResponse.json({ errors: { phone: 'Enter a 10-digit mobile number, e.g. 98XXXXXXXX.' } }, { status: 422 });
    }

    const subscription = { form: 'subscribe', email: email || null, phone: phone || null, locale: input.locale ?? null, receivedAt: new Date().toISOString() };
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
