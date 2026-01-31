'use client';

import clsx from 'clsx';
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface Question {
    id: string;
    questionNumber: number;
    text: string;
    options: string;
    correctAnswer: string;
}

interface SegmentResultProps {
    questions: Question[];
    answers: Record<string, string>; // questionId -> selectedOptionKey
    onContinue: () => void;
    score: number;
    total: number;
}

export default function SegmentResult({ questions, answers, onContinue, score, total }: SegmentResultProps) {
    const percentage = Math.round((score / total) * 100);
    const wrongAnswers = questions.filter(q => {
        const selected = answers[q.id];
        return !selected || selected.toUpperCase() !== q.correctAnswer.toUpperCase();
    });

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8 flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full space-y-8"
            >
                {/* Score Card */}
                <div className="glass-panel p-8 text-center space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />

                    <h2 className="text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">Segment Complete</h2>
                    <p className="text-[var(--color-text-muted)]">You've completed this batch of questions. Let's review before moving on.</p>

                    <div className="flex justify-center items-center gap-12 py-6">
                        <div className="text-center">
                            <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Score</span>
                            <span className="text-5xl font-black text-[var(--color-text-main)]">{score}<span className="text-2xl text-gray-400 font-medium">/{total}</span></span>
                        </div>
                        <div className="w-px h-16 bg-gray-200" />
                        <div className="text-center">
                            <span className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Accuracy</span>
                            <span className={clsx("text-5xl font-black", percentage >= 70 ? "text-emerald-500" : "text-[var(--color-danger)]")}>
                                {percentage}%
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onContinue}
                        className="btn-primary w-full md:w-auto text-lg px-8 py-3 shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 transform hover:-translate-y-0.5"
                    >
                        Continue to Next Segment <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>

                {/* Wrong Answers Review */}
                {wrongAnswers.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-[var(--color-text-main)] flex items-center gap-2">
                            <XCircle className="text-[var(--color-danger)]" />
                            Review Mistakes ({wrongAnswers.length})
                        </h3>

                        <div className="grid gap-4">
                            {wrongAnswers.map((q, idx) => {
                                const rawOptions = JSON.parse(q.options) as string[];
                                const options: string[] = [];
                                rawOptions.forEach(opt => {
                                    const parts = opt.split(/\s+[•]\s+(?=[A-H][.)]\s)/);
                                    parts.forEach(part => {
                                        const normalized = part.replace(/^([A-H])\.\s/, '$1) ');
                                        options.push(normalized);
                                    });
                                });
                                const selectedKey = answers[q.id];

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={q.id}
                                        className="card border-l-[6px] border-l-[var(--color-danger)] hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex gap-4 mb-3">
                                            <span className="font-mono text-sm font-bold text-gray-400 mt-1">Q{q.questionNumber}</span>
                                            <p className="font-medium text-lg text-gray-800">{q.text}</p>
                                        </div>

                                        <div className="pl-10 space-y-2">
                                            {/* Show Selected (Wrong) */}
                                            {selectedKey && (
                                                <div className="p-3 bg-red-50 border border-red-100 rounded text-red-700 flex items-center gap-2">
                                                    <XCircle className="w-4 h-4 shrink-0" />
                                                    <span className="font-bold w-6 shrink-0">{selectedKey}</span>
                                                    <span className="truncate">
                                                        {options.find(o => o.startsWith(selectedKey))?.split(')')[1].replace(/Most Voted/gi, '').replace(/[•.]\s*$/, '').trim() || 'Unknown Option'}
                                                    </span>
                                                    <span className="ml-auto text-xs font-bold uppercase tracking-wider opacity-70">Your Answer</span>
                                                </div>
                                            )}

                                            {/* Show Correct */}
                                            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4 shrink-0" />
                                                <span className="font-bold w-6 shrink-0">{q.correctAnswer}</span>
                                                <span className="truncate">
                                                    {options.find(o => o.startsWith(q.correctAnswer))?.split(')')[1].replace(/Most Voted/gi, '').replace(/[•.]\s*$/, '').trim() || 'Unknown Option'}
                                                </span>
                                                <span className="ml-auto text-xs font-bold uppercase tracking-wider opacity-70">Correct Answer</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
