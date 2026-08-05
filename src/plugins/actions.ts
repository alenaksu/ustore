import { ActionFactory, Store } from '../types';

/**
 * Enhances the store with custom domain actions, allowing state mutations
 * to be encapsulated within predefined, reusable functions.
 */
export const actions =
  <T extends Store<any>, Actions extends Record<string, any> = Record<string, any>>(
    factory: ActionFactory<T, Actions>,
  ) =>
  (store: T): T & { actions: Actions } => {
    const actionsInstance = factory(store);

    return Object.assign(store, { actions: actionsInstance }) as T & { actions: Actions };
  };
