import assert from 'node:assert';
import { test } from 'node:test';
import { createStore } from '../dist/store.js';
import { withHistory } from '../dist/plugins/index.js';

test('withHistory basic undo and redo functionality', async () => {
  const store = withHistory(
    createStore(() => ({
      count: 0,
      text: 'hello',
    })),
  );

  assert.strictEqual(store.state.count, 0);
  assert.strictEqual(store.history.canUndo, false);
  assert.strictEqual(store.history.canRedo, false);

  store.state.count = 1;
  // Wait for microtask flush
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.strictEqual(store.state.count, 1);
  assert.strictEqual(store.history.canUndo, true);

  store.state.count = 2;
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.strictEqual(store.state.count, 2);
  assert.strictEqual(store.history.index, 2);

  // Undo to count = 1
  const undoResult1 = store.history.undo();
  assert.strictEqual(undoResult1, true);
  assert.strictEqual(store.state.count, 1);
  assert.strictEqual(store.history.canRedo, true);

  // Undo to count = 0
  const undoResult2 = store.history.undo();
  assert.strictEqual(undoResult2, true);
  assert.strictEqual(store.state.count, 0);

  // Cannot undo beyond initial
  assert.strictEqual(store.history.undo(), false);

  // Redo to count = 1
  const redoResult1 = store.history.redo();
  assert.strictEqual(redoResult1, true);
  assert.strictEqual(store.state.count, 1);

  // Redo to count = 2
  const redoResult2 = store.history.redo();
  assert.strictEqual(redoResult2, true);
  assert.strictEqual(store.state.count, 2);
});

test('withHistory reactivity & watchers upon undo/redo', async () => {
  const store = withHistory(
    createStore(() => ({
      name: 'Alice',
    })),
  );

  const watchedValues: string[] = [];
  store.watch(
    (s) => s.name,
    (val) => watchedValues.push(val),
  );

  store.state.name = 'Bob';
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.strictEqual(watchedValues.length, 1);
  assert.strictEqual(watchedValues[0], 'Bob');

  store.history.undo();
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.strictEqual(store.state.name, 'Alice');
  assert.strictEqual(watchedValues.length, 2);
  assert.strictEqual(watchedValues[1], 'Alice');
});

test('withHistory shouldRecord predicate function', async () => {
  const store = withHistory(
    createStore(() => ({
      val: 0,
      skip: false,
    })),
    {
      shouldRecord: (s) => !s.skip,
    },
  );

  store.state.val = 10;
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.strictEqual(store.history.index, 1);

  // Set skip to true and change val
  store.state.skip = true;
  store.state.val = 20;
  await new Promise((resolve) => queueMicrotask(resolve));
  // Snapshot should have been skipped
  assert.strictEqual(store.history.index, 1);

  store.history.undo();
  assert.strictEqual(store.state.val, 0);
});

test('withHistory limit capacity', async () => {
  const store = withHistory(
    createStore(() => ({ num: 0 })),
    { limit: 3 },
  );

  for (let i = 1; i <= 5; i++) {
    store.state.num = i;
    await new Promise((resolve) => queueMicrotask(resolve));
  }

  assert.strictEqual(store.history.stack.length, 3);
});

test('withHistory pause, resume, clear, destroy', async () => {
  const store = withHistory(createStore(() => ({ v: 0 })));

  store.history.pause();
  store.state.v = 100;
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.strictEqual(store.history.canUndo, false);

  store.history.resume();
  store.state.v = 200;
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.strictEqual(store.history.canUndo, true);

  store.history.clear();
  assert.strictEqual(store.history.canUndo, false);
  assert.strictEqual(store.history.stack.length, 1);

  store.history.destroy();
});

test('store.snapshot returns an independent deep clone', () => {
  const store = createStore(() => ({
    user: { name: 'Alice', age: 30 },
    items: [1, 2, 3],
  }));

  const snap = store.snapshot();
  assert.deepStrictEqual(snap, {
    user: { name: 'Alice', age: 30 },
    items: [1, 2, 3],
  });

  // Mutating snap does not mutate store state
  snap.user.name = 'Bob';
  assert.strictEqual(store.state.user.name, 'Alice');

  // Mutating store state does not mutate previous snap
  store.state.user.name = 'Charlie';
  assert.strictEqual(snap.user.name, 'Bob');
});
