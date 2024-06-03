const isObject = (value: unknown): value is object => {
  return value === Object(value);
};

interface PropertyAccessHandler {
  (propertyPath: string): void;
}

interface StateProxyOptions {
  onRead?: PropertyAccessHandler;
  onWrite?: PropertyAccessHandler;
}

export const createProxyHandler = <S extends object>(
  options: StateProxyOptions,
  path: string = '',
): ProxyHandler<S> => {
  return {
    get<P extends keyof S>(target: S, propertyName: string, receiver: unknown): S[P] {
      const value = Reflect.get(target, propertyName, receiver) as S[P];
      const propertyPath = path ? `${path}.${propertyName}` : propertyName;

      options.onRead?.(propertyPath);

      return isObject(value) ? createStateProxy<typeof value>(value, options, propertyPath) : value;
    },
    set(target, propertyName: string, newValue, receiver) {
      const propertyPath = path ? `${path}.${propertyName}` : propertyName;

      options.onWrite?.(propertyPath);

      return Reflect.set(target, propertyName, newValue, receiver);
    },
  };
};

export const createStateProxy = <S extends object>(
  state: S,
  options: StateProxyOptions = {},
  path = '',
) => new Proxy(state, createProxyHandler(options, path));

export const createStateRevocableProxy = <S extends object>(
  state: S,
  options: StateProxyOptions = {},
  path = '',
) => Proxy.revocable(state, createProxyHandler(options, path));
