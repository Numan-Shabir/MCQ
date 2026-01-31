'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
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
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl w-full max-w-md pointer-events-auto overflow-hidden ring-1 ring-black/5"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-white/50 to-transparent">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 leading-6">{title}</h3>
                                    {description && (
                                        <p className="mt-1 text-sm text-gray-500">{description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-black/5 rounded-lg -mr-2 -mt-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                {children}
                            </div>

                            {/* Footer */}
                            {(primaryAction || secondaryAction) && (
                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                                    {secondaryAction && (
                                        <button
                                            onClick={secondaryAction.onClick}
                                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all active:scale-95"
                                        >
                                            {secondaryAction.label}
                                        </button>
                                    )}
                                    {primaryAction && (
                                        <button
                                            onClick={primaryAction.onClick}
                                            disabled={primaryAction.loading}
                                            className={clsx(
                                                "px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2",
                                                primaryAction.variant === 'danger'
                                                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                                    : primaryAction.variant === 'success'
                                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                                        : "bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 shadow-blue-900/20",
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
