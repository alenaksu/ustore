import { useStore } from '../../react';

export const Time = () => {
  const state = useStore<{
    time: number;
  }>();

  return (
    <>
      <h1>{new Date(state.time).toLocaleTimeString()}</h1>
    </>
  );
};
