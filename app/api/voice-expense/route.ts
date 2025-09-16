import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/configs/auth/authOptions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcription } = await req.json();
    
    if (!transcription) {
      return NextResponse.json({ error: "No transcription provided" }, { status: 400 });
    }

    // Get user's categories for context (both income and expense)
    const categories = await prisma.category.findMany({
      where: { 
        userId: session.user.id
      },
      select: { id: true, name: true, type: true }
    });

    const incomeCategories = categories.filter(cat => cat.type === "income").map(cat => cat.name);
    const expenseCategories = categories.filter(cat => cat.type === "expense").map(cat => cat.name);

    // Process with Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Parse the following financial voice input and convert it to a JSON object with the exact structure below.
    
    Today's date is: ${new Date().toISOString()}

    Available EXPENSE categories: ${expenseCategories.join(", ") || "None"}
    Available INCOME categories: ${incomeCategories.join(", ") || "None"}
    
    Voice input: "${transcription}"
    
    You must extract and determine:
    - type: "expense" or "income" (analyze the context - earning money = income, spending money = expense)
    - category: match to one of the available categories based on the type. If no exact match, choose the closest one or return "other"
    - amount: extract the numerical amount (just the number, no currency symbols)
    - description: brief description of the transaction
    - date: Analyze the voice input for any date information (e.g., "yesterday", "last Tuesday", "September 5th"). If a date is mentioned, parse it and return it in ISO format. If no date is mentioned, use today's date as provided above.
    
    Return ONLY a valid JSON object in this exact format:
    {
      "type": "expense" or "income",
      "category": "category_name",
      "amount": 0,
      "description": "description",
      "date": "ISO_date_string",
      "success": true
    }
    
    If the input doesn't contain enough information (missing amount or unclear transaction), return:
    {
      "success": false,
      "error": "Please provide more details like the amount and what the transaction was for"
    }
    
    Examples:
    - "I spent 50 dollars on groceries yesterday" → {"type": "expense", "category": "groceries", "amount": 50, "description": "groceries yesterday", "date": "2025-09-15T...", "success": true}
    - "Bought coffee for 5 bucks" → {"type": "expense", "category": "food", "amount": 5, "description": "coffee", "date": "2025-09-16T...", "success": true}
    - "I earned 1000 dollars from freelancing on September 1st" → {"type": "income", "category": "freelance", "amount": 1000, "description": "freelancing income on September 1st", "date": "2025-09-01T...", "success": true}
    - "Got paid 500 for consulting" → {"type": "income", "category": "consulting", "amount": 500, "description": "consulting payment", "date": "2025-09-16T...", "success": true}
    - "Received salary 3000" → {"type": "income", "category": "salary", "amount": 3000, "description": "salary payment", "date": "2025-09-16T...", "success": true}
    
    Important: Carefully analyze the context to determine if it's income (earning/receiving money) or expense (spending money).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let parsedExpense;
    try {
      // Clean the response to extract just the JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      parsedExpense = JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
      return NextResponse.json({ 
        error: "Could not understand the expense details. Please try again with clearer information." 
      }, { status: 400 });
    }

    if (!parsedExpense.success) {
      return NextResponse.json({ 
        error: parsedExpense.error || "Could not process the expense. Please provide amount and description." 
      }, { status: 400 });
    }

    // Find matching category based on type
    const matchingCategory = categories.find(cat => 
      cat.name.toLowerCase() === parsedExpense.category.toLowerCase() &&
      cat.type === parsedExpense.type
    );

    if (!matchingCategory) {
      const availableCategories = parsedExpense.type === "income" 
        ? incomeCategories.join(", ") 
        : expenseCategories.join(", ");
      
      return NextResponse.json({ 
        error: `Category "${parsedExpense.category}" not found for ${parsedExpense.type}. Available ${parsedExpense.type} categories: ${availableCategories}` 
      }, { status: 400 });
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: parsedExpense.type,
        categoryId: matchingCategory.id,
        amount: parsedExpense.amount,
        description: parsedExpense.description,
        date: new Date(parsedExpense.date),
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      parsedData: parsedExpense
    }, { status: 201 });

  } catch (error) {
    console.error("Error processing voice expense:", error);
    return NextResponse.json({ 
      error: "Failed to process voice expense. Please try again." 
    }, { status: 500 });
  }
}
