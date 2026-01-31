import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parsePDFStrict } from '@/lib/parser';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await parsePDFStrict(buffer);

        if (!result.success) {
            console.error('PDF Validation Error:', result.error);
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Create Exam
        const exam = await prisma.exam.create({
            data: {
                title: file.name.replace('.pdf', ''),
                description: `Imported from ${file.name}`,
                questions: {
                    create: result.questions.map(q => ({
                        questionNumber: q.questionNumber,
                        text: q.text,
                        options: JSON.stringify(q.options),
                        correctAnswer: q.correctAnswer
                    }))
                }
            }
        });

        return NextResponse.json({ success: true, count: result.questions.length, examId: exam.id });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
