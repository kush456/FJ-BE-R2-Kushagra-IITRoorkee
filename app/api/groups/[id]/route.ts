import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/groups/[id] - Get group details
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify user is a member of this group
    const groupMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: user.id } }
    });

    if (!groupMember) {
      return NextResponse.json({ error: 'Access denied - not a group member' }, { status: 403 });
    }

    // Get group details with members and expense count
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          },
          orderBy: { joinedAt: 'asc' }
        },
        _count: {
          select: { expenses: true }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group details:', error);
    return NextResponse.json({ error: 'Failed to fetch group details', details: error }, { status: 500 });
  }
}