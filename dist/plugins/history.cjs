'use strict';

// src/plugins/history.ts
var cloneState = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
};
var withHistory = (store, options = {}) => {
  const limit = options.limit ?? 50;
  let isPaused = false;
  let isRestoring = false;
  let stack = [cloneState(store.state)];
  let index = 0;
  const record = () => {
    if (isPaused || isRestoring) return;
    if (options.shouldRecord === false) return;
    if (typeof options.shouldRecord === 'function' && !options.shouldRecord(store.state)) {
      return;
    }
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
  const undo = () => {
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
  const redo = () => {
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
  const historyManager = {
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

exports.withHistory = withHistory;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=history.cjs.map
