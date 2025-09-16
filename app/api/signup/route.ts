
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Log the DATABASE_URL for debugging
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    
    await prisma.$connect();
    // Try a simple query
    const users = await prisma.user.findMany({ take: 1 });
    return NextResponse.json({ message: "Prisma connected!", users });
  } catch (error) {
    console.log(TypeError.stackTraceLimit);
    console.error("Prisma connection error:", error);
    return NextResponse.json({ message: "Prisma connection failed.", error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    console.log(newUser);
    return NextResponse.json({ message: "User created successfully." }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
