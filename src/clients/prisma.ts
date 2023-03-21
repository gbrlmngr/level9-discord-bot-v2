import { PrismaClient } from '@prisma/client';

const globalInstance = global as unknown as { prisma: PrismaClient };
export const client = globalInstance.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalInstance.prisma = client;
