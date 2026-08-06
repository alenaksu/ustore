import assert from 'node:assert';
import { test } from 'node:test';
import { createStore } from '../../dist/store.js';
import { actions, events, history } from '../../dist/plugins/index.js';

test('store.with(events(), actions(), history()) composes capabilities', async () => {
  type FilterEvents = {
    'filters:update': { name: string; value: number };
  };

  const store = createStore(() => ({
    filters: {} as Record<string, number>,
    count: 0,
  }))
    .with(events<FilterEvents>())
    .with(
      actions((store) => ({
        updateFilter(name: string, value: number) {
          store.patch({ filters: { [name]: value } });
          store.emit('filters:update', { name, value });
        },
      })),
    )
    .with(history());

  const received: Array<{ name: string; value: number }> = [];
  store.on('filters:update', (payload) => {
    received.push(payload);
  });

  store.actions.updateFilter('brightness', 42);
  await new Promise((resolve) => queueMicrotask(resolve));

  assert.deepStrictEqual(store.state.filters, { brightness: 42 });
  assert.deepStrictEqual(received, [{ name: 'brightness', value: 42 }]);
  assert.strictEqual(store.history.canUndo, true);
});

test('actions can mutate state without requiring direct store state writes', () => {
  const store = createStore(() => ({ count: 0 }))
    .with(events())
    .with(
      actions((store) => ({
        increment() {
          store.patch({ count: store.state.count + 1 });
        },
      })),
    );

  store.actions.increment();

  assert.strictEqual(store.state.count, 1);
});
