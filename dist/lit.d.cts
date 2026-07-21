import { ReactiveElement } from 'lit';
import { Store } from './store.cjs';

/**
 * A property decorator for Lit elements that binds a property to a Store's state.
 *
 * The decorator automatically tracks which properties of the state are read in the element,
 * and schedules an update (`requestUpdate`) when those properties are mutated. It automatically
 * subscribes when the element is connected and unsubscribes when disconnected.
 *
 * @param store - The Store instance to track.
 */
declare const consumeStore: <S extends Record<string, any>>(store: Store<S>) => <C extends ReactiveElement>(target: C, propertyKey: PropertyKey) => void;

export { consumeStore };
