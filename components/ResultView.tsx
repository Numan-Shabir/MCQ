'use client';

import clsx from 'clsx';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface Question {
    id: string;
    questionNumber: number;
    text: string;
    options: string;
    correctAnswer: string;
}

interface Attempt {
    score: number;
    total: number;
    answers: string; // JSON
}

interface ResultViewProps {
    questions: Question[];
    attempt: Attempt;
    examId: string;
}

export default function ResultView({ questions, attempt, examId }: ResultViewProps) {
    const userAnswers = JSON.parse(attempt.answers as string) as Record<string, string>;
    const percentage = Math.round((attempt.score / attempt.total) * 100);

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="card text-center space-y-4">
                    <h1 className="text-3xl font-bold text-[var(--color-primary)]">Exam Results</h1>
                    <div className="flex justify-center items-center gap-8 text-lg">
                        <div>
                            <span className="block text-gray-500 text-sm uppercase">Score</span>
                            <span className="font-bold text-4xl">{attempt.score} / {attempt.total}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500 text-sm uppercase">Percentage</span>
                            <span className={clsx("font-bold text-4xl", percentage >= 70 ? "text-green-600" : "text-red-600")}>
                                {percentage}%
                            </span>
                        </div>
                    </div>
                    <Link href="/dashboard" className="btn-secondary inline-block mt-4">
                        Return to Dashboard
                    </Link>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Detailed Review</h2>
                    {questions.map((q) => {
                        const options = JSON.parse(q.options) as string[];
                        const selectedKey = userAnswers[q.id];
                        const isCorrect = selectedKey && selectedKey.toUpperCase() === q.correctAnswer.toUpperCase();

                        return (
                            <div key={q.id} className={clsx("card border-l-4", isCorrect ? "border-l-green-500" : "border-l-red-500")}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="font-bold text-gray-500 mt-1">Q{q.questionNumber}</div>
                                    <div className="flex-1 text-lg font-medium">{q.text}</div>
                                    <div>
                                        {isCorrect ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                                    </div>
                                </div>

                                <div className="space-y-2 pl-8">
                                    {options.map((opt) => {
                                        const key = opt.split(')')[0].trim();
                                        const isSelectedOption = selectedKey === key;
                                        const isCorrectOption = q.correctAnswer.toUpperCase() === key.toUpperCase();

                                        let bgClass = "bg-gray-50 border-transparent";
                                        if (isCorrectOption) bgClass = "bg-green-100 border-green-300 text-green-900";
                                        if (isSelectedOption && !isCorrectOption) bgClass = "bg-red-100 border-red-300 text-red-900";

                                        return (
                                            <div key={opt} className={clsx("p-3 rounded border text-md", bgClass)}>
                                                {opt}
                                                {isCorrectOption && <span className="ml-2 text-xs font-bold uppercase text-green-700">(Correct Answer)</span>}
                                                {isSelectedOption && !isCorrectOption && <span className="ml-2 text-xs font-bold uppercase text-red-700">(Your Answer)</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
