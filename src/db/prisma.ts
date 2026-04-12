// Use dynamic require to avoid TypeScript type-only import issues in test environments
let PrismaClient: any;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (err) {
  PrismaClient = undefined;
}

// Create a singleton PrismaClient to avoid exhausting connections during hot reloads
const globalForPrisma = global as unknown as { prisma?: any };

// When running tests or if no DATABASE_URL is provided, export a lightweight stub
// to avoid initializing a real PrismaClient which would require a database.
const shouldUseStub = process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL;

let prismaInstance: any;

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
  prismaInstance = stub;
} else {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
export default prisma;
