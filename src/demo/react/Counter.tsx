import { useStore } from '../../react';

export const Counter = () => {
  const state = useStore<{
    count: number;
  }>();

  return (
    <>
      <div>Clicked: {state.count} times</div>
      <button onClick={() => state.count++}>Click Me</button>
    </>
  );
};
