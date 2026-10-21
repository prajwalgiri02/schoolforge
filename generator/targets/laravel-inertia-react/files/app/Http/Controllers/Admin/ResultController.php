<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Support\ResultImporter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Import, publish and remove exam results.
 */
class ResultController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Results', [
            'exams' => Exam::query()->withCount('results')->latest()->get(),
        ]);
    }

    /**
     * Create an exam from an uploaded CSV, or replace an existing exam's results.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'exam_id' => ['nullable', 'integer', 'exists:exams,id'],
            'name' => ['required_without:exam_id', 'nullable', 'string', 'max:160'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        try {
            $count = DB::transaction(function () use ($validated, $request): int {
                $exam = isset($validated['exam_id']) ? Exam::query()->findOrFail($validated['exam_id']) : Exam::create(['name' => $validated['name']]);

                return ResultImporter::import($exam, $request->file('file')->getRealPath());
            });
        } catch (RuntimeException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        }

        return back()->with('success', "{$count} results imported. Publish the exam when you are ready.");
    }

    public function update(Exam $exam): RedirectResponse
    {
        $exam->update(['published_at' => $exam->published_at ? null : now()]);

        return back()->with('success', $exam->published_at ? "{$exam->name} results are now public." : "{$exam->name} results are hidden.");
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $exam->delete();

        return back()->with('success', 'Exam and its results deleted.');
    }

    /**
     * A sample spreadsheet showing the expected columns.
     */
    public function template(): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, ['symbol_number', 'student_name', 'date_of_birth', 'class', 'English', 'Nepali', 'Mathematics', 'Science', 'gpa', 'result'], escape: '\\');
            fputcsv($output, ['1001', 'Aarav Sharma', '2068-05-12', '10 A', 'A+', 'A', 'A+', 'B+', '3.75', 'Passed'], escape: '\\');
            fclose($output);
        }, 'results-template.csv', ['Content-Type' => 'text/csv']);
    }
}
