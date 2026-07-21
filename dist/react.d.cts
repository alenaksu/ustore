import { Store } from './store.cjs';

/**
 * A React hook to consume and track the state of a Store.
 *
 * The hook automatically tracks which properties of the state are read during
 * component rendering, and will re-render the component when those specific
 * properties are updated.
 *
 * @param store - The Store instance to track.
 * @returns A tracked state proxy.
 */
declare const useStore: <S extends Record<string, any>>(store: Store<S>) => S;

export { useStore };
