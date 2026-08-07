import assert from 'node:assert';
import { test } from 'node:test';
import { createStore } from '../dist/store.js';

test('patch notifies subscribers reading an array path', async () => {
  const store = createStore(() => ({ items: [] as number[] }));

  let calls = 0;
  const { state, detach } = store.attach(() => {
    calls++;
    void state.items;
  });
  // Read the array once to register interest in the `items` path
  void state.items;

  store.patch({ items: [0, 1] });
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.strictEqual(calls, 1);
  assert.deepStrictEqual(store.snapshot(), { items: [0, 1] });
  detach();
});

test('patch replaces arrays atomically, dropping stale elements', () => {
  const store = createStore(() => ({ items: [1, 2, 3, 4, 5] }));

  store.patch({ items: [9, 8] });

  assert.deepStrictEqual(store.snapshot(), { items: [9, 8] });
});

test('patch notifies subscribers reading nested array element paths', async () => {
  const store = createStore(() => ({ items: [] as Array<{ name: string }> }));

  let calls = 0;
  const { state, detach } = store.attach(() => {
    calls++;
    void state.items[0]?.name;
  });
  void state.items[0]?.name;

  store.patch({ items: [{ name: 'bob' }] });
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.strictEqual(calls, 1);
  detach();
});

test('patch merges plain objects in place, preserving existing proxies', () => {
  const store = createStore(() => ({ user: { name: 'Alice', age: 30 } }));

  const user = store.state.user;
  void user.name;

  store.patch({ user: { name: 'Bob' } });

  // The previously obtained proxy still reflects the update: same target mutated in place
  assert.strictEqual(user.name, 'Bob');
  assert.deepStrictEqual(store.snapshot(), { user: { name: 'Bob', age: 30 } });
});

test('arrays derived from reads can be written back without leaking proxies', () => {
  const store = createStore(() => ({
    points: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ],
  }));

  // filter/map/spread produce proxies of the read elements; writing them back
  // must not leak proxies into the raw state (which would break structuredClone).
  const next = store.state.points.filter((p) => p.x !== 3);
  store.patch({ points: next });
  store.state.points = store.state.points.map((p) => ({ ...p }));

  assert.deepStrictEqual(store.snapshot(), {
    points: [
      { x: 1, y: 2 },
      { x: 5, y: 6 },
    ],
  });
});

test.only('patch of a filtered array does not leak proxies into snapshot', () => {
  const store = createStore(() => ({
    points: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
    ],
  }));

  const remaining = store.state.points.filter((p) => p.x !== 3);
  store.patch({ points: remaining });

  assert.deepStrictEqual(store.snapshot(), {
    points: [
      { x: 1, y: 2 },
      { x: 5, y: 6 },
    ],
  });
});

test('in-place array element writes notify the exact element path', async () => {
  const store = createStore(() => ({ items: [{ name: 'a' }] }));

  let calls = 0;
  const { state, detach } = store.attach(() => {
    calls++;
    void state.items[0]?.name;
  });
  void state.items[0]?.name;

  state.items[0].name = 'b';
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.strictEqual(calls, 1);
  detach();
});

test('patch replaces nested arrays and notifies their exact path', async () => {
  const store = createStore(() => ({ user: { tags: [] as string[] } }));

  const events: string[][] = [];
  const unsubscribe = store.subscribe((event) => events.push(event.paths));

  store.patch({ user: { tags: ['x', 'y'] } });
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.deepStrictEqual(store.snapshot(), { user: { tags: ['x', 'y'] } });
  assert.deepStrictEqual(events, [['user.tags']]);
  unsubscribe();
});
