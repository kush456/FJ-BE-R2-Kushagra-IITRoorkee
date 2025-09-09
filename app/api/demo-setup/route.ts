import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has categories, if not create some default categories
    const existingCategories = await prisma.category.findMany({
      where: { 
        userId: session.user.id
      }
    });

    if (existingCategories.length === 0) {
      const defaultCategories = [
        // Expense categories
        { name: "Food", type: "expense" },
        { name: "Transportation", type: "expense" },
        { name: "Groceries", type: "expense" },
        { name: "Entertainment", type: "expense" },
        { name: "Shopping", type: "expense" },
        { name: "Bills", type: "expense" },
        { name: "Healthcare", type: "expense" },
        { name: "Coffee", type: "expense" },
        { name: "Gas", type: "expense" },
        { name: "Utilities", type: "expense" },
        // Income categories
        { name: "Salary", type: "income" },
        { name: "Freelancing", type: "income" },
        { name: "Consulting", type: "income" },
        { name: "Business", type: "income" },
        { name: "Investment", type: "income" },
        { name: "Bonus", type: "income" },
        { name: "Side Job", type: "income" },
      ];

      await prisma.category.createMany({
        data: defaultCategories.map(cat => ({
          ...cat,
          userId: session.user.id
        }))
      });

      return NextResponse.json({ 
        message: "Default categories (income and expense) created successfully",
        categoriesCreated: defaultCategories.length 
      });
    }

    return NextResponse.json({ 
      message: "User already has categories",
      existingCategoriesCount: existingCategories.length 
    });

  } catch (error) {
    console.error("Error creating demo categories:", error);
    return NextResponse.json({ 
      error: "Failed to create demo categories" 
    }, { status: 500 });
  }
}
