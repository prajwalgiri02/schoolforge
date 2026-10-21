<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamResult;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Lets students look up their published exam results.
 */
class ResultController extends Controller
{
    public function exams(): JsonResponse
    {
        return response()->json(Exam::query()->whereNotNull('published_at')->latest('published_at')->get(['id', 'name']));
    }

    /**
     * A marksheet, for a symbol number and the matching date of birth (when the
     * school imported dates of birth).
     */
    public function show(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exam' => ['required', 'integer'],
            'symbol' => ['required', 'string', 'max:40'],
            'dob' => ['nullable', 'string', 'max:20'],
        ]);

        $result = ExamResult::query()
            ->with('exam:id,name')
            ->where('exam_id', $validated['exam'])
            ->whereHas('exam', fn ($query) => $query->whereNotNull('published_at'))
            ->where('symbol_number', trim($validated['symbol']))
            ->first();

        if ($result === null || ($result->date_of_birth !== null && $result->date_of_birth !== ExamResult::normalizeDate($validated['dob'] ?? ''))) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'exam' => $result->exam->name,
            'symbolNumber' => $result->symbol_number,
            'studentName' => $result->student_name,
            'class' => $result->class,
            'gpa' => $result->gpa,
            'result' => $result->result,
            'subjects' => $result->subjects,
        ]);
    }
}
