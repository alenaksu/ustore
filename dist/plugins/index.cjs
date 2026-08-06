'use strict';

// src/plugins/history.ts
var history = (options = {}) => {
  return (store) => {
    const limit = options.limit ?? 50;
    let isPaused = false;
    let isRestoring = false;
    let stack = [store.snapshot()];
    let index = 0;
    const historyListeners = /* @__PURE__ */ new Set();
    const notifyHistoryListeners = () => {
      for (const listener of historyListeners) {
        listener();
      }
    };
    const record = () => {
      if (isPaused || isRestoring) return;
      if (options.shouldRecord === false) return;
      if (typeof options.shouldRecord === "function" && !options.shouldRecord(store.state)) {
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
    const restoreState = (targetIndex) => {
      index = targetIndex;
      isRestoring = true;
      store.patch(stack[index]);
      notifyHistoryListeners();
      queueMicrotask(() => {
        isRestoring = false;
      });
      return true;
    };
    const undo = () => {
      if (index <= 0) return false;
      return restoreState(index - 1);
    };
    const redo = () => {
      if (index >= stack.length - 1) return false;
      return restoreState(index + 1);
    };
    const historyManager = {
      undo,
      redo,
      record,
      subscribe: (listener) => {
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
      }
    };
    const enhancedStore = Object.assign(store, { history: historyManager });
    return enhancedStore;
  };
};

// src/plugins/events.ts
var events = () => (store) => {
  const listeners = /* @__PURE__ */ new Map();
  const on = (eventName, listener) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, /* @__PURE__ */ new Set());
    }
    const handlers = listeners.get(eventName);
    handlers.add(listener);
    return () => {
      handlers.delete(listener);
      if (handlers.size === 0) {
        listeners.delete(eventName);
      }
    };
  };
  const off = (eventName, listener) => {
    const handlers = listeners.get(eventName);
    if (!handlers) return;
    handlers.delete(listener);
    if (handlers.size === 0) {
      listeners.delete(eventName);
    }
  };
  const emit = (eventName, payload) => {
    const handlers = listeners.get(eventName);
    if (!handlers) return;
    for (const listener of handlers) {
      listener(payload);
    }
  };
  return Object.assign(store, { on, off, emit });
};

// src/plugins/actions.ts
var actions = (factory) => (store) => {
  const actionsInstance = factory(store);
  return Object.assign(store, { actions: actionsInstance });
};

exports.actions = actions;
exports.events = events;
exports.history = history;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.cjs.map