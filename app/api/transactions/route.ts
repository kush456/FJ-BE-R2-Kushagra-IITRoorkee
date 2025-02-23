import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";

//adding a new transaction
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    //console.log(session);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, category, amount, description, date } = await req.json();

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type,
        category,
        amount,
        description,
        date: new Date(date),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

//getting users transactions
export async function GET(req: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const transactions = await prisma.transaction.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "desc" },
      });
  
      return NextResponse.json(transactions);
    } catch (error) {
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}


  
  
