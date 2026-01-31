'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';
import { motion } from 'framer-motion';
import { LogOut, BookOpen, Clock, Activity, Shield, Atom, PlayCircle } from 'lucide-react';

interface DashboardClientProps {
    session: any;
    exams: any[];
    isAdmin: boolean;
}

export default function DashboardClient({ session, exams, isAdmin }: DashboardClientProps) {
    const [hoveredExam, setHoveredExam] = useState<string | null>(null);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] relative overflow-hidden">
            {/* Background ambiances */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

            <nav className="glass-panel m-4 px-6 py-4 flex justify-between items-center sticky top-4 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center">
                        <Atom className="text-white w-5 h-5" />
                    </div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
                        Antigravity MCQ
                    </h1>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-full border border-white/5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                            {session.name ? session.name[0].toUpperCase() : 'U'}
                        </div>
                        <span className="text-sm font-medium text-slate-200">{session.name}</span>
                        {isAdmin && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">ADMIN</span>}
                    </div>

                    <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-full">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">

                <header className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-bold text-white mb-2"
                    >
                        Dashboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[var(--color-text-muted)]"
                    >
                        Track your progress and take new exams.
                    </motion.p>
                </header>

                {isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6 border-indigo-500/30"
                    >
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-300">
                            <Shield className="w-5 h-5" /> Admin Panel
                        </h2>
                        <FileUpload />
                    </motion.div>
                )}

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-pink-400" />
                            Available Exams
                        </h2>
                    </div>

                    {exams.length === 0 ? (
                        <div className="glass-panel p-12 text-center">
                            <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg">No exams available at the moment.</p>
                            <p className="text-slate-500 text-sm">Check back later for new updates.</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {exams.map((exam: any) => (
                                <motion.div
                                    key={exam.id}
                                    variants={item}
                                    onHoverStart={() => setHoveredExam(exam.id)}
                                    onHoverEnd={() => setHoveredExam(null)}
                                    className="group relative glass-panel p-6 hover:bg-slate-800/60 transition-colors border border-white/5 hover:border-indigo-500/50"
                                >
                                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-indigo-500/10 p-3 rounded-xl">
                                            <Activity className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                                            ID: {exam.id.substring(0, 6)}...
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                                        {exam.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                                        <div className="flex items-center gap-1">
                                            <PlayCircle className="w-4 h-4" />
                                            <span>{exam._count.questions} Questions</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/exam/${exam.id}`}
                                        className="w-full btn-primary group-hover:shadow-indigo-500/25 justify-between"
                                    >
                                        Start Exam
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}

function ArrowRightIcon(props: any) {
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
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
