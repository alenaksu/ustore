# uStore

uStore is a framework-agnostic reactive state manager for modern JavaScript and TypeScript applications. By leveraging ES6 Proxies, uStore tracks property read-paths at render/execution time and schedules updates when those specific paths are mutated.

---

## 📖 Core Store API

### 1. Creating a Store (`createStore`)

Define your state schema and instantiate the store with a state initializer function.

```typescript
import { createStore } from 'ustore';

export interface UserState {
  name: string;
  theme: 'light' | 'dark';
}

export interface AppState {
  count: number;
  time: number;
  user: UserState;
}

export const store = createStore<AppState>(() => ({
  count: 0,
  time: Date.now(),
  user: {
    name: 'Alice',
    theme: 'dark',
  },
}));
```

### 2. Reading & Mutating State

Any direct mutation to properties on `store.state` triggers reactivity for subscribers of those specific paths.

```typescript
// Reading state
console.log(store.state.user.name);

// Mutating state directly
store.state.count++;
store.state.user.theme = 'light';
```

### 3. Core Methods Reference

Each store instance exposes the following methods:

#### `store.patch(partialState)`

Applies a deep in-place update using partial objects.

Because subscription matching in uStore is precise and mapped to exact paths, replacing a parent object entirely (such as `state.user = { name: 'Bob' }`) will not trigger nested child listeners subscribed to sub-properties (like `user.name`). Using `patch` recursively updates the nested leaf properties in-place, ensuring that all precise child subscribers correctly receive the update.

```typescript
store.patch({
  user: {
    theme: 'light',
  },
});
```

#### `store.reset()`

Resets the store's state back to its initial values (re-running the initializer function) and notifies all active subscribers.

```typescript
store.reset();
```

#### `store.snapshot()`

Creates and returns an independent, deep-cloned non-reactive snapshot of the current state.

```typescript
const snapshot = store.snapshot();
console.log(snapshot.user.name); // 'Alice'
```

#### `store.subscribe(listener)`

Registers a global listener called on every mutation. It returns an unsubscribe function.

```typescript
const unsubscribe = store.subscribe((event) => {
  console.log('Mutated paths:', event.paths); // e.g. ["user.theme"]
});

// Unsubscribe when done
unsubscribe();
```

#### `store.attach(handler)`

Creates an active tracking session. It returns a tracked `state` proxy and a `detach` function. When properties on this proxy are read during execution, their paths are registered. The `handler` is called when any registered path changes.

```typescript
const { state, detach } = store.attach(() => {
  console.log(`Theme changed to: ${state.user.theme}`);
});

// Read the property once to register interest
void state.user.theme;

// Disconnect the tracking when no longer needed
detach();
```

#### `store.with(plugin)`

Applies an enhancer/plugin to the store, returning the augmented store instance.

---

## 🔌 Plugins & Composition

Core stores are lightweight and can be progressively augmented with optional capabilities using the fluent `.with(plugin)` API. Plugins are imported from `ustore/plugins` (or directly from `ustore`).

### 1. Fluent Chaining

`.with()` can be chained indefinitely. TypeScript automatically infers the combined type of the store at each step of the chain.

```typescript
import { createStore } from 'ustore';
import { events, actions, history } from 'ustore/plugins';

type MyEvents = {
  'counter:incremented': { newValue: number };
};

export const store = createStore(() => ({
  count: 0,
}))
  .with(events<MyEvents>())
  .with(
    actions((store) => ({
      increment() {
        store.patch({ count: store.state.count + 1 });
        store.emit('counter:incremented', { newValue: store.state.count });
      },
    })),
  )
  .with(history());

// Call custom actions
store.actions.increment();

// Listen to typed events
store.on('counter:incremented', ({ newValue }) => {
  console.log(`Incremented to ${newValue}`);
});

// Use undo/redo capabilities
if (store.history.canUndo) {
  store.history.undo();
}
```

### 2. State History & Undo / Redo (`history`)

The `history` plugin tracks state mutations and provides undo, redo, and snapshot recording.

