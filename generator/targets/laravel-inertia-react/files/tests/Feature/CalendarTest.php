<?php

namespace Tests\Feature;

use App\Models\SiteContent;
use App\Models\User;
use App\Support\SchoolCalendar;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CalendarTest extends TestCase
{
    use RefreshDatabase;

    private const SITE = ['school' => ['name' => 'Everest, School'], 'seo' => ['siteUrl' => 'https://everest.edu.np/'], 'content' => []];

    public function test_the_feed_lists_every_event(): void
    {
        $admin = User::factory()->create();
        $this->actingAs($admin)->put('/admin/content/events', ['value' => [
            ['title' => 'Sports Day', 'date' => '2026-12-01', 'time' => '9 am - 1 pm', 'location' => 'Main ground'],
            ['title' => 'Winter Break', 'date' => '2026-12-25', 'endDate' => '2027-01-05'],
        ]])->assertSessionHasNoErrors();

        $ics = $this->get('/events.ics')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
            ->getContent();

        $this->assertStringStartsWith("BEGIN:VCALENDAR\r\n", $ics);
        $this->assertSame(2, substr_count($ics, 'BEGIN:VEVENT'));
        $this->assertStringContainsString("DTSTART:20261201T090000\r\nDTEND:20261201T130000", $ics);
        $this->assertStringContainsString("DTSTART;VALUE=DATE:20261225\r\nDTEND;VALUE=DATE:20270106", $ics);
        $this->assertStringContainsString('LOCATION:Main ground', $ics);
        $this->assertSame(1, SiteContent::query()->count());
    }

    public function test_event_times_are_read_like_the_generator_does(): void
    {
        $this->assertSame(['start' => [10, 0], 'end' => null], SchoolCalendar::parseTime('10:00 AM'));
        $this->assertSame(['start' => [9, 0], 'end' => [13, 0]], SchoolCalendar::parseTime('9 am - 1 pm'));
        $this->assertSame(['start' => [14, 0], 'end' => [16, 0]], SchoolCalendar::parseTime('2 - 4 pm'));
        $this->assertSame(['start' => [14, 0], 'end' => [16, 30]], SchoolCalendar::parseTime('14:00–16:30'));
        $this->assertSame(['start' => [0, 30], 'end' => null], SchoolCalendar::parseTime('12:30 am'));
        $this->assertNull(SchoolCalendar::parseTime('All day'));
        $this->assertNull(SchoolCalendar::parseTime(null));
    }

    public function test_text_is_escaped_and_long_lines_folded(): void
    {
        $title = 'वार्षिकोत्सव कार्यक्रम तथा पुरस्कार वितरण समारोह र अभिभावक भेटघाट';
        $ics = SchoolCalendar::ics(self::SITE, [
            ['title' => $title, 'date' => '2026-11-02'],
            ['title' => 'Open House', 'date' => '2026-12-05', 'time' => '11:00', 'location' => 'Hall; Block A'],
        ]);

        foreach (explode("\r\n", $ics) as $line) {
            $this->assertLessThanOrEqual(75, strlen($line));
            $this->assertTrue(mb_check_encoding($line, 'UTF-8'), 'no character is cut in half');
        }

        $this->assertStringContainsString("SUMMARY:{$title}", str_replace("\r\n ", '', $ics));
        $this->assertStringContainsString('X-WR-CALNAME:Everest\\, School', $ics);
        $this->assertStringContainsString('LOCATION:Hall\; Block A', $ics);
        $this->assertStringContainsString('UID:2026-12-05-open-house@everest.edu.np', $ics);
        $this->assertMatchesRegularExpression('/UID:2026-11-02-event-[a-z0-9]+@everest\.edu\.np/', $ics);
        $this->assertStringContainsString('DTEND:20261205T120000', $ics, 'events without an end time last an hour');
    }
}
