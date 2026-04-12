import { MemoryBuffer } from '../memory';

describe('memory', () => {
  test('MemoryBuffer retains only last N messages', () => {
    const mem = new MemoryBuffer(3);
    mem.add('chat1', 'm1');
    mem.add('chat1', 'm2');
    mem.add('chat1', 'm3');
    mem.add('chat1', 'm4');
    const buffer = mem.get('chat1');
    expect(buffer).toEqual(['m2', 'm3', 'm4']);
  });
});
