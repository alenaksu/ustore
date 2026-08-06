type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends (infer U)[] ? U[] : T[P] extends object ? DeepPartial<T[P]> : T[P];
};
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
type EventMap = Record<string, any>;
interface EventEmitter<Events extends EventMap = EventMap> {
    on<K extends keyof Events & string>(eventName: K, listener: (payload: Events[K]) => void): () => void;
    off<K extends keyof Events & string>(eventName: K, listener: (payload: Events[K]) => void): void;
    emit<K extends keyof Events & string>(eventName: K, payload: Events[K]): void;
}
/**
 * Factory function to instantiate custom store actions.
 */
type ActionFactory<T extends Store<any> = Store<any>, Actions extends Record<string, any> = Record<string, any>> = (store: T) => Actions;
/**
 * A reactive state container.
 */
interface Store<S extends Record<string, any> = {}> {
    /**
     * The root state proxy. Reading from or writing to this proxy
     * will not trigger subscriptions; use `attach` to obtain a tracked proxy.
     */
    state: S;
    /** Resets the store state to its initial value. */
    reset: () => void;
    /**
     * Deeply patches the store state with partial changes, updating plain objects in-place.
     * Array values are replaced atomically (never merged element-wise).
     *
     * @param partialState - A partial representation of the state structure containing properties to update.
     */
    patch: (partialState: DeepPartial<S>) => void;
    /**
     * Returns a deep clone snapshot of the current state.
     */
    snapshot: () => S;
    /**
     * Creates a tracked state proxy bound to a change handler.
     * Accessing properties on the returned `state` automatically registers them for updates.
     *
     * @param handler - The callback function to run when tracked properties change.
     * @returns An attachment holding the tracked state proxy, patch function, and detach function.
     */
    attach(handler: UpdateHandler): Attachment<S>;
    /**
     * Registers a listener to be notified of all state changes across the store.
     *
     * @param listener - Callback invoked with changed paths.
     * @returns A function to unregister the listener.
     */
    subscribe(listener: ChangeListener): () => void;
    /**
     * Chains a plugin to the store, returning the enhanced store instance.
     * Allows progressive capability composition with precise type inference.
     */
    with<U>(plugin: (store: this) => U): U;
}
/**
 * Options for configuring state history tracking.
 */
interface HistoryOptions<S extends Record<string, any> = Record<string, any>> {
    /** Maximum number of history snapshots to retain. Default: 50 */
    limit?: number;
    /**
     * Controls whether state mutations automatically create history snapshots.
     * - `boolean`: `true` to record all mutations (default), `false` to record only manually via `record()`.
     * - `(state: S) => boolean`: Predicate function filtering which states to record.
     */
    shouldRecord?: boolean | ((state: S) => boolean);
}
/**
 * History manager interface for controlling undo, redo, and snapshot history.
 */
interface HistoryManager<S extends Record<string, any>> {
    /** Reverts store state to the previous snapshot via `store.patch()`. */
    undo: () => boolean;
    /** Re-applies the next state snapshot via `store.patch()`. */
    redo: () => boolean;
    /** Manually records a snapshot of the current state. */
    record: () => void;
    /** Clears history stack and resets index to current state. */
    clear: () => void;
    /** Pauses automatic recording of snapshots. */
    pause: () => void;
    /** Resumes automatic recording of snapshots. */
    resume: () => void;
    /** True if undo is available. */
    readonly canUndo: boolean;
    /** True if redo is available. */
    readonly canRedo: boolean;
    /** Current index in the history stack. */
    readonly index: number;
    /** Array of recorded state snapshots. */
    readonly stack: ReadonlyArray<S>;
    /**
     * Registers a listener to be notified when the history stack or index changes
     * (e.g. on undo, redo, record, clear).
     *
     * @param listener - Callback triggered when history changes.
     * @returns Unsubscribe function.
     */
    subscribe: (listener: () => void) => () => void;
    /** Unsubscribes from store change events to clean up resources. */
    destroy: () => void;
}

export type { ActionFactory as A, EventMap as E, HistoryOptions as H, Store as S, HistoryManager as a, EventEmitter as b };
