import { useEffect, useMemo, useState } from 'react';
import { Store } from './store';

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
export const useStore = <S extends Record<string, any>>(store: Store<S>): S => {
  const [, force] = useState(0);

  const { state, detach } = useMemo(() => {
    return store.attach(() => force((n) => n + 1));
  }, [store]);

  useEffect(() => {
    return () => {
      detach();
    };
  }, [detach]);

  return state;
};
