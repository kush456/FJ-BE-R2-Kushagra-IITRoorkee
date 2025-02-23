import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const authOptions : NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials : any) {
          // Find user in the database
          const user = await prisma.user.findUnique({
            where: { email: credentials?.email },
          });
  
          if (!user) {
            console.log("User not found");
            throw new Error("No user found with the given email.");
          } else{
            console.log("user found");
          }
  
          // Verify password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
  
          if (!isValidPassword) {
            throw new Error("Invalid password.");
          }
  
          return {
            id: user.id.toString(), 
            email: user.email,
            name: user.name,
            password: user.password
          };
        },
      }),
    ],
    session: {
      strategy: "jwt",
    },
    callbacks: {
      async jwt({ token, user } : any) {
        // console.log("jwt token", token);
        // console.log("user", user);
      
        if (user) {
          //console.log(user.id);
          token.id = token.sub; //not working btw
        }
        return token;
      },
      async session({ session, token } : any) { //do check if id aa rha h ya nhi, wo type any krna tha yaha 
        if (token) {
          //console.log("token is ", token);
          session.user.id = token.sub as string;
          //console.log("session is ");
          console.log(session);
        }
        return session;
      },
    },
    pages : {
      signIn : '/auth/signin',
    },
    secret: process.env.NEXTAUTH_SECRET,
  
  };