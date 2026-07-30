import { S as Store, H as HistoryOptions, a as StoreWithHistory } from '../types-ClGG-8Kn.cjs';

/**
 * Enhances a uStore instance with state history tracking (Undo / Redo / Snapshots).
 *
 * @param store - The uStore instance to enhance.
 * @param options - Configuration options for history tracking.
 * @returns The original store augmented with a `history` manager property.
 */
declare const withHistory: <S extends Record<string, any>>(
  store: Store<S>,
  options?: HistoryOptions<S>,
) => StoreWithHistory<S>;

export { withHistory };
