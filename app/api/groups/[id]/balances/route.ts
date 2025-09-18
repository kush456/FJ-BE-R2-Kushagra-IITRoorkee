import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/groups/[id]/balances
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id: groupId } = await context.params;
  try {
    const balances = await prisma.groupBalance.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ balances });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
