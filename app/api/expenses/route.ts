import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { getServerSession } from 'next-auth';

// Heap implementation for debt minimization
class MinHeap {
  private heap: any[] = [];
  
  push(val: any) {
    this.heap.push(val);
    this.heapifyUp(this.heap.length - 1);
  }
  
  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return min;
  }
  
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }
  
  size() {
    return this.heap.length;
  }
  
  private heapifyUp(index: number) {
    if (index === 0) return;
    const parentIndex = Math.floor((index - 1) / 2);
    if (this.heap[parentIndex].amount > this.heap[index].amount) {
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      this.heapifyUp(parentIndex);
    }
  }
  
  private heapifyDown(index: number) {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let smallest = index;
    
    if (leftChild < this.heap.length && this.heap[leftChild].amount < this.heap[smallest].amount) {
      smallest = leftChild;
    }
    
    if (rightChild < this.heap.length && this.heap[rightChild].amount < this.heap[smallest].amount) {
      smallest = rightChild;
    }
    
    if (smallest !== index) {
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      this.heapifyDown(smallest);
    }
  }
}

class MaxHeap {
  private heap: any[] = [];
  
  push(val: any) {
    this.heap.push(val);
    this.heapifyUp(this.heap.length - 1);
  }
  
  pop() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();
    
    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return max;
  }
  
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }
  
  size() {
    return this.heap.length;
  }
  
  private heapifyUp(index: number) {
    if (index === 0) return;
    const parentIndex = Math.floor((index - 1) / 2);
    if (this.heap[parentIndex].amount < this.heap[index].amount) {
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      this.heapifyUp(parentIndex);
    }
  }
  
  private heapifyDown(index: number) {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let largest = index;
    
    if (leftChild < this.heap.length && this.heap[leftChild].amount > this.heap[largest].amount) {
      largest = leftChild;
    }
    
    if (rightChild < this.heap.length && this.heap[rightChild].amount > this.heap[largest].amount) {
      largest = rightChild;
    }
    
    if (largest !== index) {
      [this.heap[largest], this.heap[index]] = [this.heap[index], this.heap[largest]];
      this.heapifyDown(largest);
    }
  }
}

// GET /api/expenses - Get user's expenses (both group and one-off)
export async function GET() {
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
      // Handle ONE-OFF EXPENSES - Create direct settlements between participants using heaps
      const settlementsToCreate = [];
      
      // Create heaps for optimal debt minimization
      const debtorHeap = new MinHeap(); // Min heap for debtors (smallest debt first)
      const creditorHeap = new MaxHeap(); // Max heap for creditors (largest credit first)
      
      // Populate heaps with participants
      participants.forEach((p: any) => {
        const netBalance = p.paid - p.share;
        if (netBalance < -0.01) {
          // Debtor: use absolute value for min heap
          debtorHeap.push({
            userId: p.userId,
            amount: Math.abs(netBalance),
            participant: p
          });
        } else if (netBalance > 0.01) {
          // Creditor: use positive value for max heap
          creditorHeap.push({
            userId: p.userId,
            amount: netBalance,
            participant: p
          });
        }
      });

      // Process settlements using heaps for optimal debt minimization
      while (debtorHeap.size() > 0 && creditorHeap.size() > 0) {
        const debtor = debtorHeap.pop();
        const creditor = creditorHeap.pop();
        
        if (!debtor || !creditor) break;
        
        const settlementAmount = Math.min(debtor.amount, creditor.amount);
        
        if (settlementAmount > 0.01) {
          settlementsToCreate.push({
            fromUserId: debtor.userId,
            toUserId: creditor.userId,
            groupId: null, // One-off expense
            expenseId: expense.id, // Link to this expense
            amount: settlementAmount,
            status: 'PENDING'
          });
        }
        
        // Update remaining amounts and re-insert if needed
        const remainingDebt = debtor.amount - settlementAmount;
        const remainingCredit = creditor.amount - settlementAmount;
        
        if (remainingDebt > 0.01) {
          debtorHeap.push({
            userId: debtor.userId,
            amount: remainingDebt,
            participant: debtor.participant
          });
        }
        
        if (remainingCredit > 0.01) {
          creditorHeap.push({
            userId: creditor.userId,
            amount: remainingCredit,
            participant: creditor.participant
          });
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
