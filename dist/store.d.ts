import { S as Store } from './types-B2iYxHt0.js';

/**
 * Creates a reactive store with a deep-reactive state container.
 *
 * @param stateInitializer - A function that returns the initial state object.
 * @returns A new Store instance.
 */
declare const createStore: <S extends Record<string, any>>(stateInitializer: () => S) => Store<S>;

export { createStore };
