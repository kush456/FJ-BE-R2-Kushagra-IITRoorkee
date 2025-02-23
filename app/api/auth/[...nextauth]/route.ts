import NextAuth, { NextAuthOptions } from "next-auth";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/lib/configs/auth/authOptions";






const handler = NextAuth(authOptions) ;
export const GET = handler;
export const POST = handler;
