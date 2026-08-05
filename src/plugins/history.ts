import { HistoryManager, HistoryOptions, Store } from '../types';

/**
 * Adds state history capabilities (undo, redo, and snapshot tracking) to the store.
 */
export const history = <S extends Record<string, any>>(options: HistoryOptions<S> = {}) => {
  return <T extends Store<S>>(store: T): T & { history: HistoryManager<S> } => {
    const limit = options.limit ?? 50;
    let isPaused = false;
    let isRestoring = false;

    let stack: S[] = [store.snapshot()];
    let index = 0;

    const historyListeners = new Set<() => void>();

    const notifyHistoryListeners = () => {
      for (const listener of historyListeners) {
        listener();
      }
    };

    const record = () => {
      if (isPaused || isRestoring) return;

      if (options.shouldRecord === false) return;
      if (typeof options.shouldRecord === 'function' && !options.shouldRecord(store.state)) {
        return;
      }

      if (index < stack.length - 1) {
        stack = stack.slice(0, index + 1);
      }

      stack.push(store.snapshot());
      if (stack.length > limit) {
        stack.shift();
      } else {
        index++;
      }

      notifyHistoryListeners();
    };

    const unsubscribe = store.subscribe(() => {
      record();
    });

    const restoreState = (targetIndex: number) => {
      index = targetIndex;
      isRestoring = true;
      store.patch(stack[index]);

      notifyHistoryListeners();

      queueMicrotask(() => {
        isRestoring = false;
      });
      return true;
    };

    const undo = (): boolean => {
      if (index <= 0) return false;
      return restoreState(index - 1);
    };

    const redo = (): boolean => {
      if (index >= stack.length - 1) return false;
      return restoreState(index + 1);
    };

    const historyManager: HistoryManager<S> = {
      undo,
      redo,
      record,
      subscribe: (listener: () => void) => {
        historyListeners.add(listener);
        return () => {
          historyListeners.delete(listener);
        };
      },
      clear: () => {
        stack = [store.snapshot()];
        index = 0;
        notifyHistoryListeners();
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
        historyListeners.clear();
      },
    };

    const enhancedStore = Object.assign(store, { history: historyManager }) as T & {
      history: HistoryManager<S>;
    };
    return enhancedStore;
  };
};
