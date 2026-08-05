import { S as Store } from './types-CP6UPwvI.js';

declare const createStore: <S extends Record<string, any>>(stateInitializer: () => S) => Store<S>;

export { createStore };
