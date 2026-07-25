// src/lit.ts
var consumeStore = (store) =>
  function (target, propertyKey) {
    const ctor = target.constructor;
    ctor.addInitializer((element) => {
      let detach;
      element.addController({
        hostConnected() {
          const handle = store.attach(element.requestUpdate.bind(element));
          detach = handle.detach;
          Object.defineProperty(element, propertyKey, {
            value: handle.state,
            writable: false,
            configurable: true,
          });
        },
        hostDisconnected() {
          if (detach) {
            detach();
            detach = void 0;
          }
        },
      });
    });
  };

export { consumeStore };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=lit.js.map
