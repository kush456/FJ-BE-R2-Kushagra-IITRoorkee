import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET /api/groups/[id]/expenses - Get all expenses for a specific group
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

    // Get all expenses for this group
    const expenses = await prisma.expense.findMany({
      where: { groupId: params.id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        payer: { select: { id: true, name: true, email: true } },
        group: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch group expenses', details: error }, { status: 500 });
  }
}

// POST /api/groups/[id]/expenses - Create a new expense in this group
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { payerId, amount, description, splitType, participants } = await req.json();
    
    if (!payerId || !amount || !participants || participants.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate that payer is a group member
    const payerMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: params.id, userId: payerId } }
    });

    if (!payerMember) {
      return NextResponse.json({ error: 'Payer must be a group member' }, { status: 400 });
    }

    // Validate that all participants are group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: params.id },
      select: { userId: true }
    });
    
    const groupMemberIds = groupMembers.map(m => m.userId);
    const invalidParticipants = participants.filter((p: any) => !groupMemberIds.includes(p.userId));
    
    if (invalidParticipants.length > 0) {
      return NextResponse.json({ error: 'All participants must be group members' }, { status: 400 });
    }

    // Create the group expense
    const expense = await prisma.expense.create({
      data: {
        groupId: params.id,
        payerId,
        amount,
        description,
        splitType,
        participants: {
          create: participants.map((p: any) => ({
            userId: p.userId,
            paid: p.paid,
            share: p.share,
            netBalance: p.paid - p.share,
          })),
        },
      },
      include: { participants: true },
    });

    // Update group balances for each participant
    await Promise.all(participants.map(async (p: any) => {
      await prisma.groupBalance.upsert({
        where: { groupId_userId: { groupId: params.id, userId: p.userId } },
        update: { balance: { increment: p.paid - p.share } },
        create: { groupId: params.id, userId: p.userId, balance: p.paid - p.share },
      });
    }));

    // Debt minimization: fetch all group balances, calculate minimal settlements, and update Settlement table
    const balances = await prisma.groupBalance.findMany({
      where: { groupId: params.id },
      select: { userId: true, balance: true },
    });

    // Prepare creditors and debtors (Decimal-safe)
    const creditors = [];
    const debtors = [];
    for (const b of balances) {
      const bal = Number(b.balance);
      if (bal > 0.01) creditors.push({ ...b, balance: bal });
      else if (bal < -0.01) debtors.push({ ...b, balance: bal });
    }

    // Remove previous settlements for this group (we recalculate all)
    await prisma.settlement.deleteMany({ where: { groupId: params.id } });

    // Greedy debt minimization
    let i = 0, j = 0;
    const settlements = [];
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const debtorOwes = Math.abs(debtor.balance);
      const creditorOwed = creditor.balance;
      const amount = Math.min(debtorOwes, creditorOwed);
      
      if (amount > 0.01) {
        settlements.push({ 
          fromUserId: debtor.userId, 
          toUserId: creditor.userId, 
          groupId: params.id,
          amount: amount
        });
        debtor.balance += amount;
        creditor.balance -= amount;
      }
      
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    // Create new settlements
    if (settlements.length > 0) {
      await prisma.settlement.createMany({ data: settlements });
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create group expense', details: error }, { status: 500 });
  }
}
