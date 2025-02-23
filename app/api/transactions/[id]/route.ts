import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";


//updating a transaction
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const { type, category, amount, description, date } = await req.json();
  
      const updatedTransaction = await prisma.transaction.update({
        where: { id: params.id, userId: session.user.id },
        data: { type, category, amount, description, date: new Date(date) },
      });
  
      return NextResponse.json(updatedTransaction);
    } catch (error) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
}

//deleting a transaction
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      await prisma.transaction.delete({
        where: { id: params.id, userId: session.user.id },
      });
  
      return NextResponse.json({ message: "Transaction deleted" });
    } catch (error) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
}