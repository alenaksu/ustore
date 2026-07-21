'use strict';

// src/state.ts
var isProxyable = (value) => {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return true;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
var createProxyHandler = (options, path = "") => {
  return {
    get(target, propertyName, receiver) {
      const value = Reflect.get(target, propertyName, receiver);
      const propertyPath = path ? `${path}.${propertyName}` : propertyName;
      options.onRead?.(propertyPath);
      return isProxyable(value) ? createProxy(value, options, propertyPath) : value;
    },
    set(target, propertyName, newValue, receiver) {
      const propertyPath = path ? `${path}.${propertyName}` : propertyName;
      options.onWrite?.(propertyPath);
      return Reflect.set(target, propertyName, newValue, receiver);
    }
  };
};
var createProxy = (state, options = {}, path = "") => new Proxy(state, createProxyHandler(options, path));
var createRevocableProxy = (state, options = {}, path = "") => Proxy.revocable(state, createProxyHandler(options, path));

// src/store.ts
var createStore = (initialState) => {
  const rawState = Object.seal(structuredClone(initialState));
  const pathToHandlers = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  const pendingPropertyUpdates = /* @__PURE__ */ new Set();
  let isUpdatePending = false;
  const flush = () => {
    isUpdatePending = false;
    const changed = Array.from(pendingPropertyUpdates);
    pendingPropertyUpdates.clear();
    const handlersToNotify = /* @__PURE__ */ new Set();
    for (const pendingPath of changed) {
      const handlers = pathToHandlers.get(pendingPath);
      if (handlers) {
        for (const handler of handlers) {
          handlersToNotify.add(handler);
        }
      }
    }
    if (listeners.size && changed.length) {
      const event = {
        paths: changed
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
  const state = createProxy(rawState, {
    onWrite
  });
  return {
    state,
    attach(handler) {
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
        onWrite
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
    },
    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
};

exports.createStore = createStore;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=store.cjs.map