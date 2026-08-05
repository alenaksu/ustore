import { S as Store } from './types-CP6UPwvI.cjs';

declare const createStore: <S extends Record<string, any>>(stateInitializer: () => S) => Store<S>;

export { createStore };
