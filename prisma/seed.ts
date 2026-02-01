import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    // Create Student
    const student = await prisma.user.upsert({
        where: { email: 'student@example.com' },
        update: {},
        create: {
            email: 'student@example.com',
            name: 'Student User',
            password: hashedPassword,
            role: 'STUDENT',
        },
    });

    console.log({ admin, student });

    // Helper function to upsert Exam (since title isn't unique in schema)
    async function upsertExam(title: string, description: string) {
        const existingExam = await prisma.exam.findFirst({
            where: { title: title }
        });

        if (existingExam) {
            console.log(`Exam "${title}" already exists. Updating...`);
            return prisma.exam.update({
                where: { id: existingExam.id },
                data: { description }
            });
        } else {
            console.log(`Creating Exam "${title}"...`);
            return prisma.exam.create({
                data: { title, description }
            });
        }
    }

    // Helper function to upsert Question
    async function upsertQuestion(examId: string, q: any) {
        const existingQuestion = await prisma.question.findFirst({
            where: {
                examId: examId,
                questionNumber: q.question_number
            }
        });

        const questionData = {
            examId: examId,
            questionNumber: q.question_number,
            text: q.question,
            options: JSON.stringify(q.options || {
                statement_options: q.statement_options,
                selection_options: q.selection_options
            }),
            correctAnswer: q.answer,
        };

        if (existingQuestion) {
            // update if needed
            return prisma.question.update({
                where: { id: existingQuestion.id },
                data: questionData
            });
        } else {
            return prisma.question.create({
                data: questionData
            });
        }
    }

    // Seed Questions
    // 1. Create/Update Exam 1
    const exam = await upsertExam('Certified Application Developer', 'Practice Exam for CAD Certification');

    // 2. Read chunks for Exam 1
    const chunkFiles = ['questions_chunk_1.json', 'questions_chunk_2.json', 'questions_chunk_3.json', 'questions_chunk_4.json'];
    let allQuestions: any[] = [];

    for (const file of chunkFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const questions = JSON.parse(content);
            allQuestions = [...allQuestions, ...questions];
        }
    }

    // 3. Insert/Update Questions for Exam 1
    console.log(`Processing ${allQuestions.length} questions for exam: ${exam.title}...`);
    for (const q of allQuestions) {
        await upsertQuestion(exam.id, q);
    }
    console.log(`Finished processing questions for ${exam.title}`);


    // Seed CAD set 2
    const exam2 = await upsertExam('CAD set 2', 'Practice Exam Set 2 for CAD Certification');

    const set2ChunkFiles = ['questions_cad_set_2_chunk_1.json', 'questions_cad_set_2_chunk_2.json', 'questions_cad_set_2_chunk_3.json', 'questions_cad_set_2_chunk_4.json', 'questions_cad_set_2_chunk_5.json'];
    let allQuestionsSet2: any[] = [];

    for (const file of set2ChunkFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const questions = JSON.parse(content);
            allQuestionsSet2 = [...allQuestionsSet2, ...questions];
        }
    }

    if (allQuestionsSet2.length > 0) {
        console.log(`Processing ${allQuestionsSet2.length} questions for exam: ${exam2.title}...`);
        for (const q of allQuestionsSet2) {
            await upsertQuestion(exam2.id, q);
        }
        console.log(`Finished processing questions for ${exam2.title}`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
