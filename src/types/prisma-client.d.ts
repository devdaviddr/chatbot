declare module '@prisma/client' {
  // Minimal PrismaClient stub for type-checking in this repository's build.
  export class PrismaClient {
    constructor();
    memoryEntry: {
      findMany(args?: any): Promise<Array<{
        id: string;
        userId: string;
        role: string;
        content: string;
        embedding?: any;
        createdAt: string | Date;
        expiresAt?: string | Date | null;
      }>>;
      create(args?: any): Promise<any>;
    };
    reminder: {
      findMany(args?: any): Promise<any[]>;
    };
  }
  export default PrismaClient;
}
