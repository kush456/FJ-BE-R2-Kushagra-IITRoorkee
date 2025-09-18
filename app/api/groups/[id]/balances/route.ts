import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/groups/[id]/balances
export async function GET(req: NextRequest, {params}: {params: Promise<{ id: string }>}) {
  const { id: groupId } = await params;
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

    const balances = await prisma.groupBalance.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ balances });
  } catch (error) {
    console.error('Error fetching group balances:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
