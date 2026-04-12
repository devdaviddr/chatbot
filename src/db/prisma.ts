import { PrismaClient } from '@prisma/client';

// Create a singleton PrismaClient to avoid exhausting connections during hot reloads
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// When running tests or if no DATABASE_URL is provided, export a lightweight stub
// to avoid initializing a real PrismaClient which would require a database.
const shouldUseStub = process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL;

let prismaInstance: PrismaClient;

if (shouldUseStub) {
  const stub: any = {
    memoryEntry: {
      findMany: async (_args?: any) => [],
      create: async (args: any) => args.data,
    },
    reminder: {
      findMany: async (_args?: any) => [],
    },
  };
  prismaInstance = stub as unknown as PrismaClient;
} else {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
export default prisma;
