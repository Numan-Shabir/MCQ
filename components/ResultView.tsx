'use client';

import clsx from 'clsx';
import { CheckCircle, XCircle, ArrowLeft, Award, Activity } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
        <div className="min-h-screen bg-[var(--color-background)] p-4 md:p-8 relative overflow-hidden">
            {/* Background ambiances */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 left-20 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 text-center space-y-6 border-white/10 bg-slate-900/50"
                >
                    <div className="flex justify-between items-center mb-8">
                        <Link href="/dashboard" className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-xl font-bold text-white uppercase tracking-widest opacity-80">Full Exam Results</h1>
                        <div className="w-24" /> {/* Spacer */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center py-6">
                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <Activity className="w-8 h-8 text-indigo-400 mb-2" />
                            <span className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Total Score</span>
                            <span className="font-black text-4xl text-white">{attempt.score} <span className="text-xl text-slate-500">/ {attempt.total}</span></span>
                        </div>

                        <div className="relative">
                            <div className="w-32 h-32 mx-auto rounded-full border-4 border-slate-700 flex items-center justify-center relative">
                                <span className={clsx("font-black text-4xl", percentage >= 70 ? "text-emerald-400" : "text-rose-400")}>
                                    {percentage}%
                                </span>
                                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50" cy="50" r="46"
                                        fill="none" stroke={percentage >= 70 ? "#34d399" : "#f43f5e"}
                                        strokeWidth="8"
                                        strokeDasharray={`${percentage * 2.89} 289`}
                                        strokeLinecap="round"
                                        className="drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                    />
                                </svg>
                            </div>
                            <div className="text-center mt-4 text-slate-300 font-medium">Performance Score</div>
                        </div>

                        <div className="flex flex-col items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <Award className="w-8 h-8 text-yellow-400 mb-2" />
                            <span className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-1">Status</span>
                            <span className={clsx("font-black text-2xl uppercase", percentage >= 70 ? "text-emerald-400" : "text-rose-400")}>
                                {percentage >= 70 ? "Passed" : "Needs Work"}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Activity className="text-indigo-400" />
                        Detailed Question Review
                    </h2>

                    {questions.map((q, idx) => {
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
                        const selectedKey = userAnswers[q.id];
                        const normalize = (s: string) => (s || '').replace(/,/g, '').split('').map(c => c.trim().toUpperCase()).sort().join('');
                        const isCorrect = normalize(selectedKey) === normalize(q.correctAnswer);

                        const selectedKeys = selectedKey ? (selectedKey.includes(',') ? selectedKey.split(',') : selectedKey.split('')).map(k => k.trim().toUpperCase()) : [];
                        const correctKeys = (q.correctAnswer.includes(',') ? q.correctAnswer.split(',') : q.correctAnswer.split('')).map(k => k.trim().toUpperCase());

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={q.id}
                                className={clsx(
                                    "glass-panel p-6 border-l-[6px] transition-all hover:bg-slate-800/40",
                                    isCorrect ? "border-l-emerald-500 bg-slate-900/30" : "border-l-rose-500 bg-slate-900/30"
                                )}
                            >
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="font-mono text-sm font-bold text-slate-500 mt-1 bg-white/5 px-2 py-1 rounded">Q{q.questionNumber}</div>
                                    <div className="flex-1 text-lg font-medium text-slate-200">{q.text}</div>
                                    <div className="shrink-0">
                                        {isCorrect ?
                                            <div className="bg-emerald-500/20 p-2 rounded-full"><CheckCircle className="text-emerald-500 w-6 h-6" /></div> :
                                            <div className="bg-rose-500/20 p-2 rounded-full"><XCircle className="text-rose-500 w-6 h-6" /></div>
                                        }
                                    </div>
                                </div>

                                <div className="space-y-3 pl-0 md:pl-12">
                                    {options.map((opt) => {
                                        const key = opt.split(')')[0].trim().toUpperCase();
                                        const isSelectedOption = selectedKeys.includes(key);
                                        const isCorrectOption = correctKeys.includes(key);

                                        let bgClass = "bg-white/5 border-transparent text-slate-400";
                                        if (isCorrectOption) bgClass = "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 font-medium";
                                        if (isSelectedOption && !isCorrectOption) bgClass = "bg-rose-500/20 border-rose-500/30 text-rose-300 font-medium";

                                        return (
                                            <div key={opt} className={clsx("p-4 rounded-xl border text-md flex flex-col md:flex-row justify-between items-start md:items-center gap-2 transition-colors", bgClass)}>
                                                <span>{opt}</span>
                                                {isCorrectOption && <span className="ml-2 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30">Correct Answer</span>}
                                                {isSelectedOption && !isCorrectOption && <span className="ml-2 text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 px-2 py-1 rounded border border-rose-500/30">Your Answer</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
