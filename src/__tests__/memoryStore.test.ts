import { MemoryStore } from '../memory/memoryStore';

describe('MemoryStore (in-memory buffer)', () => {
  test('stores and retrieves messages in memory buffer', async () => {
    const store = new MemoryStore({ bufferLimit: 100 });
    store.addMessage('user1', 'system', 'first');
    store.addMessage('user1', 'user', 'second');

    const recents = await store.getRecent('user1', 10);
    expect(recents.length).toBe(2);
    expect(recents[0].content).toBe('second');
    expect(recents[1].content).toBe('first');
  });

  test('respects limit and filters expired entries', async () => {
    const store = new MemoryStore({ bufferLimit: 200 });
    for (let i = 0; i < 25; i++) {
      store.addMessage('user2', 'user', `m${i}`);
    }

    const recents = await store.getRecent('user2', 20);
    expect(recents.length).toBe(20);
    expect(recents[0].content).toBe('m24');
    expect(recents[19].content).toBe('m5');

    store.addMessage('user2', 'user', 'expired', new Date(Date.now() - 1000));
    const recents2 = await store.getRecent('user2', 30);
    expect(recents2.find(r => r.content === 'expired')).toBeUndefined();
  });
});
