import { useState, useMemo, useEffect } from 'react';

// src/react.ts
var useStore = (store) => {
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

export { useStore };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=react.js.map
