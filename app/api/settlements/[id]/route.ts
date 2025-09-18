import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/settlements/[id] - mark as paid
export async function PATCH({ params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const updated = await prisma.settlement.update({
      where: { id },
      data: { status: 'PAID' },
    });
    return NextResponse.json({ settlement: updated });
  } catch (error) {
    console.error('Error updating settlement:', error);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}
