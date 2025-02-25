import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";


export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const {id} = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { budget } = await req.json();
    if (typeof budget !== 'number') {
      return NextResponse.json({ error: "Invalid budget value" }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id},
      data: { budget },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating budget: ", error);
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}