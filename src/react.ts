import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Store } from './store';

const StoreContext = createContext<Store | null>(null);

const useRerender = () => {
  const [, rerender] = useState({});
  return () => {
    rerender({});
  };
};

export const StoreProvider = StoreContext.Provider;

export const useStore = <S>() => {
  const store = useContext(StoreContext);
  const rerender = useRerender();
  const state = useMemo(() => {
    if (!store) return;

    const state = store.subscribe(rerender);

    return state;
  }, []);

  useEffect(() => {
    return () => {
      if (store && state) {
        store.unsubscribe(state);
      }
    };
  }, []);

  return state as S;
};
