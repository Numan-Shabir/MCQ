'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            router.push('/dashboard');
            router.refresh();
        } else {
            setError(data.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
            <div className="card w-full max-w-md">
                <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6 text-center">Login to Antigravity MCQ</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none"
                            required
                        />
                    </div>

                    <button type="submit" className="w-full btn-primary mt-4">
                        Sign In
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
                    Don't have an account? <Link href="/signup" className="text-[var(--color-primary)] hover:underline">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
