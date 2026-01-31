import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import Link from 'next/link';
import { LogOut, BookOpen, Clock, BarChart, Settings, User, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const prisma = new PrismaClient();

async function getExams() {
    return await prisma.exam.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { questions: true } } }
    });
}

// Client wrapper for logout to handle Framer Motion if needed, but keeping it simple server-side for now
// We'll use a mix of server and client components pattern if we want full page transitions, 
// but for the dashboard content, we can just use standard HTML with our CSS classes for now,
// or we can make this a Client Component if we want heavy interactivity. 
// Given it's a dashboard, SSR is better for data fetching. 
// We will add a small client component for the animated list if we really want to, 
// but for now, let's use the premium CSS classes we added.
// ACTUALLY: To use framer-motion effectively for entrance animations, this should be a client component 
// OR we use a client wrapper. Let's use a Client Component wrapper for the list.

// Let's stick to Server Component for data and direct rendering, 
// and insert some animation classes or a client wrapper.
// To satisfy the "Next Level" UI request, I'll make the main content area a Client Component.

import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const exams = await getExams();
    const isAdmin = session.role === 'ADMIN';

    return <DashboardClient session={session} exams={exams} isAdmin={isAdmin} />;
}
