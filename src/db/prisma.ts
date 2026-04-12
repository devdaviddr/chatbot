import { PrismaClient } from '@prisma/client';

// Create a singleton PrismaClient to avoid exhausting connections during hot reloads
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
