'use client';

import clsx from 'clsx';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Award, AlertTriangle } from 'lucide-react';
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
    const normalize = (s: string) => (s || '').replace(/,/g, '').split('').map(c => c.trim().toUpperCase()).sort().join('');
    const percentage = Math.round((score / total) * 100);
    const wrongAnswers = questions.filter(q => {
        const selected = answers[q.id];
        return !selected || normalize(selected) !== normalize(q.correctAnswer);
    });

    return (
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8 flex flex-col items-center justify-center relative overflow-x-hidden">
            {/* Background ambiances */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full space-y-8 relative z-10"
            >
                {/* Score Card */}
                <div className="glass-panel p-8 text-center space-y-6 relative overflow-hidden bg-slate-900/50 border-white/10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500" />

                    <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                        <Award className="w-10 h-10 text-white" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Segment Complete</h2>
                    <p className="text-[var(--color-text-muted)]">You've completed this batch of questions. Let's review before moving on.</p>

                    <div className="flex justify-center items-center gap-8 md:gap-16 py-6">
                        <div className="text-center">
                            <span className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Score</span>
                            <span className="text-5xl font-black text-white">{score}<span className="text-2xl text-slate-500 font-medium">/{total}</span></span>
                        </div>
                        <div className="w-px h-16 bg-white/10" />
                        <div className="text-center">
                            <span className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Accuracy</span>
                            <span className={clsx("text-5xl font-black", percentage >= 70 ? "text-emerald-400" : "text-rose-400")}>
                                {percentage}%
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onContinue}
                        className="btn-primary w-full md:w-auto text-lg px-10 py-4 shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 mx-auto"
                    >
                        Continue to Next Segment <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>

                {/* Wrong Answers Review */}
                {wrongAnswers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                            <AlertTriangle className="text-amber-400" />
                            Review Mistakes ({wrongAnswers.length})
                        </h3>

                        <div className="grid gap-4">
                            {wrongAnswers.map((q, idx) => {
                                const rawOptions = JSON.parse(q.options);
                                const options: string[] = [];

                                if (rawOptions.statement_options && rawOptions.selection_options) {
                                    Object.entries(rawOptions.selection_options).forEach(([key, text]) => {
                                        options.push(`${key}) ${text}`);
                                    });
                                    options.sort();
                                } else if (Array.isArray(rawOptions)) {
                                    rawOptions.forEach((opt: string) => {
                                        const parts = opt.split(/\s+[•]\s+(?=[A-H][.)]\s)/);
                                        parts.forEach(part => {
                                            const normalized = part.replace(/^([A-H])\.\s/, '$1) ');
                                            options.push(normalized);
                                        });
                                    });
                                } else {
                                    Object.entries(rawOptions).forEach(([key, text]) => {
                                        options.push(`${key}) ${text}`);
                                    });
                                    options.sort();
                                }
                                const selectedKey = answers[q.id];

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 + 0.3 }}
                                        key={q.id}
                                        className="glass-panel p-6 border-l-[6px] border-l-rose-500 hover:bg-slate-800/60 transition-colors bg-slate-900/40"
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <span className="font-mono text-sm font-bold text-slate-500 mt-1">Q{q.questionNumber}</span>
                                            <p className="font-medium text-lg text-slate-200">{q.text}</p>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Show Selected (Wrong) */}
                                            {selectedKey && (
                                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 flex flex-col md:flex-row md:items-center gap-3">
                                                    <div className="flex items-start md:items-center gap-3 flex-1">
                                                        <XCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5 md:mt-0" />
                                                        <span className="font-bold w-6 shrink-0 bg-rose-500/20 text-center rounded">{normalize(selectedKey)}</span>
                                                        <span className="flex-1 opacity-90 whitespace-normal">
                                                            {(() => {
                                                                const keys = (selectedKey.includes(',') ? selectedKey.split(',') : selectedKey.split('')).map(k => k.trim());
                                                                const texts = keys.map(k => {
                                                                    const opt = options.find(o => o.startsWith(k + ')'));
                                                                    return opt ? opt.substring(opt.indexOf(')') + 1).replace(/Most Voted/gi, '').replace(/[•.]\s*$/, '').trim() : '';
                                                                }).filter(Boolean);
                                                                return texts.length > 0 ? texts.join(', ') : 'Unknown Option';
                                                            })()}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 px-2 py-1 rounded text-rose-200 self-start md:self-auto shrink-0">Your Answer</span>
                                                </div>
                                            )}

                                            {/* Show Correct */}
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 flex flex-col md:flex-row md:items-center gap-3">
                                                <div className="flex items-start md:items-center gap-3 flex-1">
                                                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5 md:mt-0" />
                                                    <span className="font-bold w-6 shrink-0 bg-emerald-500/20 text-center rounded">{normalize(q.correctAnswer)}</span>
                                                    <span className="flex-1 opacity-90 whitespace-normal">
                                                        {(() => {
                                                            const keys = (q.correctAnswer.includes(',') ? q.correctAnswer.split(',') : q.correctAnswer.split('')).map(k => k.trim());
                                                            const texts = keys.map(k => {
                                                                const opt = options.find(o => o.startsWith(k + ')'));
                                                                return opt ? opt.substring(opt.indexOf(')') + 1).replace(/Most Voted/gi, '').replace(/[•.]\s*$/, '').trim() : '';
                                                            }).filter(Boolean);
                                                            return texts.length > 0 ? texts.join(', ') : 'Unknown Option';
                                                        })()}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 px-2 py-1 rounded text-emerald-200 self-start md:self-auto shrink-0">Correct Answer</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
