// src/plugins/history.ts
var withHistory = (store, options = {}) => {
  const limit = options.limit ?? 50;
  let isPaused = false;
  let isRestoring = false;
  let stack = [store.snapshot()];
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
    stack.push(store.snapshot());
    if (stack.length > limit) {
      stack.shift();
    } else {
      index++;
    }
  };
  const unsubscribe = store.subscribe(() => {
    record();
  });
  const restoreState = (targetIndex) => {
    index = targetIndex;
    isRestoring = true;
    store.patch(stack[index]);
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
    clear: () => {
      stack = [store.snapshot()];
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

export { withHistory };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map
