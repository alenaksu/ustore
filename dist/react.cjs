'use strict';

var react = require('react');

// src/react.ts
var useStore = (store) => {
  const [, force] = react.useState(0);
  const { state, detach } = react.useMemo(() => {
    return store.attach(() => force((n) => n + 1));
  }, [store]);
  react.useEffect(() => {
    return () => {
      detach();
    };
  }, [detach]);
  return state;
};

exports.useStore = useStore;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=react.cjs.map
