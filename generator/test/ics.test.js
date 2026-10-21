import assert from 'node:assert/strict';
import test from 'node:test';
import { eventIcsHref, eventsToIcs, parseEventTime } from '../registry/runtime/ics.ts';

const site = { school: { name: 'Everest, School' }, seo: { siteUrl: 'https://everest.edu.np/' }, content: { events: [] } };

test('event times are read from free text', () => {
    assert.deepEqual(parseEventTime('10:00 AM'), { start: { hour: 10, minute: 0 }, end: null });
    assert.deepEqual(parseEventTime('9 am - 1 pm'), { start: { hour: 9, minute: 0 }, end: { hour: 13, minute: 0 } });
    assert.deepEqual(parseEventTime('2 - 4 pm'), { start: { hour: 14, minute: 0 }, end: { hour: 16, minute: 0 } });
    assert.deepEqual(parseEventTime('14:00–16:30'), { start: { hour: 14, minute: 0 }, end: { hour: 16, minute: 30 } });
    assert.deepEqual(parseEventTime('12:30 am'), { start: { hour: 0, minute: 30 }, end: null });
    assert.equal(parseEventTime('All day'), null);
    assert.equal(parseEventTime(undefined), null);
});

test('events become an iCalendar feed', () => {
    const ics = eventsToIcs(site, [
        { title: 'Annual Day', date: '2026-11-02', endDate: '2026-11-03' },
        { title: 'Sports Day', date: '2026-12-01', time: '9 am - 1 pm', location: 'Ground; Main', category: 'Sports' },
        { title: 'Open House', date: '2026-12-05', time: '11:00' },
    ]);
    const lines = ics.split('\r\n');

    assert.ok(ics.endsWith('\r\n'));
    assert.equal(lines[0], 'BEGIN:VCALENDAR');
    assert.ok(lines.includes('X-WR-CALNAME:Everest\\, School'));
    assert.ok(lines.includes('UID:2026-11-02-annual-day@everest.edu.np'));
    assert.ok(lines.includes('DTSTART;VALUE=DATE:20261102'));
    assert.ok(lines.includes('DTEND;VALUE=DATE:20261104'), 'all-day end dates are exclusive');
    assert.ok(lines.includes('DTSTART:20261201T090000'));
    assert.ok(lines.includes('DTEND:20261201T130000'));
    assert.ok(lines.includes(String.raw`LOCATION:Ground\; Main`));
    assert.ok(lines.includes('CATEGORIES:Sports'));
    assert.ok(lines.includes('DTEND:20261205T120000'), 'events without an end time last an hour');
});

test('long lines are folded without splitting characters', () => {
    const title = 'वार्षिकोत्सव कार्यक्रम तथा पुरस्कार वितरण समारोह र अभिभावक भेटघाट';
    const ics = eventsToIcs(site, [{ title, date: '2026-11-02' }]);
    const encoder = new TextEncoder();

    for (const line of ics.split('\r\n')) {
        assert.ok(encoder.encode(line).length <= 75, line);
    }

    assert.ok(ics.replace(/\r\n /g, '').includes(`SUMMARY:${title}`));
    assert.match(ics, /UID:2026-11-02-event-[a-z0-9]+@everest\.edu\.np/);
});

test('single events can be downloaded', () => {
    const href = eventIcsHref(site, { title: 'Sports Day', date: '2026-12-01' });

    assert.ok(href.startsWith('data:text/calendar;charset=utf-8,'));
    assert.match(decodeURIComponent(href), /SUMMARY:Sports Day/);
});
