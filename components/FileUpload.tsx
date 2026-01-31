'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export default function FileUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
    const router = useRouter();
    const [isDragOver, setIsDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (f: File) => {
        if (f.type !== 'application/pdf') {
            setError('Only PDF files are allowed.');
            setFile(null);
            return;
        }
        setError(null);
        setFile(f);
        setSuccess(null);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            setSuccess(`Successfully parsed ${data.count} questions.`);
            setFile(null);
            router.refresh();
            if (onUploadComplete) onUploadComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-4">
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={clsx(
                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer overflow-hidden",
                    isDragOver
                        ? "border-indigo-400 bg-indigo-500/10"
                        : "border-white/20 hover:border-indigo-400/50 hover:bg-white/5",
                    file ? "bg-indigo-500/5 border-indigo-500/30" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                />

                <div className="flex flex-col items-center gap-4 relative z-10">
                    <div className={clsx(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                        isDragOver ? "bg-indigo-500 text-white" : "bg-white/5 text-indigo-300"
                    )}>
                        <CloudUpload className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                        <p className="text-lg font-medium text-white">
                            {file ? file.name : 'Upload Exam PDF'}
                        </p>
                        <p className="text-sm text-slate-400">
                            {file ? 'Click to change file' : 'Drag & drop or click to browse'}
                        </p>
                    </div>
                </div>

                {/* Animated Background */}
                {isDragOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-indigo-500/10 z-0"
                    />
                )}
            </motion.div>

            <AnimatePresence>
                {file && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                        }}
                        disabled={uploading}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                    >
                        {uploading ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        {uploading ? 'Parsing PDF...' : 'Process Exam File'}
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-rose-300 bg-rose-500/10 p-4 rounded-xl border border-rose-500/20"
                    >
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-emerald-300 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20"
                    >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">{success}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
