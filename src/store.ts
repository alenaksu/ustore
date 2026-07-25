import { createProxy, createRevocableProxy } from './state';

interface UpdateHandler {
  (): void;
}

/**
 * Event payload emitted to registered change listeners when the store state changes.
 */
export interface ChangeEvent {
  /** The paths of the properties that were mutated. */
  paths: string[];
}

/**
 * A callback function triggered when the store state is mutated.
 */
export type ChangeListener = (event: ChangeEvent) => void;

/**
 * An attachment containing the tracked state proxy and its detach function.
 */
export interface Attachment<S> {
  /** The tracked state proxy for a specific consumer. */
  state: S;
  /** Unsubscribes the tracked state proxy, stopping further updates to its handler. */
  detach: () => void;
}

/**
 * A reactive state container.
 */
export interface Store<S extends Record<string, any> = {}> {
  /**
   * The root state proxy. Reading from or writing to this proxy
   * will not trigger subscriptions; use `attach` to obtain a tracked proxy.
   */
  state: S;

  /** Resets the store state to its initial value. */
  reset: () => void;

  /**
   * Creates a tracked state proxy bound to a change handler.
   * Accessing properties on the returned `state` automatically registers them for updates.
   *
   * @param handler - The callback function to run when tracked properties change.
   * @returns An attachment holding the tracked state proxy and its detach function.
   */
  attach(handler: UpdateHandler): Attachment<S>;

  /**
   * Registers a listener to be notified of all state changes across the store.
   *
   * @param listener - Callback invoked with changed paths.
   * @returns A function to unregister the listener.
   */
  subscribe(listener: ChangeListener): () => void;

  /**
   * Registers a listener to be notified when the value of a specific property or derived value changes.
   *
   * @param selector - A function that selects a property or computed value from the state.
   * @param handler - Callback invoked with the new and previous values when the selected value changes.
   * @returns A function to unregister the listener.
   */
  watch<T>(selector: (state: S) => T, handler: (value: T, prevValue: T) => void): () => void;
}

/**
 * Creates a reactive store with a deep-reactive state container.
 *
 * @param stateInitializer - A function that returns the initial state object.
 * @returns A new Store instance.
 */
export const createStore = <S extends Record<string, any>>(stateInitializer: () => S): Store<S> => {
  let rawState!: S;

  /**
   * Reverse-mapping for fast and correct update lookup
   */
  const pathToHandlers = new Map<string, Set<UpdateHandler>>();

  const listeners = new Set<ChangeListener>();

  const pendingPropertyUpdates = new Set<string>();
  let isUpdatePending = false;

  const reset = () => {
    rawState = Object.seal(structuredClone(stateInitializer()));
  };

  const flush = () => {
    isUpdatePending = false;
    const changed = Array.from(pendingPropertyUpdates);
    pendingPropertyUpdates.clear();

    const handlersToNotify = new Set<UpdateHandler>();
    for (const pendingPath of changed) {
      const handlers = pathToHandlers.get(pendingPath) ?? [];
      for (const handler of handlers) {
        handlersToNotify.add(handler);
      }

      // Clear the handlers for this path after notifying them, so that they can be re-registered if they read the property again during their update.
      pathToHandlers.delete(pendingPath);
    }

    if (listeners.size && changed.length) {
      const event: ChangeEvent = {
        paths: changed,
      };

      for (const listener of listeners) {
        listener(event);
      }
    }

    for (const handler of handlersToNotify) {
      handler();
    }
  };

  const onWrite = (propertyPath: string) => {
    pendingPropertyUpdates.add(propertyPath);

    if (isUpdatePending) return;

    isUpdatePending = true;
    queueMicrotask(flush);
  };

  const state = createProxy(rawState, {
    onWrite,
  });

  const attach = (handler: UpdateHandler): Attachment<S> => {
    const readPaths = new Set<string>();

    const onRead = (propertyPath: string) => {
      readPaths.add(propertyPath);

      if (!pathToHandlers.has(propertyPath)) {
        pathToHandlers.set(propertyPath, new Set());
      }
      pathToHandlers.get(propertyPath)!.add(handler);
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

  const subscribe = (listener: ChangeListener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const watch = <T>(
    selector: (state: S) => T,
    listener: (value: T, prevValue: T) => void,
  ): (() => void) => {
    let prevValue: T;
    const { detach, state: attachedState } = attach(() => {
      const newValue = selector(attachedState);
      if (newValue !== prevValue) {
        listener(newValue, prevValue);
        prevValue = newValue;
      }
    });

    // Initialize the last value and invoke the handler for the first time
    prevValue = selector(attachedState);

    return detach;
  };

  // Initialize the store state to its initial value
  reset();

  return {
    state,
    reset,
    attach,
    subscribe,
    watch,
  };
};
