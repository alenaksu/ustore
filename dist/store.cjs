'use strict';

// src/state.ts
var isProxyable = (value) => {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
var createProxyHandler = (options, path = '') => {
  return {
    get(target, propertyName, receiver) {
      const value = Reflect.get(target, propertyName, receiver);
      if (typeof propertyName === 'symbol') {
        return value;
      }
      const propertyPath = path ? `${path}.${propertyName}` : propertyName;
      options.onRead?.(propertyPath);
      return isProxyable(value) ? createProxy(value, options, propertyPath) : value;
    },
    set(target, propertyName, newValue, receiver) {
      if (typeof propertyName === 'symbol') {
        return Reflect.set(target, propertyName, newValue, receiver);
      }
      const propertyPath = path ? `${path}.${propertyName}` : propertyName;
      options.onWrite?.(propertyPath);
      return Reflect.set(target, propertyName, newValue, receiver);
    },
  };
};
var createProxy = (state, options = {}, path = '') =>
  new Proxy(state, createProxyHandler(options, path));
var createRevocableProxy = (state, options = {}, path = '') =>
  Proxy.revocable(state, createProxyHandler(options, path));
var deepSet = (state, newState) => {
  for (const key of Object.keys(newState)) {
    if (isProxyable(newState[key]) && isProxyable(state[key])) {
      deepSet(state[key], newState[key]);
    } else {
      state[key] = newState[key];
    }
  }
};

// src/store.ts
var createStore = (stateInitializer) => {
  const rawState = {};
  const pathToHandlers = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  const pendingPropertyUpdates = /* @__PURE__ */ new Set();
  let isUpdatePending = false;
  const reset = () => {
    for (const key of Object.keys(rawState)) {
      delete rawState[key];
    }
    deepSet(rawState, structuredClone(stateInitializer()));
    flush(true);
  };
  const flush = (all = false) => {
    isUpdatePending = false;
    const changed = Array.from(pendingPropertyUpdates);
    const handlersToNotify = /* @__PURE__ */ new Set();
    pendingPropertyUpdates.clear();
    if (all) {
      for (const handlers of pathToHandlers.values()) {
        for (const handler of handlers) {
          handlersToNotify.add(handler);
        }
      }
      pathToHandlers.clear();
    } else {
      for (const pendingPath of changed) {
        const handlers = pathToHandlers.get(pendingPath) ?? [];
        for (const handler of handlers) {
          handlersToNotify.add(handler);
        }
        pathToHandlers.delete(pendingPath);
      }
    }
    if (changed.length) {
      const event = {
        paths: all ? Object.keys(rawState) : changed,
      };
      for (const listener of listeners) {
        listener(event);
      }
    }
    for (const handler of handlersToNotify) {
      handler();
    }
  };
  const onWrite = (propertyPath) => {
    pendingPropertyUpdates.add(propertyPath);
    if (isUpdatePending) return;
    isUpdatePending = true;
    queueMicrotask(flush);
  };
  reset();
  const state = createProxy(rawState, {
    onWrite,
  });
  const attach = (handler) => {
    const readPaths = /* @__PURE__ */ new Set();
    const onRead = (propertyPath) => {
      readPaths.add(propertyPath);
      if (!pathToHandlers.has(propertyPath)) {
        pathToHandlers.set(propertyPath, /* @__PURE__ */ new Set());
      }
      pathToHandlers.get(propertyPath).add(handler);
    };
    const { proxy, revoke } = createRevocableProxy(rawState, {
      onRead,
      onWrite,
    });
    let detached = false;
    const detach = () => {
      if (detached) return;
      detached = true;
      revoke();
      for (const path of readPaths) {
        const handlers = pathToHandlers.get(path);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            pathToHandlers.delete(path);
          }
        }
      }
      readPaths.clear();
    };
    return { state: proxy, detach };
  };
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const patch = (partialState) => {
    deepSet(state, partialState);
  };
  const snapshot = () => structuredClone(rawState);
  const store = {
    state,
    patch,
    reset,
    snapshot,
    attach,
    subscribe,
    with: (plugin) => plugin(store),
  };
  return store;
};

exports.createStore = createStore;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=store.cjs.map
