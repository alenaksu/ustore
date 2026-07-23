interface UpdateHandler {
    (): void;
}
/**
 * Event payload emitted to registered change listeners when the store state changes.
 */
interface ChangeEvent {
    /** The paths of the properties that were mutated. */
    paths: string[];
}
/**
 * A callback function triggered when the store state is mutated.
 */
type ChangeListener = (event: ChangeEvent) => void;
/**
 * An attachment containing the tracked state proxy and its detach function.
 */
interface Attachment<S> {
    /** The tracked state proxy for a specific consumer. */
    state: S;
    /** Unsubscribes the tracked state proxy, stopping further updates to its handler. */
    detach: () => void;
}
/**
 * A reactive state container.
 */
interface Store<S extends Record<string, any> = {}> {
    /**
     * The root state proxy. Reading from or writing to this proxy
     * will not trigger subscriptions; use `attach` to obtain a tracked proxy.
     */
    state: S;
    /**
     * Creates a tracked state proxy bound to a change handler.
     * Accessing properties on the returned `state` automatically registers them for updates.
     *
     * @param handler - The callback function to run when tracked properties change.
     * @returns An attachment holding the tracked state proxy and its detach function.
     */
    attach(handler: UpdateHandler): Attachment<S>;
    /**
     * Registers a listener to be notified of all state changes across the store.
     *
     * @param listener - Callback invoked with changed paths.
     * @returns A function to unregister the listener.
     */
    onChange(listener: ChangeListener): () => void;
    /**
     * Registers a listener to be notified when the value of a specific property or derived value changes.
     *
     * @param selector - A function that selects a property or computed value from the state.
     * @param handler - Callback invoked with the new and previous values when the selected value changes.
     * @returns A function to unregister the listener.
     */
    watch<T>(selector: (state: S) => T, handler: (value: T, prevValue: T) => void): () => void;
}
/**
 * Creates a reactive store with a deep-reactive state container.
 *
 * @param initialState - The initial state object.
 * @returns A new Store instance.
 */
declare const createStore: <S extends Record<string, any>>(initialState: S) => Store<S>;

export { type Attachment, type ChangeEvent, type ChangeListener, type Store, createStore };
