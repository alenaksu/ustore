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
  onChange(listener: ChangeListener): () => void;
}

/**
 * Creates a reactive store with a deep-reactive state container.
 *
 * @param initialState - The initial state object.
 * @returns A new Store instance.
 */
export const createStore = <S extends Record<string, any>>(initialState: S): Store<S> => {
  const rawState = Object.seal(structuredClone(initialState));

  /**
   * Reverse-mapping for fast and correct update lookup
   */
  const pathToHandlers = new Map<string, Set<UpdateHandler>>();

  const listeners = new Set<ChangeListener>();

  const pendingPropertyUpdates = new Set<string>();
  let isUpdatePending = false;

  const flush = () => {
    isUpdatePending = false;
    const changed = Array.from(pendingPropertyUpdates);
    pendingPropertyUpdates.clear();

    const handlersToNotify = new Set<UpdateHandler>();
    for (const pendingPath of changed) {
      const handlers = pathToHandlers.get(pendingPath);
      if (handlers) {
        for (const handler of handlers) {
          handlersToNotify.add(handler);
        }
      }
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

  return {
    state,
    attach(handler: UpdateHandler) {
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
    },
    onChange(listener: ChangeListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
