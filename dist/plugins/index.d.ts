import {
  H as HistoryOptions,
  S as Store,
  a as HistoryManager,
  E as EventMap,
  b as EventEmitter,
  A as ActionFactory,
} from '../types-CP6UPwvI.js';

/**
 * Adds state history capabilities (undo, redo, and snapshot tracking) to the store.
 */
declare const history: <S extends Record<string, any>>(
  options?: HistoryOptions<S>,
) => <T extends Store<S>>(
  store: T,
) => T & {
  history: HistoryManager<S>;
};

/**
 * Adds event emission and subscription capabilities to the store.
 */
declare const events: <Events extends EventMap = EventMap>() => <T extends Store<any>>(
  store: T,
) => T & EventEmitter<Events>;

/**
 * Enhances the store with custom domain actions, allowing state mutations
 * to be encapsulated within predefined, reusable functions.
 */
declare const actions: <
  T extends Store<any>,
  Actions extends Record<string, any> = Record<string, any>,
>(
  factory: ActionFactory<T, Actions>,
) => (store: T) => T & {
  actions: Actions;
};

export { actions, events, history };
