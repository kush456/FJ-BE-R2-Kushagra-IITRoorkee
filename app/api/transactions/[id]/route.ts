import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";

// updating a transaction
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    //console.log("session: ", session);
    const { type, category, amount, description, date } = await req.json();
    //console.log("req sent to update: ", { params, type, category, amount, description, date });

    if (!category || typeof category !== 'object' || !category.id) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        type,
        category: {
          connect: { id: category.id },
        },
        amount,
        description,
        date: new Date(date),
      },
    });

    //console.log("updatedTransaction: ", updatedTransaction);
    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction: ", error);
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
}

// deleting a transaction
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