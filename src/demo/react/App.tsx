import { useEffect, useMemo } from 'react';
import { StoreProvider } from '../../react';
import { createStore } from '../../store';
import { Counter } from './Counter';
import { Time } from './Time';

export const App = () => {
  const store = useMemo(
    () =>
      createStore({
        time: Date.now(),
        count: 0,
      }),
    [],
  );

  useEffect(() => {
    setInterval(() => {
      store.state.time = Date.now();
    }, 1000);
  }, []);

  return (
    <StoreProvider value={store}>
      <Time />
      <Counter />
    </StoreProvider>
  );
};
