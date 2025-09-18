import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/expenses/[id] - Get expense details with participants and settlements
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

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        payer: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } },
        settlements: {
          include: {
            fromUser: { select: { id: true, name: true, email: true } },
            toUser: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = expense.participants.some(p => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expense details', details: error }, { status: 500 });
  }
}