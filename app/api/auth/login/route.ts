import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { login } from '@/lib/auth';

const prisma = new PrismaClient();

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = loginSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await login({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        });

        return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
    }
}
