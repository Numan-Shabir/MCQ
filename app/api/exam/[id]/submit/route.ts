import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { answers } = await request.json(); // { questionId: 'A' }
        const { id: examId } = await params;

        // Fetch correct answers
        const questions = await prisma.question.findMany({
            where: { examId },
            select: { id: true, correctAnswer: true }
        });

        let score = 0;
        const total = questions.length;

        questions.forEach((q: any) => {
            const selected = answers[q.id];
            if (selected && selected.toUpperCase() === q.correctAnswer.toUpperCase()) {
                score++;
            }
        });

        // Create attempt
        const attempt = await prisma.attempt.create({
            data: {
                userId: session.id,
                examId,
                score,
                total,
                answers: JSON.stringify(answers),
            }
        });

        return NextResponse.json({ success: true, attemptId: attempt.id, score, total });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
