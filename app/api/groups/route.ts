import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/groups
export async function GET(req: NextRequest) {
  try {
    // TODO: Add user auth/session and filter by user membership
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
    });
    return NextResponse.json({ groups });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups
export async function POST(req: NextRequest) {
  try {
    const { name, memberIds } = await req.json();
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'Missing group name or members' }, { status: 400 });
    }
    const group = await prisma.group.create({
      data: {
        name,
        members: {
          create: memberIds.map((userId: string, idx: number) => ({
            user: { connect: { id: userId } },
            role: idx === 0 ? 'admin' : 'member',
          })),
        },
      },
      include: { members: true },
    });
    return NextResponse.json({ group });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group', details: error }, { status: 500 });
  }
}
