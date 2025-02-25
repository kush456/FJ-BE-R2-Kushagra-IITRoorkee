import { getServerSession, Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../configs/auth/authOptions";
import { NextResponse } from "next/server";
import { prisma } from "../prisma";

export async function getTotalIncome(session: Session){
    const userId = parseInt(session.user.id || "0");
    //console.log(session);
    //console.log("userId: " + userId);
    if(userId === 0) return redirect("/api/auth/signin");
    try {
        const session = await getServerSession(authOptions);
        //console.log("session at income api: ", session);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const incomeTransactions = await prisma.transaction.findMany({
        where: { userId: session.user.id, type: "income" },
        orderBy: { date: "desc" },
        });
        
        //calculate total income
        const totalIncome = incomeTransactions.reduce((acc, transaction) => acc + transaction.amount.toNumber(), 0);
        return NextResponse.json(totalIncome, { status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
        
}

export async function getTotalExpense(session: Session){
    const userId = parseInt(session.user.id || "0");
    //console.log(session);
    //console.log("userId: " + userId);
    if(userId === 0) return redirect("/api/auth/signin");
    try {
        const session = await getServerSession(authOptions);
        //console.log("session at expense api: ", session);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
        const expenseTransactions = await prisma.transaction.findMany({
            where: { userId: session.user.id, type: "expense" },
            orderBy: { date: "desc" },
        });
        
        //calculate total income
        const totalExpense = expenseTransactions.reduce((acc, transaction) => acc + transaction.amount.toNumber(), 0);
        return NextResponse.json(totalExpense, { status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
        
}

export async function getRecentTransactions(session: Session){
    const userId = parseInt(session.user.id || "0");
    //console.log(session);
    //console.log("userId: " + userId);
    if(userId === 0) return redirect("/api/auth/signin");
    try {
        const session = await getServerSession(authOptions);
        //console.log("session at expense api: ", session);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        //get the latest three transactions

        const recentTransactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            orderBy: { date: "desc" },
            take: 3
        });
        
        return NextResponse.json(recentTransactions, { status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
        
}

export async function getTransactions(session: Session){
    const userId = parseInt(session.user.id || "0");
    //console.log(session);
    //console.log("userId: " + userId);
    if(userId === 0) return redirect("/api/auth/signin");
    try {
        const session = await getServerSession(authOptions);
        //console.log("session at expense api: ", session);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        
        //get the latest three transactions

        const recentTransactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            include: {category: true},
            orderBy: { date: "desc" },
        });
        
        return NextResponse.json(recentTransactions, { status: 200});
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
        
}