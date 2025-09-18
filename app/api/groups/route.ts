import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/groups
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get groups where user is a member
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: user.id }
        }
      },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/groups
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { name, memberIds } = await req.json();
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: 'Missing group name or members' }, { status: 400 });
    }

    // Ensure the current user is included in the group
    const allMemberIds = memberIds.includes(user.id) ? memberIds : [user.id, ...memberIds];

    const group = await prisma.group.create({
      data: {
        name,
        members: {
          create: allMemberIds.map((userId: string, idx: number) => ({
            user: { connect: { id: userId } },
            role: userId === user.id ? 'admin' : 'member',
          })),
        },
      },
      include: { members: true },
    });
    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group', details: error }, { status: 500 });
  }
}
