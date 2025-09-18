import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { getServerSession } from 'next-auth';

// GET /api/expenses - Get user's expenses (both group and one-off)
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

    // Get expenses where user is a participant
    const expenses = await prisma.expense.findMany({
      where: {
        participants: {
          some: { userId: user.id }
        }
      },
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
    return NextResponse.json({ error: 'Failed to fetch expenses', details: error }, { status: 500 });
  }
}

// POST /api/expenses
// Body: { groupId?, payerId, amount, description, splitType, participants: [{ userId, paid, share }] }
export async function POST(req: NextRequest) {
  try {
    const { groupId, payerId, amount, description, splitType, participants } = await req.json();
    if (!payerId || !amount || !participants || participants.length === 0) {
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

    if (groupId) {
      // Handle GROUP EXPENSES - Update group balances and settlements
      await Promise.all(participants.map(async (p: any) => {
        await prisma.groupBalance.upsert({
          where: { groupId_userId: { groupId, userId: p.userId } },
          update: { balance: { increment: p.paid - p.share } },
          create: { groupId, userId: p.userId, balance: p.paid - p.share },
        });
      }));

      // Debt minimization for group
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
          settlements.push({ 
            fromUserId: debtor.userId, 
            toUserId: creditor.userId, 
            groupId, 
            expenseId: expense.id,
            amount: amount.toNumber() 
          });
          debtor.balance = debtor.balance.add(amount);
          creditor.balance = creditor.balance.sub(amount);
        }
        if (debtor.balance.abs().lt(0.01)) i++;
        if (creditor.balance.lt(0.01)) j++;
      }

      // Create new settlements
      await prisma.settlement.createMany({ data: settlements });
    } else {
      // Handle ONE-OFF EXPENSES - Create direct settlements between participants
      const settlementsToCreate = [];
      
      // Find all participants who owe money (negative net balance)
      const debtors = participants.filter((p: any) => (p.paid - p.share) < -0.01);
      // Find all participants who should be paid (positive net balance)  
      const creditors = participants.filter((p: any) => (p.paid - p.share) > 0.01);

      // Simple debt minimization for one-off expenses
      for (const debtor of debtors) {
        let debtRemaining = Math.abs(debtor.paid - debtor.share);
        
        for (const creditor of creditors) {
          if (debtRemaining <= 0.01) break;
          
          let creditAvailable = creditor.paid - creditor.share;
          if (creditAvailable <= 0.01) continue;
          
          const settlementAmount = Math.min(debtRemaining, creditAvailable);
          
          settlementsToCreate.push({
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            groupId: null, // One-off expense
            expenseId: expense.id, // Link to this expense
            amount: settlementAmount,
            status: 'PENDING'
          });
          
          debtRemaining -= settlementAmount;
          creditor.paid -= settlementAmount; // Reduce available credit
        }
      }

      // Create settlements for one-off expense
      if (settlementsToCreate.length > 0) {
        await prisma.settlement.createMany({ data: settlementsToCreate });
      }
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense', details: error }, { status: 500 });
  }
}
