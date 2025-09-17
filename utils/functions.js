import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";

export const Prisma = (env) => {
    const adapter = new PrismaD1(env.DB)
    const prisma =new PrismaClient({adapter})

    return prisma
}