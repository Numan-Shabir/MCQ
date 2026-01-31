'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Flag, Clock, ChevronLeft, ChevronRight, Save, Menu, X } from 'lucide-react';
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

    // Only parse options if we have a valid currentQuestion (safe guard for edge cases)
    const rawOptions = currentQuestion ? JSON.parse(currentQuestion.options) as string[] : [];
    const options: string[] = [];
    rawOptions.forEach(opt => {
        const parts = opt.split(/\s+[•]\s+(?=[A-H][.)]\s)/);
        parts.forEach(part => {
            const normalized = part.replace(/^([A-H])\.\s/, '$1) ');
            options.push(normalized);
        });
    });

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
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: key }));
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
            if (selected && selected.toUpperCase() === q.correctAnswer.toUpperCase()) {
                score++;
            }
        });
        return score;
    };

    // VIEW: Segment Selection
    if (!hasStarted) {
        return (
            <div className="flex flex-col min-h-screen bg-[var(--color-background)] font-sans text-[var(--color-text-main)] overflow-hidden relative">

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[var(--color-primary)]/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-[var(--color-secondary)]/5 rounded-full blur-3xl" />
                </div>

                <header className="glass-panel z-20 px-8 py-6 flex justify-between items-center shadow-lg mx-6 mt-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="p-2 hover:bg-black/5 rounded-lg transition-colors text-[var(--color-primary)]"
                            title="Back to Dashboard"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-[var(--color-primary)]">{title}</h1>
                    </div>
                    <div className="text-sm font-medium text-[var(--color-text-muted)]">
                        Select a segment to begin
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 z-10">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: totalSegments }).map((_, idx) => {
                            const startQ = idx * SEGMENT_SIZE + 1;
                            const endQ = Math.min((idx + 1) * SEGMENT_SIZE, questions.length);
                            const isCompleted = false; // Todo: Could track completed segments in future

                            return (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="glass-panel p-6 cursor-pointer group hover:bg-white/80 transition-all border border-white/20 hover:border-[var(--color-secondary)]/30"
                                    onClick={() => handleStartSegment(idx)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                                            <span className="text-xl font-bold">{idx + 1}</span>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            50 Questions
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
                                        Segment {idx + 1}
                                    </h3>
                                    <p className="text-[var(--color-text-muted)] text-sm mb-6">
                                        Questions {startQ} - {endQ}
                                    </p>

                                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-secondary)] group-hover:translate-x-1 transition-transform">
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
        <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-background)] font-sans text-[var(--color-text-main)]">
            {/* Top Bar */}
            <header className="glass-panel rounded-none border-x-0 border-t-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm relative">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden p-2 hover:bg-black/5 rounded-lg">
                        {sidebarOpen ? <X /> : <Menu />}
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-[var(--color-primary)] truncate max-w-[200px] md:max-w-md">{title}</h1>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">Segment {segmentIndex + 1} of {totalSegments}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2 text-lg font-mono bg-white/50 border border-white/20 px-4 py-2 rounded-xl text-[var(--color-primary)] shadow-inner">
                        <Clock className="w-5 h-5 text-[var(--color-secondary)]" />
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
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-all border border-red-200"
                        title="Exit Exam"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                    </button>

                    {/* Only show Finish Exam if on last question of last segment or explicitly needed */}
                    {segmentIndex === totalSegments - 1 && (
                        <button
                            onClick={handleSubmit}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all text-sm font-bold flex items-center gap-2"
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
                    "absolute md:relative z-10 w-72 h-full bg-[var(--glass-bg)] backdrop-blur-xl border-r border-[var(--color-border)] transform transition-transform duration-300 md:translate-x-0 flex flex-col",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="p-4 border-b border-[var(--color-border)]/50">
                        <h3 className="font-bold text-gray-500 text-xs uppercase tracking-widest">Question Navigator</h3>
                        <p className="text-xs text-gray-400 mt-1">Segment {segmentIndex + 1}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
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
                                            isActive ? "ring-2 ring-[var(--color-secondary)] ring-offset-2 scale-110 z-10" : "hover:scale-105",
                                            isActive && !answered && "bg-white text-[var(--color-primary)] border-2 border-[var(--color-secondary)]",
                                            !isActive && answered ? "bg-[var(--color-secondary)] text-white shadow-sm" :
                                                !isActive && !answered ? "bg-white text-gray-400 border border-gray-200" : ""
                                        )}
                                    >
                                        {q.questionNumber}
                                        {markedQ && (
                                            <div className="absolute top-0 right-0 p-0.5 bg-yellow-400 text-yellow-900 rounded-bl-md">
                                                <Flag className="w-2 h-2 fill-current" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-white/30 border-t border-[var(--color-border)]/50 text-xs space-y-2">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[var(--color-secondary)] rounded-full"></div> Answered</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 rounded-full"></div> Marked</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 bg-white border border-gray-300 rounded-full"></div> Not Visited</div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth">
                    <div className="max-w-4xl mx-auto pb-32">
                        {/* Question Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-sm font-bold text-[var(--color-secondary)] uppercase tracking-wider mb-1 block">Question {currentQuestion.questionNumber}</span>
                                <h2 className="text-xl md:text-2xl font-bold text-[var(--color-primary)]">
                                    {/* Could trim text if too long, or just let it wrap */}
                                </h2>
                            </div>
                            <button
                                onClick={toggleMark}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all",
                                    marked[currentQuestion.id]
                                        ? "bg-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm"
                                        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                <Flag className={clsx("w-4 h-4", marked[currentQuestion.id] && "fill-current")} />
                                {marked[currentQuestion.id] ? 'Marked' : 'Mark'}
                            </button>
                        </div>

                        {/* Question Card */}
                        <div className="glass-panel p-6 md:p-10 mb-8 min-h-[160px] flex items-center">
                            <p className="text-lg md:text-xl leading-relaxed font-medium text-[var(--color-text-main)] whitespace-pre-wrap">
                                {currentQuestion.text}
                            </p>
                        </div>

                        {/* Options */}
                        <div className="grid gap-3">
                            {options.map((opt) => {
                                const key = opt.split(')')[0].trim();
                                const isSelected = answers[currentQuestion.id] === key;

                                return (
                                    <motion.div
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        key={opt}
                                        onClick={() => handleSelect(opt)}
                                        className={clsx(
                                            "group p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 relative overflow-hidden",
                                            isSelected
                                                ? "border-[var(--color-secondary)] bg-sky-50 shadow-md"
                                                : "border-transparent bg-white shadow-sm hover:border-[var(--color-border)] hover:bg-gray-50"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-colors",
                                            isSelected
                                                ? "bg-[var(--color-secondary)] text-white shadow-sm"
                                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                                        )}>
                                            {key}
                                        </div>
                                        <span className={clsx(
                                            "text-lg",
                                            isSelected ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-text-main)]"
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
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white/50 z-30">
                    <button
                        onClick={handlePrevious}
                        disabled={currentIdx === currentSegmentStart}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <span className="text-sm font-bold text-gray-500 w-24 text-center">
                        {currentIdx + 1} / {questions.length}
                    </span>

                    <button
                        onClick={handleNext}
                        className="btn-primary rounded-full px-6 py-2.5 flex items-center gap-2 pl-4"
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
