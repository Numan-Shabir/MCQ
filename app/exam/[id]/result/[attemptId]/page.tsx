import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import ResultView from '@/components/ResultView';

const prisma = new PrismaClient();

async function getData(examId: string, attemptId: string, userId: string) {
    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
    });

    if (!attempt || attempt.userId !== userId) return null;

    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { questions: { orderBy: { questionNumber: 'asc' } } }
    });

    return { attempt, exam };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
    const session = await getSession();
    if (!session) redirect('/login');

    const { id, attemptId } = await params;
    const data = await getData(id, attemptId, session.id);
    if (!data?.exam || !data?.attempt) notFound();

    return (
        <ResultView
            questions={data.exam.questions as any}
            attempt={data.attempt}
            examId={data.exam.id}
        />
    );
}
