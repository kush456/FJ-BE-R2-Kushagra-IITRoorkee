import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { Decimal } from '@prisma/client/runtime/library';

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

// PUT /api/expenses/[id] - Update expense
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { description, amount, participants } = await req.json();

    // Verify user is a participant in this expense
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { participants: true }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const isParticipant = existingExpense.participants.some(p => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete existing settlements for this expense
    await prisma.settlement.deleteMany({
      where: { expenseId: params.id }
    });

    // Delete existing participants
    await prisma.expenseParticipant.deleteMany({
      where: { expenseId: params.id }
    });

    // Update expense and recreate participants
    const updatedExpense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        description,
        amount,
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

    // Recreate settlements with debt minimization logic
    if (existingExpense.groupId) {
      // Handle GROUP EXPENSES - Update group balances and settlements
      await Promise.all(participants.map(async (p: any) => {
        await prisma.groupBalance.upsert({
          where: { groupId_userId: { groupId: existingExpense.groupId!, userId: p.userId } },
          update: { balance: { increment: p.paid - p.share } },
          create: { groupId: existingExpense.groupId!, userId: p.userId, balance: p.paid - p.share },
        });
      }));

      // Debt minimization for group (similar to creation logic)
      const balances = await prisma.groupBalance.findMany({
        where: { groupId: existingExpense.groupId },
        select: { userId: true, balance: true },
      });

      const creditors = [];
      const debtors = [];
      for (const b of balances) {
        const bal = new Decimal(b.balance);
        if (bal.gt(0.01)) creditors.push({ ...b, balance: bal });
        else if (bal.lt(-0.01)) debtors.push({ ...b, balance: bal });
      }

      await prisma.settlement.deleteMany({ where: { groupId: existingExpense.groupId } });

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
            groupId: existingExpense.groupId,
            expenseId: params.id,
            amount: amount.toNumber() 
          });
          debtor.balance = debtor.balance.add(amount);
          creditor.balance = creditor.balance.sub(amount);
        }
        if (debtor.balance.abs().lt(0.01)) i++;
        if (creditor.balance.lt(0.01)) j++;
      }

      await prisma.settlement.createMany({ data: settlements });
    } else {
      // Handle ONE-OFF EXPENSES - Create direct settlements between participants
      const settlementsToCreate = [];
      
      const debtors = participants.filter((p: any) => (p.paid - p.share) < -0.01);
      const creditors = participants.filter((p: any) => (p.paid - p.share) > 0.01);

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
            groupId: null,
            expenseId: params.id,
            amount: settlementAmount,
            status: 'PENDING'
          });
          
          debtRemaining -= settlementAmount;
          creditor.paid -= settlementAmount;
        }
      }

      if (settlementsToCreate.length > 0) {
        await prisma.settlement.createMany({ data: settlementsToCreate });
      }
    }

    return NextResponse.json(updatedExpense);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense', details: error }, { status: 500 });
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    // Verify user is a participant in this expense
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { participants: true }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    const isParticipant = expense.participants.some(p => p.userId === user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete settlements related to this expense
    await prisma.settlement.deleteMany({
      where: { expenseId: params.id }
    });

    // Delete participants (will cascade delete the expense)
    await prisma.expenseParticipant.deleteMany({
      where: { expenseId: params.id }
    });

    // Delete the expense
    await prisma.expense.delete({
      where: { id: params.id }
    });

    // If it was a group expense, recalculate group balances
    if (expense.groupId) {
      // Reverse the balance changes for each participant
      await Promise.all(expense.participants.map(async (p) => {
        await prisma.groupBalance.upsert({
          where: { groupId_userId: { groupId: expense.groupId!, userId: p.userId } },
          update: { balance: { decrement: p.netBalance } },
          create: { groupId: expense.groupId!, userId: p.userId, balance: -p.netBalance },
        });
      }));

      // Recalculate settlements for the group
      const balances = await prisma.groupBalance.findMany({
        where: { groupId: expense.groupId },
        select: { userId: true, balance: true },
      });

      const creditors = [];
      const debtors = [];
      for (const b of balances) {
        const bal = new Decimal(b.balance);
        if (bal.gt(0.01)) creditors.push({ ...b, balance: bal });
        else if (bal.lt(-0.01)) debtors.push({ ...b, balance: bal });
      }

      await prisma.settlement.deleteMany({ where: { groupId: expense.groupId } });

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
            groupId: expense.groupId,
            amount: amount.toNumber() 
          });
          debtor.balance = debtor.balance.add(amount);
          creditor.balance = creditor.balance.sub(amount);
        }
        if (debtor.balance.abs().lt(0.01)) i++;
        if (creditor.balance.lt(0.01)) j++;
      }

      await prisma.settlement.createMany({ data: settlements });
    }

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense', details: error }, { status: 500 });
  }
}