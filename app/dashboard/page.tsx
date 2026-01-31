import { PrismaClient } from '@prisma/client';
import { getSession, logout } from '@/lib/auth'; // Ensure this path is correct if imported in server component context
import { redirect } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';

const prisma = new PrismaClient();

async function getExams() {
    return await prisma.exam.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true } } }
    });
}

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const exams = await getExams();
    const isAdmin = session.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            <nav className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-[var(--color-primary)]">Dashboard</h1>
                <div className="flex gap-4 items-center">
                    <span>Welcome, {session.name as string}</span>
                    <form action="/api/auth/logout" method="POST">
                        <button type="submit" className="text-red-600 hover:text-red-800 text-sm">Logout</button>
                    </form>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-8 space-y-8">

                {isAdmin && (
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4 text-[var(--color-primary)]">Upload New Exam</h2>
                        <FileUpload />
                        {/* Note: In a real app we'd trigger a router.refresh() from client here. passed as prop logic is simplistic here */}
                    </div>
                )}

                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Available Exams</h2>
                    {exams.length === 0 ? (
                        <p className="text-gray-500">No exams available yet.</p>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {exams.map((exam: any) => (
                                <div key={exam.id} className="card hover:shadow-lg transition-shadow">
                                    <h3 className="text-lg font-bold mb-2">{exam.title}</h3>
                                    <p className="text-sm text-[var(--color-text-muted)] mb-4">{exam._count.questions} Questions</p>
                                    <Link href={`/exam/${exam.id}`} className="btn-secondary inline-block">
                                        Start Exam
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
