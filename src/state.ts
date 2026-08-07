import { DeepPartial, StateProxyOptions } from './types';

/**
 * Symbol marker identifying proxies created by this library.
 */
export const IS_PROXY = Symbol('isProxy');

/**
 * Symbol holding the raw (unproxied) target of a proxy created by this library.
 */
export const RAW_VALUE = Symbol('rawValue');

/**
 * Determines whether a value is a proxy created by this library, by checking the
 * {@link IS_PROXY} symbol.
 */
export const isProxy = (value: unknown): boolean =>
  !!value && !!(value as { [IS_PROXY]?: boolean })[IS_PROXY];

/**
 * Recursively resolves any proxy created by this library back to its raw target,
 * so that the stored state never holds proxies (which would break structuredClone
 * in snapshot() and the history plugin). Scalars are returned as-is.
 *
 * @param value - The value to sanitize.
 */
export const unproxy = <T>(value: T): T => {
  const rawValue = isProxy(value) ? (value as { [RAW_VALUE]: T })[RAW_VALUE] : value;

  if (Array.isArray(rawValue)) {
    const result: unknown[] = [];
    for (const item of rawValue) {
      result.push(unproxy(item));
    }
    return result as unknown as T;
  }

  if (rawValue && typeof rawValue === 'object' && isProxyable(rawValue)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(rawValue)) {
      result[key] = unproxy((rawValue as Record<string, unknown>)[key]);
    }
    return result as T;
  }

  return rawValue;
};

/**
 * Determines whether a value can be wrapped in a reactive proxy. Plain objects
 * and arrays are proxyable. Custom objects, dates, maps, sets, and primitives
 * are treated as atomic.
 *
 * @param value - The value to check.
 * @returns True if the value is proxyable.
 */
const isProxyable = (value: unknown): value is object => {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return true;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Creates a ProxyHandler configured with read/write hooks.
 *
 * @param options - Hook callbacks triggered on property access.
 * @param path - Current property depth path (e.g. "user.profile.name").
 * @returns A standard ProxyHandler.
 */
export const createProxyHandler = <S extends object>(
  options: StateProxyOptions,
  path: string = '',
): ProxyHandler<S> => {
  return {
    get<P extends keyof S>(target: S, propertyName: string | symbol, receiver: unknown): S[P] {
      if (propertyName === IS_PROXY) return true as S[P];
      if (propertyName === RAW_VALUE) return target as S[P];

      const value = Reflect.get(target, propertyName, receiver) as S[P];

      if (typeof propertyName === 'symbol') {
        return value;
      }

      const propertyPath = path ? `${path}.${propertyName}` : propertyName;

      options.onRead?.(propertyPath);

      return isProxyable(value) ? createProxy<typeof value>(value, options, propertyPath) : value;
    },
    set(target, propertyName: string | symbol, newValue, receiver) {
      if (typeof propertyName === 'symbol') {
        return Reflect.set(target, propertyName, newValue, receiver);
      }

      const propertyPath = path ? `${path}.${propertyName}` : propertyName;

      options.onWrite?.(propertyPath);

      return Reflect.set(target, propertyName, newValue, receiver);
    },
  };
};

/**
 * Wraps an object in a deep reactive proxy.
 */
export const createProxy = <S extends object>(
  state: S,
  options: StateProxyOptions = {},
  path = '',
) => new Proxy(state, createProxyHandler(options, path));

/**
 * Wraps an object in a deep reactive proxy that supports revocation.
 */
export const createRevocableProxy = <S extends object>(
  state: S,
  options: StateProxyOptions = {},
  path = '',
) => Proxy.revocable(state, createProxyHandler(options, path));

/**
 * Deeply sets the properties of a state object to match those of a new state object.
 * This function mutates the original state object and does not replace it entirely, preserving any existing references to the state.
 * @param state
 * @param newState
 */
export const deepSet = <T extends Record<string, any>>(
  state: T,
  newState: DeepPartial<T>,
): void => {
  for (const key of Object.keys(newState) as (keyof T)[]) {
    const newValue = newState[key];

    if (Array.isArray(newValue)) {
      // Arrays are replaced atomically: merging element-wise would only notify
      // index paths (never the array path itself) and would leave stale
      // elements behind when the array shrinks.
      state[key] = newValue as T[keyof T];
    } else if (isProxyable(newValue) && isProxyable(state[key])) {
      deepSet(state[key], newValue);
    } else {
      state[key] = newValue as T[keyof T];
    }
  }
};
