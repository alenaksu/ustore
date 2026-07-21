# uStore 🗃️

uStore is a framework-agnostic reactive state manager for modern JavaScript and TypeScript applications.

By leveraging ES6 Proxies, uStore tracks property read-paths at render time and schedules updates when those specific paths are mutated. This avoids full virtual DOM reconciliation and manual selector definitions.

---

## 🛠️ Usage

### 1. Creating a Store

Define your initial state and instantiate the store. uStore works with any plain JavaScript object.

```typescript
import { createStore } from '@alenaksu/ustore';

export interface UserState {
  name: string;
  theme: 'light' | 'dark';
}

export interface AppState {
  count: number;
  time: number;
  user: UserState;
}

export const store = createStore<AppState>({
  count: 0,
  time: Date.now(),
  user: {
    name: 'Alice',
    theme: 'dark',
  },
});
```

### 2. React Integration

Import `useStore` to consume the store in React. Property reads are automatically tracked during the component's render execution.

```tsx
import { useStore } from '@alenaksu/ustore/react';
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
import { consumeStore } from '@alenaksu/ustore/lit';
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
const detach = store.onChange((event) => {
  console.log('Mutated paths:', event.paths); // e.g. ["user.theme", "count"]
});

// To stop listening:
detach();
```

---

## ⚠️ Constraints & Caveats

To ensure correct path tracking and updates, uStore operates under a specific mental model:

### 1. The Exact Mutation Invariant

uStore assumes that the state's shape is static and properties are mutated directly.

- **Do:** Mutate properties directly.
  ```typescript
  store.state.user.name = 'Bob'; // Correct. Triggers 'user.name' listeners.
  ```
- **Avoid:** Overwriting intermediate parent nodes or entire branches.
  ```typescript
  store.state.user = { name: 'Bob', theme: 'light' }; // Avoid.
  ```
  _Why?_ Subscriptions are registered against exact paths (e.g. `user.name`). Overwriting the `user` parent node bypasses exact matching on `user.name`, causing nested subscribers to miss the update.

### 2. No Wildcard/Hierarchical Subscriptions

Subscription matching is precise and O(1).

- A component reading `state.user.name` is subscribed **only** to the path `user.name`.
- A component reading `state.user` (the parent object) is subscribed to `user`, but **not** to nested properties like `user.name`.
- Mutating a nested property (e.g., writing to `state.user.name`) will **not** trigger a parent subscription on `state.user`.

### 3. Array Operations

When rendering lists, map over static lists of keys/indices, and let individual list items subscribe directly to their specific indexes.

- **Do:**
  ```tsx
  // Parent maps over indices and passes them to child items
  const indices = [0, 1, 2];
  return indices.map((index) => <Item key={index} index={index} />);
  ```
  ```tsx
  // Child subscribes to its exact path
  const Item = ({ index }) => {
    const state = useStore(store);
    const item = state.list[index];
    return <div>{item.value}</div>;
  };
  ```

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

MIT © Alena Ksu
