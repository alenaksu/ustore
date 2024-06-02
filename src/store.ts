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
  const rawState = Object.seal(structuredClone(initialState));
  const dependencies = new Map<UpdateHandler, Set<string>>();
  const pendingPropertyUpdates = new Set<string>();
  const subscriptions = new WeakMap<
    S,
    {
      handler: UpdateHandler;
      revoke: () => void;
    }
  >();
  let isUpdatePending = false;

  const onWrite = (propertyPath: string) => {
    scheduleUpdate(propertyPath);
  };

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

  const state = createStateProxy(rawState, {
    onWrite,
  });

  return {
    state,
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
    unsubscribe(state: S) {
      const { handler, revoke } = subscriptions.get(state)!;

      revoke();
      dependencies.delete(handler);
      subscriptions.delete(state);
    },
  };
};
