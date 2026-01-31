'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children?: ReactNode;
    primaryAction?: {
        label: string;
        onClick: () => void;
        variant?: 'danger' | 'primary' | 'success';
        loading?: boolean;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export default function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    primaryAction,
    secondaryAction
}: ModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 transition-opacity"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-slate-800/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full max-w-md pointer-events-auto overflow-hidden ring-1 ring-white/5"
                        >
                            {/* Header */}
                            <div className="px-6 py-5 border-b border-white/5 flex justify-between items-start bg-gradient-to-r from-white/5 to-transparent">
                                <div>
                                    <h3 className="text-xl font-bold text-white leading-6">{title}</h3>
                                    {description && (
                                        <p className="mt-2 text-sm text-slate-400 leading-relaxed">{description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg -mr-2 -mt-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            {children && (
                                <div className="p-6 text-slate-300">
                                    {children}
                                </div>
                            )}

                            {/* Footer */}
                            {(primaryAction || secondaryAction) && (
                                <div className="px-6 py-4 bg-slate-900/50 border-t border-white/5 flex justify-end gap-3 rounded-b-2xl">
                                    {secondaryAction && (
                                        <button
                                            onClick={secondaryAction.onClick}
                                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10 transition-all active:scale-95"
                                        >
                                            {secondaryAction.label}
                                        </button>
                                    )}
                                    {primaryAction && (
                                        <button
                                            onClick={primaryAction.onClick}
                                            disabled={primaryAction.loading}
                                            className={clsx(
                                                "px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2",
                                                primaryAction.variant === 'danger'
                                                    ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-500/20"
                                                    : primaryAction.variant === 'success'
                                                        ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/20"
                                                        : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-500/20",
                                                primaryAction.loading && "opacity-70 cursor-wait"
                                            )}
                                        >
                                            {primaryAction.loading && (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            )}
                                            {primaryAction.label}
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
