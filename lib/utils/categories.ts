import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../configs/auth/authOptions";
import { NextResponse } from "next/server";
import { prisma } from "../prisma";

export async function getCategories(session: Session){
    const userId = parseInt(session.user.id || "0");
    if(userId === 0) return redirect("/api/auth/signin");
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const categories = await prisma.category.findMany({
            where: { userId: session.user.id , type: "expense" },
            include: {
                transactions: {
                    select: {
                        amount: true
                    }
                }
            }
        });

        const categoriesWithSpent = categories.map(category => {
            const spent = category.transactions.reduce((total, transaction) => total + Number(transaction.amount), 0);
            return {
                ...category,
                spent
            };
        });
        
        return NextResponse.json(categoriesWithSpent, { status: 200});
    } catch (error) {
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}