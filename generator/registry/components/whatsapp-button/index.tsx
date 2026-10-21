import { t } from '../../runtime/i18n';
import type { SectionProps } from '../../runtime/types';

const WHATSAPP_ICON =
    'M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2C2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.9 1.9 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.2 1.3 15.2 0 12 0 5.5 0 .2 5.3.2 11.8c0 2.1.5 4.1 1.6 5.9L.1 24l6.4-1.7c1.7.9 3.6 1.4 5.6 1.4 6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.3z';

/**
 * Opens a WhatsApp chat with `school.contact.whatsapp` (any phone format; only the
 * digits are used, so include the country code, e.g. +977 98...).
 */
export default function WhatsappButton({ site }: SectionProps) {
    const digits = (site.school.contact?.whatsapp ?? '').replace(/\D/g, '');

    if (digits.length < 8) {
        return null;
    }

    const text = encodeURIComponent(t(site, 'whatsappGreeting', { school: site.school.name }));

    return (
        <a
            href={`https://wa.me/${digits}?text=${text}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(site, 'chatOnWhatsapp')}
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] print:hidden"
        >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
                <path d={WHATSAPP_ICON} />
            </svg>
        </a>
    );
}
