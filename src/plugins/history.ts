import { HistoryManager, HistoryOptions, Store, StoreWithHistory } from '../types';

/**
 * Creates a plain deep clone of a state object, unwrapping proxies.
 */
const cloneState = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Enhances a uStore instance with state history tracking (Undo / Redo / Snapshots).
 *
 * @param store - The uStore instance to enhance.
 * @param options - Configuration options for history tracking.
 * @returns The original store augmented with a `history` manager property.
 */
export const withHistory = <S extends Record<string, any>>(
  store: Store<S>,
  options: HistoryOptions<S> = {},
): StoreWithHistory<S> => {
  const limit = options.limit ?? 50;
  let isPaused = false;
  let isRestoring = false;

  let stack: S[] = [cloneState(store.state)];
  let index = 0;

  const record = () => {
    if (isPaused || isRestoring) return;

    if (options.shouldRecord === false) return;
    if (typeof options.shouldRecord === 'function' && !options.shouldRecord(store.state)) {
      return;
    }

    // Truncate redo stack when recording a new mutation after undo operations
    if (index < stack.length - 1) {
      stack = stack.slice(0, index + 1);
    }

    stack.push(cloneState(store.state));
    if (stack.length > limit) {
      stack.shift();
    } else {
      index++;
    }
  };

  const unsubscribe = store.subscribe(() => {
    record();
  });

  const undo = (): boolean => {
    if (index <= 0) return false;
    index--;
    isRestoring = true;
    try {
      store.patch(cloneState(stack[index]));
    } finally {
      isRestoring = false;
    }
    return true;
  };

  const redo = (): boolean => {
    if (index >= stack.length - 1) return false;
    index++;
    isRestoring = true;
    try {
      store.patch(cloneState(stack[index]));
    } finally {
      isRestoring = false;
    }
    return true;
  };

  const historyManager: HistoryManager<S> = {
    undo,
    redo,
    record,
    clear: () => {
      stack = [cloneState(store.state)];
      index = 0;
    },
    pause: () => {
      isPaused = true;
    },
    resume: () => {
      isPaused = false;
    },
    get canUndo() {
      return index > 0;
    },
    get canRedo() {
      return index < stack.length - 1;
    },
    get index() {
      return index;
    },
    get stack() {
      return stack;
    },
    destroy: () => {
      unsubscribe();
    },
  };

  return Object.assign(store, { history: historyManager });
};
