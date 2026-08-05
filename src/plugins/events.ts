import { EventEmitter, EventMap, Store } from '../types';

/**
 * Adds event emission and subscription capabilities to the store.
 */
export const events =
  <Events extends EventMap = EventMap>() =>
  <T extends Store<any>>(store: T): T & EventEmitter<Events> => {
    const listeners = new Map<keyof Events & string, Set<(payload: unknown) => void>>();

    const on = <K extends keyof Events & string>(
      eventName: K,
      listener: (payload: Events[K]) => void,
    ) => {
      if (!listeners.has(eventName)) {
        listeners.set(eventName, new Set());
      }

      const handlers = listeners.get(eventName)!;
      handlers.add(listener as (payload: unknown) => void);

      return () => {
        handlers.delete(listener as (payload: unknown) => void);
        if (handlers.size === 0) {
          listeners.delete(eventName);
        }
      };
    };

    const off = <K extends keyof Events & string>(
      eventName: K,
      listener: (payload: Events[K]) => void,
    ) => {
      const handlers = listeners.get(eventName);
      if (!handlers) return;

      handlers.delete(listener as (payload: unknown) => void);
      if (handlers.size === 0) {
        listeners.delete(eventName);
      }
    };

    const emit = <K extends keyof Events & string>(eventName: K, payload: Events[K]) => {
      const handlers = listeners.get(eventName);
      if (!handlers) return;

      for (const listener of handlers) {
        listener(payload);
      }
    };

    return Object.assign(store, { on, off, emit }) as T & EventEmitter<Events>;
  };
