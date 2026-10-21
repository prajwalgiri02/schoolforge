<?php

namespace App\Support;

use App\Models\Exam;
use App\Models\ExamResult;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Imports exam results from a spreadsheet saved as CSV. The first row names the
 * columns: symbol_number and student_name are required; date_of_birth, class,
 * gpa and result are optional; every other column is a subject.
 */
class ResultImporter
{
    public const FIELDS = ['symbol_number', 'student_name', 'date_of_birth', 'class', 'gpa', 'result'];

    /**
     * @return int number of results imported
     *
     * @throws RuntimeException when the file cannot be imported (nothing is saved)
     */
    public static function import(Exam $exam, string $path): int
    {
        $handle = fopen($path, 'r');
        $header = fgetcsv($handle, escape: '\\');

        if (! $header) {
            throw new RuntimeException('The file is empty.');
        }

        $header = array_map(fn (?string $column): string => self::column((string) $column), $header);

        foreach (['symbol_number', 'student_name'] as $required) {
            if (! in_array($required, $header, true)) {
                throw new RuntimeException("The first row needs a “{$required}” column.");
            }
        }

        $rows = [];
        $line = 1;

        while (($values = fgetcsv($handle, escape: '\\')) !== false) {
            $line++;

            if (count(array_filter($values, fn ($value): bool => trim((string) $value) !== '')) === 0) {
                continue;
            }

            $row = array_combine($header, array_pad(array_slice($values, 0, count($header)), count($header), ''));
            $symbol = trim($row['symbol_number']);

            if ($symbol === '' || trim($row['student_name']) === '') {
                throw new RuntimeException("Row {$line} is missing the symbol number or student name.");
            }

            if (isset($rows[$symbol])) {
                throw new RuntimeException("Symbol number {$symbol} appears twice (row {$line}).");
            }

            $rows[$symbol] = [
                'exam_id' => $exam->id,
                'symbol_number' => $symbol,
                'student_name' => trim($row['student_name']),
                'date_of_birth' => filled($row['date_of_birth'] ?? null) ? ExamResult::normalizeDate($row['date_of_birth']) : null,
                'class' => trim($row['class'] ?? '') ?: null,
                'gpa' => trim($row['gpa'] ?? '') ?: null,
                'result' => trim($row['result'] ?? '') ?: null,
                'subjects' => json_encode(collect($row)
                    ->except(self::FIELDS)
                    ->map(fn ($value, string $subject): array => ['subject' => $subject, 'grade' => trim((string) $value)])
                    ->filter(fn (array $subject): bool => $subject['grade'] !== '')
                    ->values()
                    ->all()),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        fclose($handle);

        if ($rows === []) {
            throw new RuntimeException('The file has no results under the header row.');
        }

        DB::transaction(function () use ($exam, $rows): void {
            $exam->results()->delete();

            foreach (array_chunk(array_values($rows), 500) as $chunk) {
                ExamResult::query()->insert($chunk);
            }
        });

        return count($rows);
    }

    /**
     * "Symbol No." → symbol_number, "DOB" → date_of_birth; any other column is a
     * subject and keeps its name as written (English or Nepali).
     */
    private static function column(string $name): string
    {
        $name = trim(str_replace("\u{FEFF}", '', $name));
        $key = trim((string) preg_replace('/[^a-z0-9]+/', '_', strtolower($name)), '_');

        return match ($key) {
            'symbol', 'symbol_no', 'symbol_number', 'roll', 'roll_no', 'roll_number' => 'symbol_number',
            'name', 'student', 'student_name' => 'student_name',
            'dob', 'birth_date', 'date_of_birth' => 'date_of_birth',
            'grade', 'class', 'class_section' => 'class',
            'gpa', 'cgpa', 'gpa_total' => 'gpa',
            'result', 'status', 'remarks' => 'result',
            default => $name,
        };
    }
}
