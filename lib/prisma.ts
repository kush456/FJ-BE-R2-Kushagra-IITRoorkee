import { PrismaClient } from "@prisma/client";

//to ensure multiple insances of prisma client are not uneccessarily created
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
