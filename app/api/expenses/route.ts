import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// POST /api/expenses
// Body: { groupId, payerId, amount, description, splitType, participants: [{ userId, paid, share }] }
export async function POST(req: NextRequest) {
  try {
    const { groupId, payerId, amount, description, splitType, participants } = await req.json();
    if (!groupId || !payerId || !amount || !participants || participants.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the expense and participants
    const expense = await prisma.expense.create({
      data: {
        groupId,
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
        where: { groupId_userId: { groupId, userId: p.userId } },
        update: { balance: { increment: p.paid - p.share } },
        create: { groupId, userId: p.userId, balance: p.paid - p.share },
      });
    }));

    // Debt minimization: fetch all group balances, calculate minimal settlements, and update Settlement table
    const balances = await prisma.groupBalance.findMany({
      where: { groupId },
      select: { userId: true, balance: true },
    });

    // Prepare creditors and debtors (Decimal-safe)
    const creditors = [];
    const debtors = [];
    for (const b of balances) {
      const bal = new Decimal(b.balance);
      if (bal.gt(0.01)) creditors.push({ ...b, balance: bal });
      else if (bal.lt(-0.01)) debtors.push({ ...b, balance: bal });
    }

    // Remove previous settlements for this group
    await prisma.settlement.deleteMany({ where: { groupId } });

    // Greedy debt minimization
    let i = 0, j = 0;
    const settlements = [];
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const debtorOwes = debtor.balance.neg();
      const creditorOwed = creditor.balance;
      const amount = debtorOwes.lt(creditorOwed) ? debtorOwes : creditorOwed;
      if (amount.gt(0.01)) {
        settlements.push({ fromUserId: debtor.userId, toUserId: creditor.userId, groupId, amount: amount.toNumber() });
        debtor.balance = debtor.balance.add(amount);
        creditor.balance = creditor.balance.sub(amount);
      }
      if (debtor.balance.abs().lt(0.01)) i++;
      if (creditor.balance.lt(0.01)) j++;
    }

    // Create new settlements
    await prisma.settlement.createMany({ data: settlements });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense', details: error }, { status: 500 });
  }
}
