import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/groups/[id]/settlements
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id: groupId } = await context.params;
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
      where: { groupId_userId: { groupId: groupId, userId: user.id } }
    });

    if (!groupMember) {
      return NextResponse.json({ error: 'Access denied - not a group member' }, { status: 403 });
    }

    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        fromUser: { select: { id: true, name: true, email: true } },
        toUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ settlements });
  } catch (error) {
    console.error('Error fetching group settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}
