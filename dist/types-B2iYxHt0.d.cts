type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
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
  /**
   * Deeply patches the store state with partial changes, updating properties in-place.
   *
   * @param partialState - A partial representation of the state structure containing properties to update.
   */
  patch: (partialState: Partial<S>) => void;
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
  /** Resets the store state to its initial value. */
  reset: () => void;
  /**
   * Deeply patches the store state with partial changes, updating properties in-place.
   *
   * @param partialState - A partial representation of the state structure containing properties to update.
   */
  patch: (partialState: DeepPartial<S>) => void;
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
   * Registers a listener to be notified when the value of a specific property or derived value changes.
   *
   * @param selector - A function that selects a property or computed value from the state.
   * @param handler - Callback invoked with the new and previous values when the selected value changes.
   * @returns A function to unregister the listener.
   */
  watch<T>(selector: (state: S) => T, handler: (value: T, prevValue: T) => void): () => void;
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
  /** Unsubscribes from store change events to clean up resources. */
  destroy: () => void;
}
/**
 * A store instance augmented with history capabilities.
 */
type StoreWithHistory<S extends Record<string, any>> = Store<S> & {
  history: HistoryManager<S>;
};

export type { HistoryOptions as H, Store as S, StoreWithHistory as a };
