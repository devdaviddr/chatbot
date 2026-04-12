import { randomUUID } from 'crypto';
import { prisma as defaultPrisma } from '../db/prisma';

export interface MemoryEntry {
  id: string;
  userId: string;
  role: string;
  content: string;
  embedding?: any;
  createdAt: Date;
  expiresAt?: Date | null;
}

export class MemoryStore {
  private buffer: Map<string, MemoryEntry[]>;
  private bufferLimit: number;
  private prisma: any;

  constructor(options?: { bufferLimit?: number; prisma?: any }) {
    this.buffer = new Map();
    this.bufferLimit = options?.bufferLimit ?? 100;
    this.prisma = options?.prisma ?? defaultPrisma;
  }

  addMessage(userId: string, role: string, content: string, expiresAt?: Date | null): MemoryEntry {
    const entry: MemoryEntry = {
      id: typeof randomUUID === 'function' ? randomUUID() : Math.random().toString(36).slice(2, 9),
      userId,
      role,
      content,
      createdAt: new Date(),
      expiresAt: expiresAt ?? null,
    };

    const arr = this.buffer.get(userId) ?? [];
    arr.unshift(entry);
    if (arr.length > this.bufferLimit) {
      arr.splice(this.bufferLimit);
    }
    this.buffer.set(userId, arr);
    return entry;
  }

  async getRecent(userId: string, limit = 20): Promise<MemoryEntry[]> {
    const now = new Date();
    const bufferEntries = (this.buffer.get(userId) || []).filter((e: any) => !e.expiresAt || e.expiresAt > now);
    const result = bufferEntries.slice(0, limit);
    if (result.length >= limit) return result.slice(0, limit);

    const remaining = limit - result.length;
    const excludedIds = bufferEntries.map((e: any) => e.id);
    const where: any = { userId };
    if (excludedIds.length > 0) where.id = { notIn: excludedIds };

    // If no DATABASE_URL is configured (e.g., in unit tests), skip DB lookup and return buffer-only results
    if (!process.env.DATABASE_URL) {
      return result;
    }

    const dbRows = await this.prisma.memoryEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: remaining,
    });

    const dbFiltered: MemoryEntry[] = (dbRows || [])
      .filter((e: any) => !e.expiresAt || new Date(e.expiresAt) > now)
      .map((e: any) => ({
        id: e.id,
        userId: e.userId,
        role: e.role,
        content: e.content,
        embedding: (e as any).embedding,
        createdAt: new Date(e.createdAt),
        expiresAt: e.expiresAt ? new Date(e.expiresAt) : null,
      }));

    return result.concat(dbFiltered);
  }

  async persistMemoryEntry(entry: MemoryEntry) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set; cannot persist entry');
    }

    return this.prisma.memoryEntry.create({
      data: {
        id: entry.id,
        userId: entry.userId,
        role: entry.role,
        content: entry.content,
        embedding: entry.embedding ?? null,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt ?? null,
      },
    });
  }

  async listReminders(userId: string) {
    if (!process.env.DATABASE_URL) return [];
    return this.prisma.reminder.findMany({ where: { userId }, orderBy: { dueAt: 'asc' } });
  }
}

export default MemoryStore;
