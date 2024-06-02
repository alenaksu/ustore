import { createStateProxy, createStateRevocableProxy } from './state';

interface UpdateHandler {
  (): void;
}

export interface Store<S extends object> {
  state: S;
  subscribe(handler: UpdateHandler): S;
  unsubscribe(state: S): void;
}

export const createStore = <S extends object>(initialState: S): Store<S> => {
  /**
   * The state object is sealed to prevent modification of the state
   */
  const rawState = Object.seal(structuredClone(initialState));
  /**
   * The dependencies map keeps track of which properties are read by each subscription
   */
  const dependencies = new Map<UpdateHandler, Set<string>>();
  /**
   * The subscriptions map keeps track of the subscriptions and their associated handlers and revokers
   */
  const subscriptions = new WeakMap<
    S,
    {
      handler: UpdateHandler;
      revoke: () => void;
    }
  >();

  /**
   * Keeps track of which properties have been updated since the last update
   */
  const pendingPropertyUpdates = new Set<string>();
  let isUpdatePending = false;

  /**
   * Called whenever a property is written to the state
   */
  const onWrite = (propertyPath: string) => {
    scheduleUpdate(propertyPath);
  };

  /**
   * Schedules an update to be run in the next microtask. If an update is already pending, it will be skipped.
   */
  const scheduleUpdate = async (propertyPath: string) => {
    pendingPropertyUpdates.add(propertyPath);

    if (isUpdatePending) return;

    isUpdatePending = true;
    queueMicrotask(() => {
      for (const [handler, propertyPaths] of dependencies) {
        const handlerUpdates = new Set<string>();
        for (const propertyPath of propertyPaths) {
          if (pendingPropertyUpdates.has(propertyPath)) {
            handlerUpdates.add(propertyPath);
          }
        }

        if (handlerUpdates.size) {
          handler();
        }
      }

      pendingPropertyUpdates.clear();
      isUpdatePending = false;
    });
  };

  /**
   * Create a public state object that can be read from and written to
   */
  const state = createStateProxy(rawState, {
    onWrite,
  });

  return {
    state,
    /**
     * Returns a state object where every read operation is tracked and triggers an update when a property is written to
     */
    subscribe(handler: UpdateHandler) {
      dependencies.set(handler, new Set());

      const onRead = (propertyPath: string) => {
        dependencies.get(handler)!.add(propertyPath);
      };

      const { proxy, revoke } = createStateRevocableProxy(rawState, {
        onRead,
        onWrite,
      });

      subscriptions.set(proxy, { handler, revoke });

      return proxy;
    },
    /**
     * Unsubscribes from a state object updates. The state object will no longer be tracked for updates.
     */
    unsubscribe(state: S) {
      const { handler, revoke } = subscriptions.get(state)!;

      revoke();
      dependencies.delete(handler);
      subscriptions.delete(state);
    },
  };
};
