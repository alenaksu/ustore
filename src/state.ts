import { StateProxyOptions } from './types';

/**
 * Determines whether a value can be wrapped in a reactive proxy. Only plain objects
 * are proxyable. Arrays, custom objects, dates, maps, sets, and primitives are treated as atomic.
 *
 * @param value - The value to check.
 * @returns True if the value is proxyable.
 */
const isProxyable = (value: unknown): value is object => {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;

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
export const deepSet = <T extends Record<string, any>>(state: T, newState: T): void => {
  for (const key of Object.keys(newState) as (keyof T)[]) {
    if (isProxyable(newState[key]) && isProxyable(state[key])) {
      deepSet(state[key], newState[key]);
    } else {
      state[key] = newState[key];
    }
  }
};
