import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/groups/[id]/settlements
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id: groupId } = await context.params;
  try {
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
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}
