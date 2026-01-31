import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import ExamRunner from '@/components/ExamRunner';

const prisma = new PrismaClient();

async function getExamData(id: string) {
    const exam = await prisma.exam.findUnique({
        where: { id },
        include: { questions: { orderBy: { questionNumber: 'asc' } } }
    });
    return exam;
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) redirect('/login');

    const { id } = await params;
    const exam = await getExamData(id);
    if (!exam) notFound();

    return (
        <ExamRunner
            examId={exam.id}
            questions={exam.questions as any} // Cast safely or define proper types
            title={exam.title}
        />
    );
}
