import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)]">
      <div className="text-center space-y-6 max-w-2xl px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)]">
          Antigravity MCQ Engine
        </h1>
        <p className="text-xl text-[var(--color-text-muted)]">
          Professional examination platform with zero-error parsing fidelity.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/login" className="btn-primary text-lg px-8 py-3">
            Login
          </Link>
          <Link href="/signup" className="btn-secondary text-lg px-8 py-3 bg-white text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-gray-50">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
