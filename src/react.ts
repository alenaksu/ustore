import { createContext, useContext, useMemo, useState } from 'react';
import { Store } from './store';

const StoreContext = createContext<Store | null>(null);

const useRerender = () => {
  const [, rerender] = useState({});
  return () => {
    rerender({});
  };
};

export const StoreProvider = StoreContext.Provider;

export const useStore = () => {
  const store = useContext(StoreContext);
  const rerender = useRerender();
  const state = useMemo(() => {
    if (!store) return;

    const state = store.subscribe(rerender);

    return () => {
      store?.unsubscribe(state);
    };
  }, []);

  return state;
};
