import { ReactiveElement } from 'lit';
import { Context, ContextConsumer, createContext, provide } from '@lit/context';
import { Store } from './store';

const storeContext: Context<unknown, Store<any>> = createContext(Symbol('store'));

export const consumeState = () =>
  function <C extends ReactiveElement>(
    target: ClassAccessorDecoratorTarget<C, unknown>,
    propertyKey: PropertyKey,
  ) {
    const ctor = target.constructor as typeof ReactiveElement;
    ctor.addInitializer((element: ReactiveElement): void => {
      new ContextConsumer(element, {
        context: storeContext,
        callback(store) {
          element.addController({
            hostConnected() {
              Object.defineProperty(element, propertyKey, {
                value: store.subscribe(element.requestUpdate.bind(element)),
                writable: false,
                configurable: true,
              });
            },
            hostDisconnected() {
              store.unsubscribe((element as any)[propertyKey]);
            },
          });
        },
      });
    });
  };

export const provideState = () => provide({ context: storeContext });
