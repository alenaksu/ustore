import { ReactiveElement } from 'lit';
import { Store } from './store';

/**
 * A property decorator for Lit elements that binds a property to a Store's state.
 *
 * The decorator automatically tracks which properties of the state are read in the element,
 * and schedules an update (`requestUpdate`) when those properties are mutated. It automatically
 * subscribes when the element is connected and unsubscribes when disconnected.
 *
 * @param store - The Store instance to track.
 */
export const consumeStore = <S extends Record<string, any>>(store: Store<S>) =>
  function <C extends ReactiveElement>(target: C, propertyKey: PropertyKey) {
    const ctor = target.constructor as typeof ReactiveElement;
    ctor.addInitializer((element: ReactiveElement): void => {
      let detach: (() => void) | undefined;

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
            detach = undefined;
          }
        },
      });
    });
  };
