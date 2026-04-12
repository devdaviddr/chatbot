export class MemoryBuffer {
  private buffers: Map<string, string[]>;
  private maxSize: number;

  constructor(maxSize = 20) {
    this.buffers = new Map();
    this.maxSize = maxSize;
  }

  add(chatId: string, message: string) {
    if (!this.buffers.has(chatId)) this.buffers.set(chatId, []);
    const arr = this.buffers.get(chatId)!;
    arr.push(message);
    while (arr.length > this.maxSize) {
      arr.shift();
    }
    this.buffers.set(chatId, arr);
  }

  get(chatId: string): string[] {
    return [...(this.buffers.get(chatId) ?? [])];
  }

  clear(chatId?: string) {
    if (chatId) this.buffers.delete(chatId);
    else this.buffers.clear();
  }
}
