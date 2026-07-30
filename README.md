# uStore 🗃️

uStore is a framework-agnostic reactive state manager for modern JavaScript and TypeScript applications.

By leveraging ES6 Proxies, uStore tracks property read-paths at render time and schedules updates when those specific paths are mutated. This avoids full virtual DOM reconciliation and manual selector definitions.

---

## 🛠️ Usage

### 1. Creating a Store

Define your initial state and instantiate the store. uStore works with any plain JavaScript object.

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

### 1.1 Resetting State (`reset`)

You can reset the store state back to its initial value using `store.reset()`:

```typescript
store.reset();
```

### 1.2 Patching State (`patch`)

You can deeply update multiple properties or complex nested branches of state using `store.patch()`.

Unlike replacing the state object, `patch` applies a deep in-place update using partial objects, preserving proxy references and triggering precise path updates.

```typescript
// Update nested or multiple state properties at once
store.patch({
  user: {
    theme: 'light',
  },
});
```

You can also access `patch` directly from an attachment created with `store.attach()`:

```typescript
const { state, patch, detach } = store.attach(updateUI);

patch({ count: 10 });
```

### 1.3 State Snapshot (`snapshot`)

You can create an independent deep clone snapshot of the current store state using `store.snapshot()`:

```typescript
const currentStateSnapshot = store.snapshot();
console.log(currentStateSnapshot);
```

### 2. React Integration

Import `useStore` to consume the store in React. Property reads are automatically tracked during the component's render execution.

```tsx
import { useStore } from 'ustore/react';
import { store } from './store';

export const Counter = () => {
  // Reading from 'state' automatically registers subscriptions to accessed paths
  const state = useStore(store);

  return (
    <div>
      <p>Clicked {state.count} times</p>
      {/* Mutating the property directly triggers a precise update */}
      <button onClick={() => state.count++}>Increment</button>
    </div>
  );
};
```

### 3. Lit Integration

Use the `@consumeStore` decorator to bind a property to a uStore store in a custom element. The element connects and disconnects subscriptions automatically with its lifecycle.

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

### 4. Vanilla JS & Subscription Auditing

You can register listeners to audit mutations globally or listen to general updates.

```typescript
import { store } from './store';

// Listen to all state changes across the entire store
const unsubscribe = store.subscribe((event) => {
  console.log('Mutated paths:', event.paths); // e.g. ["user.theme", "count"]
});

// To stop listening:
unsubscribe();
```

### 5. Watching Specific Properties or Derived State (`watch`)

You can watch a specific property or a derived computed value from the store using `store.watch`.

The selector function automatically tracks dependencies and triggers the listener callback _only_ when the selected value changes. The listener receives both the new value and the previous value.

```typescript
import { store } from './store';

// Watch a nested property
const unwatchName = store.watch(
  (state) => state.user.name,
  (name, prevName) => {
    console.log(`User name changed from ${prevName} to ${name}`);
  },
);

// Watch a derived/computed value
const unwatchIsDark = store.watch(
  (state) => state.user.theme === 'dark',
  (isDark, prevIsDark) => {
    console.log(`Is dark theme active changed from ${prevIsDark} to ${isDark}`);
  },
);

// To stop watching:
unwatchName();
unwatchIsDark();
```

---

## 🔌 Plugins

uStore includes optional plugins available via the `ustore/plugins` subpath export.

### 1. State History & Undo / Redo (`withHistory`)

You can enable state history management (Undo, Redo, and Snapshot tracking) by wrapping your store with `withHistory`.

```typescript
import { createStore } from 'ustore';
import { withHistory } from 'ustore/plugins';

export const store = withHistory(
  createStore(() => ({
    count: 0,
    user: { name: 'Alice' },
  })),
  {
    limit: 50, // Retain up to 50 history snapshots (default: 50)
  },
);

// Mutating state records a snapshot automatically
store.state.count++;
store.state.count++;

// Undo/Redo operations
if (store.history.canUndo) {
  store.history.undo(); // Reverts state to count: 1 and updates subscribers
}

if (store.history.canRedo) {
  store.history.redo(); // Re-applies state to count: 2
}
```

#### Conditional Recording (`shouldRecord`)

You can filter which state changes create history snapshots by providing a predicate function or a boolean for `shouldRecord`:

```typescript
const store = withHistory(
  createStore(() => ({
    count: 0,
    isDragging: false,
  })),
  {
    // Ignore state snapshots during drag operations
    shouldRecord: (state) => !state.isDragging,
  },
);
```

---

## ⚠️ Constraints & Caveats

To ensure correct path tracking and updates, uStore operates under a specific mental model:

### 1. Property Mutations & Branch Updates (`patch`)

uStore tracks mutations at the property level and supports both direct mutations and deep updates.

- **Direct Property Mutation:** Mutate properties directly when updating individual values.
  ```typescript
  store.state.user.name = 'Bob'; // Correct. Triggers 'user.name' listeners.
  ```
- **Partial & Complex Updates (`patch`):** Use `store.patch()` or `attachment.patch()` when updating multiple properties or nested branches at once without needing to re-specify existing properties.
  ```typescript
  store.patch({ user: { theme: 'light' } }); // Convenient: merges theme without overwriting user.name
  ```
- **Direct Parent Node Assignment:** Assigning a new object to a parent property (e.g. `store.state.user = { name: 'Bob', theme: 'light' }`) is fully reactive and triggers all nested subscribers correctly, as property reads automatically register interest in parent paths. Use `patch()` whenever you want to merge partial changes into nested objects instead of replacing them.

### 2. No Wildcard/Hierarchical Subscriptions

Subscription matching is precise and O(1).

- A component reading `state.user.name` is subscribed **only** to the path `user.name`.
- A component reading `state.user` (the parent object) is subscribed to `user`, but **not** to nested properties like `user.name`.
- Mutating a nested property (e.g., writing to `state.user.name`) will **not** trigger a parent subscription on `state.user`.

### 3. Array Operations

In uStore, arrays are treated as atomic values. Therefore, only mutating the array itself (or re-assigning it) will trigger updates. Mutating individual elements or nested paths inside an array will not trigger item-level updates.

To update array-based state, mutate the array reference or re-assign the array itself.

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
