import { useRef, useEffect, useState } from 'react';
import { useStore } from '../../react';
import { demoStore, TOTAL_CELLS } from '../store';

export const ReactCell = ({ index }: { index: number }) => {
  const state = useStore(demoStore);
  const cell = state.grid.cells[index];

  const renderCount = useRef(0);
  renderCount.current++;

  const [flash, setFlash] = useState(false);
  const prevValue = useRef(cell.value);

  useEffect(() => {
    if (cell.value !== prevValue.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 400);
      prevValue.current = cell.value;
      return () => clearTimeout(t);
    }
  }, [cell.value]);

  const handleClick = () => {
    const target = demoStore.state.grid.cells[index];
    target.value++;
    target.hue = (target.hue + 25) % 360;
  };

  return (
    <div
      className={`cell-wrapper ${flash ? 'cell-flash' : ''}`}
      style={{ backgroundColor: `hsla(${cell.hue}, 70%, 35%, 0.8)` }}
      onClick={handleClick}
    >
      <span className="cell-render-badge">{renderCount.current}</span>
      <span className="cell-value">{cell.value}</span>
    </div>
  );
};

const GlobalCounterWidget = () => {
  const state = useStore(demoStore);
  return (
    <div className="widget-box">
      <span className="widget-label">Global Counter</span>
      <span className="widget-content">{state.count}</span>
      <button onClick={() => demoStore.state.count++}>+1 Count</button>
    </div>
  );
};

const TimeSyncWidget = () => {
  const state = useStore(demoStore);
  return (
    <div className="widget-box">
      <span className="widget-label">Time Sync</span>
      <span className="widget-content">{new Date(state.time).toLocaleTimeString()}</span>
    </div>
  );
};

export const App = () => {
  const appRenderCount = useRef(0);
  appRenderCount.current++;

  const indices = useRef(Array.from({ length: TOTAL_CELLS }, (_, i) => i));

  return (
    <div className="panel panel-react">
      <div className="panel-header">
        <div className="panel-title">
          <span>React Application</span>
        </div>
        <span className="panel-badge">Panel Renders: {appRenderCount.current}</span>
      </div>

      <div className="matrix-grid">
        {indices.current.map((index) => (
          <ReactCell key={index} index={index} />
        ))}
      </div>

      <div className="widgets-row">
        <GlobalCounterWidget />
        <TimeSyncWidget />
      </div>
    </div>
  );
};