```typescript
import { createStore } from 'ustore';
import { history } from 'ustore/plugins';

export const store = createStore(() => ({
  count: 0,
})).with(
  history({
    limit: 50, // Retain up to 50 history snapshots (default: 50)
  }),
);

// Mutating state records a snapshot automatically
store.state.count++;

// Undo/Redo operations
store.history.undo();
store.history.redo();

// Subscribe to history updates
const unsubscribeHistory = store.history.subscribe(() => {
  console.log('Undo available:', store.history.canUndo);
});
```

#### Conditional History Recording (`shouldRecord`)

Filter which state changes create history snapshots by providing a predicate function or a boolean:

```typescript
const store = createStore(() => ({
  count: 0,
  isDragging: false,
})).with(
  history({
    // Avoid recording history states while dragging
    shouldRecord: (state) => !state.isDragging,
  }),
);
```

### 3. Decoupled Types (`StoreWith`)

Use the `StoreWith` helper type to define the store type expected by external functions, keeping your code split and avoiding cyclic dependencies.

```typescript
import { StoreWith, events, history } from 'ustore';

interface MessagesState {
  list: string[];
}
type MessagesEvents = { 'message:added': string };

// Define the expected store type by specifying the required plugins
type MessagerStore = StoreWith<
  MessagesState,
  [ReturnType<typeof events<MessagesEvents>>, ReturnType<typeof history>]
>;

export const messageActions = (store: MessagerStore) => ({
  sendMessage(text: string) {
    store.patch({ list: [...store.state.list, text] });
    store.emit('message:added', text);
    store.history.record();
  },
});
```

---

## 💻 Framework Integrations

### 1. React Integration

Consume the store in React components using `useStore`. Property reads are automatically tracked during the component's render execution.

```tsx
import { useStore } from 'ustore/react';
import { store } from './store';

export const Counter = () => {
  // Accessing 'state' properties automatically registers subscriptions
  const state = useStore(store);

  return (
    <div>
      <p>Clicked {state.count} times</p>
      {/* Mutating directly triggers a precise update */}
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
};
```

### 2. Lit Integration

Use the `@consumeStore` decorator to bind a property to a uStore instance in a custom element. Suffixing lifecycles connect and disconnect subscriptions automatically.

```typescript
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consumeStore } from 'ustore/lit';
import { store } from './store';

@customElement('my-counter')
export class MyCounter extends LitElement {
  @consumeStore(store)
  state!: typeof store.state;

  render() {
    return html`
      <div>
        <p>Clicked ${this.state.count} times</p>
        <button @click="${() => this.state.count++}">Increment</button>
      </div>
    `;
  }
}
```

---

## ⚠️ Constraints & Caveats

### 1. Array Operations

Arrays follow the same exact-path subscription rules as any other value (see [Subscription Resolution & Nesting](#2-subscription-resolution--nesting)). Most components read the whole array (e.g. `state.items` to `.map()` over it) and subscribe to the `items` path, not to its indexes or `length`.

In-place methods like `push` or `splice` mutate paths like `items.length` / `items.0`, not `items` itself, so they **won't** notify a component that only read `state.items`. Replacing the array does:

```typescript
store.state.items.push(newItem); // Won't notify components reading `state.items`
store.state.items = [...store.state.items, newItem]; // Recommended: notifies all subscribers
```

### 2. Subscription Resolution & Nesting

Subscription matches are precise and $O(1)$:

- A component reading `state.user.name` is subscribed **only** to the path `user.name`.
- A component reading `state.user` (the parent object) is subscribed to `user`, but **not** to nested properties like `user.name`.
- Mutating `state.user.name` will **not** trigger a parent subscription on `state.user`.

Assigning a new object to a parent property (e.g. `store.state.user = { name: 'Bob', theme: 'light' }`) is fully reactive and triggers all nested subscribers correctly, as property reads automatically register interest in parent paths. Use `patch()` to merge partial changes into nested objects instead of replacing them.

---

## 🛠️ Developing & Contributing

### Setup Dependencies

Install dependencies from the root directory:

```bash
npm install
```

### Start Development & Performance Demo

Launch the Vite development server to run the interactive Performance Matrix Dashboard:

```bash
npm run dev
```

### Production Build

Compile and bundle the project targeting ESM and CommonJS:

```bash
npm run build
```

### Type Checking

Verify type safety across the library and demo files:

```bash
npx tsc --noEmit
```

---

## 📄 License

MIT © alenaksu
