'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Flag, Clock, ChevronLeft, ChevronRight, Save, Menu, X, AlertOctagon, HelpCircle, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import SegmentResult from './SegmentResult';
import Modal from './ui/Modal';

interface Question {
    id: string;
    questionNumber: number;
    text: string;
    options: string; // JSON string
    correctAnswer: string;
}

interface ExamRunnerProps {
    examId: string;
    questions: Question[];
    title: string;
}

const SEGMENT_SIZE = 50;

export default function ExamRunner({ examId, questions, title }: ExamRunnerProps) {
    const router = useRouter();

    // Global State
    const [hasStarted, setHasStarted] = useState(false);

    // Exam State
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> selectedOptionKey (A, B...)
    const [marked, setMarked] = useState<Record<string, boolean>>({});
    const [timeLeft, setTimeLeft] = useState(questions.length * 2 * 60); // 2 mins per question default
    const [submitting, setSubmitting] = useState(false);

    // Segmentation State
    const [segmentIndex, setSegmentIndex] = useState(0);
    const [showSegmentResult, setShowSegmentResult] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        primaryAction?: { label: string; onClick: () => void; variant?: 'danger' | 'primary' | 'success'; loading?: boolean };
        secondaryAction?: { label: string; onClick: () => void };
    }>({ isOpen: false, title: '', description: '' });

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    // Derived State
    const totalSegments = Math.ceil(questions.length / SEGMENT_SIZE);
    // When not started, default to segment 0 params to avoid errors, but we won't render questions yet
    const currentSegmentStart = segmentIndex * SEGMENT_SIZE;
    const currentSegmentEnd = Math.min((segmentIndex + 1) * SEGMENT_SIZE, questions.length);
    const currentSegmentQuestions = questions.slice(currentSegmentStart, currentSegmentEnd);

    // Current Question within the global array
    const currentQuestion = questions[currentIdx];
    const isMultiSelect = currentQuestion?.text.match(/\(Choose (two|three|four|all).*?\)/i) || currentQuestion?.text.match(/Select (all|two|three|four)/i) || (currentQuestion?.correctAnswer?.length > 1 && !currentQuestion?.correctAnswer?.includes(','));

    // Only parse options if we have a valid currentQuestion (safe guard for edge cases)
    const rawOptions = currentQuestion ? JSON.parse(currentQuestion.options) : [];
    const options: string[] = [];
    let statements: Record<string, string> | null = null;

    if (rawOptions.statement_options && rawOptions.selection_options) {
        statements = rawOptions.statement_options;
        Object.entries(rawOptions.selection_options).forEach(([key, text]) => {
            options.push(`${key}) ${text}`);
        });
        options.sort();
    } else if (Array.isArray(rawOptions)) {
        rawOptions.forEach((opt: string) => {
            const parts = opt.split(/\s+[•]\s+(?=[A-H][.)]\s)/);
            parts.forEach((part: string) => {
                const normalized = part.replace(/^([A-H])\.\s/, '$1) ');
                options.push(normalized);
            });
        });
    } else {
        // Handle Object format { A: "Text", B: "Text" }
        Object.entries(rawOptions).forEach(([key, text]) => {
            options.push(`${key}) ${text}`);
        });
        options.sort(); // Ensure A, B, C order
    }

    useEffect(() => {
        if (!hasStarted) return; // Don't run timer if not started

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [hasStarted]); // Add dependency

    const handleStartSegment = (index: number) => {
        setSegmentIndex(index);
        setCurrentIdx(index * SEGMENT_SIZE);
        setTimeLeft(50 * 60); // 50 minutes per segment
        setHasStarted(true);
        window.scrollTo(0, 0);
    };

    const handleSelect = (option: string) => {
        const key = option.split(')')[0].trim();
        const currentAns = answers[currentQuestion.id] || '';

        if (isMultiSelect) {
            let newAns: string[];
            if (currentAns) {
                const parts = currentAns.split(',');
                if (parts.includes(key)) {
                    newAns = parts.filter(p => p !== key);
                } else {
                    newAns = [...parts, key];
                }
            } else {
                newAns = [key];
            }
            // Sort to ensure consistency
            setAnswers((prev) => ({ ...prev, [currentQuestion.id]: newAns.sort().join(',') }));
        } else {
            setAnswers((prev) => ({ ...prev, [currentQuestion.id]: key }));
        }
    };

    const toggleMark = () => {
        setMarked((prev) => ({ ...prev, [currentQuestion.id]: !prev[currentQuestion.id] }));
    };

    const handleNext = () => {
        if (currentIdx + 1 < currentSegmentEnd) {
            setCurrentIdx(prev => prev + 1);
        } else {
            // End of segment reached
            setShowSegmentResult(true);
        }
    };

    const handlePrevious = () => {
        if (currentIdx > currentSegmentStart) {
            setCurrentIdx(prev => prev - 1);
        }
    };

    const handleContinueSegment = () => {
        const nextSeg = segmentIndex + 1;
        setSegmentIndex(nextSeg);
        setCurrentIdx(nextSeg * SEGMENT_SIZE);
        setTimeLeft(50 * 60); // Reset to 50 minutes for new segment
        setShowSegmentResult(false);
        window.scrollTo(0, 0);
    };

    const handleSubmit = async () => {
        if (submitting) return;

        setModalConfig({
            isOpen: true,
            title: 'Finish Exam?',
            description: 'Are you sure you want to finish the exam? You cannot undo this action.',
            primaryAction: {
                label: 'Finish Exam',
                onClick: performSubmit,
                variant: 'success'
            },
            secondaryAction: {
                label: 'Cancel',
                onClick: closeModal
            }
        });
    };

    const performSubmit = async () => {
        setSubmitting(true);
        // Show loading state in modal if needed, or just proceed
        // Ideally update modal config to show loading on primary button
        setModalConfig(prev => ({
            ...prev,
            primaryAction: { ...prev.primaryAction!, loading: true }
        }));

        try {
            const res = await fetch(`/api/exam/${examId}/submit`, {
                method: 'POST',
                body: JSON.stringify({ answers }),
            });
            const data = await res.json();
            if (data.attemptId) {
                router.push(`/exam/${examId}/result/${data.attemptId}`);
            }
        } catch (e) {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                description: 'Failed to submit exam. Please check your connection and try again.',
                primaryAction: { label: 'Close', onClick: closeModal, variant: 'danger' }
            });
            setSubmitting(false);
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isAnswered = (qId: string) => !!answers[qId];
    const isMarked = (qId: string) => !!marked[qId];

    const calculateSegmentScore = () => {
        let score = 0;
        currentSegmentQuestions.forEach(q => {
            const selected = answers[q.id];
            if (selected) {
                const normalize = (s: string) => (s || '').replace(/,/g, '').split('').map(c => c.trim().toUpperCase()).sort().join('');

                // Normalize correct answer
                // If correctAnswer is "AD", split chars. If "A,D", split comma.
                let correct = q.correctAnswer || "";

                if (normalize(selected) === normalize(correct)) {
                    score++;
                }
            }
        });
        return score;
    };

    // VIEW: Segment Selection
    if (!hasStarted) {
        return (
            <div className="flex flex-col min-h-screen bg-[var(--color-background)] font-sans text-white overflow-hidden relative">

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[100px]" />
                </div>

                <header className="glass-panel z-20 px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg mx-4 md:mx-6 mt-6 rounded-2xl border-white/10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                    </div>
                    <div className="text-sm font-medium text-[var(--color-text-muted)] w-full md:w-[400px] text-center md:text-right">
                        Select a segment to begin. Your progress is saved per segment.
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 z-10 scrollbar-hide">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: totalSegments }).map((_, idx) => {
                            const startQ = idx * SEGMENT_SIZE + 1;
                            const endQ = Math.min((idx + 1) * SEGMENT_SIZE, questions.length);

                            return (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="glass-panel p-6 cursor-pointer group hover:bg-white/5 transition-all border border-white/5 hover:border-indigo-500/50"
                                    onClick={() => handleStartSegment(idx)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <span className="text-xl font-bold">{idx + 1}</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider border border-white/5">
                                            50 Questions
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Segment {idx + 1}
                                    </h3>
                                    <p className="text-[var(--color-text-muted)] text-sm mb-6">
                                        Questions {startQ} - {endQ}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm font-bold text-indigo-400 group-hover:translate-x-1 transition-transform">
                                        Start Exam <ChevronRight className="w-4 h-4" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </main>
            </div>
        );
    }

    if (showSegmentResult) {
        return (
            <SegmentResult
                questions={currentSegmentQuestions}
                answers={answers}
                score={calculateSegmentScore()}
                total={currentSegmentQuestions.length}
                onContinue={segmentIndex + 1 < totalSegments ? handleContinueSegment : handleSubmit}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-background)] font-sans text-white">
            {/* Top Bar */}
            <header className="glass-panel rounded-none border-x-0 border-t-0 z-20 px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-md relative border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
                        {sidebarOpen ? <X /> : <Menu />}
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white truncate max-w-[200px] md:max-w-md">{title}</h1>
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
                            <span className="bg-white/5 px-2 py-0.5 rounded">Segment {segmentIndex + 1}</span>
                            <span>•</span>
                            <span>Q {currentIdx + 1} of {questions.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4 md:gap-6 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-lg font-mono bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-indigo-400 shadow-inner">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <span className="font-bold tracking-widest">{formatTime(timeLeft)}</span>
                    </div>

                    <button
                        onClick={() => {
                            setModalConfig({
                                isOpen: true,
                                title: 'Exit Exam?',
                                description: 'Are you sure you want to exit? Your progress in this segment will be lost.',
                                primaryAction: {
                                    label: 'Exit',
                                    onClick: () => router.push('/dashboard'),
                                    variant: 'danger'
                                },
                                secondaryAction: {
                                    label: 'Cancel',
                                    onClick: closeModal
                                }
                            });
                        }}
                        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-2 rounded-lg transition-all border border-red-500/20"
                        title="Exit Exam"
                    >
                        <LogOutIcon className="w-5 h-5" />
                    </button>

                    {/* Only show Finish Exam if on last question of last segment or explicitly needed */}
                    {segmentIndex === totalSegments - 1 && (
                        <button
                            onClick={handleSubmit}
                            className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-600/30 transition-all text-sm font-bold flex items-center gap-2"
                            disabled={submitting}
                        >
                            <Save className="w-4 h-4" />
                            <span className="hidden md:inline">Finish</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Navigation */}
                <aside className={clsx(
                    "absolute md:relative z-10 w-72 h-full bg-[#1e293b]/90 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 md:translate-x-0 flex flex-col shadow-2xl",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="p-4 border-b border-white/5">
                        <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4" /> Navigator
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <div className="grid grid-cols-5 gap-2">
                            {currentSegmentQuestions.map((q, idx) => {
                                const globalIdx = currentSegmentStart + idx;
                                const isActive = currentIdx === globalIdx;
                                const answered = isAnswered(q.id);
                                const markedQ = isMarked(q.id);

                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            setCurrentIdx(globalIdx);
                                            setSidebarOpen(false);
                                        }}
                                        className={clsx(
                                            "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden",
                                            isActive ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 scale-110 z-10 bg-indigo-600 text-white" : "hover:scale-105",
                                            !isActive && answered ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" :
                                                !isActive && !answered ? "bg-slate-800 text-slate-500 border border-white/5" : ""
                                        )}
                                    >
                                        {q.questionNumber}
                                        {markedQ && (
                                            <div className="absolute top-0 right-0 p-0.5 bg-yellow-500/20 text-yellow-500 rounded-bl-md">
                                                <Flag className="w-2 h-2 fill-current" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-black/20 border-t border-white/5 text-xs space-y-2">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500/20 border border-indigo-500/30 rounded-full"></div> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30 rounded-full"></div> Marked</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-800 border border-white/10 rounded-full"></div> Not Visited</div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-slate-900/50">
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="max-w-4xl mx-auto pb-32 relative z-10">
                        {/* Question Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1 block">Question {currentQuestion.questionNumber}</span>
                                <h2 className="text-xl md:text-2xl font-bold text-white">
                                    {/* Could trim text if too long, or just let it wrap */}
                                </h2>
                            </div>
                            <button
                                onClick={toggleMark}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all",
                                    marked[currentQuestion.id]
                                        ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
                                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                                )}
                            >
                                <Flag className={clsx("w-4 h-4", marked[currentQuestion.id] && "fill-current")} />
                                {marked[currentQuestion.id] ? 'Marked' : 'Mark'}
                            </button>
                        </div>

                        {/* Question Card */}
                        <div className="glass-panel p-6 md:p-10 mb-8 min-h-[160px] flex items-center border-white/10 bg-slate-800/40">
                            <p className="text-lg md:text-xl leading-relaxed font-medium text-slate-200 whitespace-pre-wrap">
                                {currentQuestion.text}
                            </p>
                        </div>

                        {/* Statements (if applicable) */}
                        {statements && (
                            <div className="mb-6 space-y-2">
                                {Object.entries(statements).map(([key, text]) => (
                                    <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/5 text-slate-300 flex overflow-hidden">
                                        <span className="font-bold text-indigo-400 mr-3 uppercase shrink-0 bg-indigo-500/10 px-2 rounded h-fit">{key}</span>
                                        <span className="text-sm md:text-base">{text as string}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Options */}
                        <div className="grid gap-3">
                            {options.map((opt) => {
                                const key = opt.split(')')[0].trim();
                                const currentAns = answers[currentQuestion.id] || '';
                                const isSelected = currentAns.split(',').includes(key);

                                return (
                                    <motion.div
                                        whileHover={{ scale: 1.005 }}
                                        whileTap={{ scale: 0.995 }}
                                        key={opt}
                                        onClick={() => handleSelect(opt)}
                                        className={clsx(
                                            "group p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col md:flex-row items-start md:items-center gap-4 relative overflow-hidden",
                                            isSelected
                                                ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                                                : "border-transparent bg-white/5 shadow-sm hover:border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-indigo-500 text-white shadow-sm"
                                                : "bg-slate-700 text-slate-400 group-hover:bg-slate-600 group-hover:text-white"
                                        )}>
                                            {key}
                                        </div>
                                        <span className={clsx(
                                            "text-lg",
                                            isSelected ? "text-white font-semibold" : "text-slate-300"
                                        )}>
                                            {opt.substring(opt.indexOf(')') + 1).replace(/Most Voted/gi, '').replace(/[•.]\s*$/, '').trim()}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </main>

                {/* Footer Navigation (Floating) */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-2xl border border-white/10 z-30 w-[95%] md:w-auto">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIdx === currentSegmentStart}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm font-bold text-slate-400 w-24 text-center">
                        {currentIdx + 1} / {questions.length}
                    </span>

                    <button
                        onClick={handleNext}
                        className="btn-primary rounded-full px-6 py-2.5 flex items-center gap-2 pl-4 shadow-lg shadow-indigo-500/20"
                    >
                        {currentIdx + 1 === currentSegmentEnd ? (segmentIndex === totalSegments - 1 ? 'Finish' : 'Complete Segment') : 'Next'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <Modal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                description={modalConfig.description}
                primaryAction={modalConfig.primaryAction}
                secondaryAction={modalConfig.secondaryAction}
            />
        </div >
    );
}

function LogOutIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    )
}
