import { Constructor, RegistrationResolver } from "./types";

/**
 * Returns the last item in the array.
 *
 * @param  {*[]} arr
 * The array.
 *
 * @return {*}
 * The last element.
 */
export function last<T>(arr: Array<T>): T {
  return arr[arr.length - 1];
}

/**
 * Returns the unique items in the array.
 *
 * @param {Array<T>}
 * The array to remove dupes from.
 *
 * @return {Array<T>}
 * The deduped array.
 */
export function uniq<T>(arr: Array<T>): Array<T> {
  return Array.from(new Set(arr));
}

/**
 * Determines if the given value is a function.
 *
 * @param  {Any} val
 * Any value to check if it's a function.
 *
 * @return {boolean}
 * true if the value is a function, false otherwise.
 */
export function isFunction(val: unknown): boolean {
  return typeof val === 'function';
}

/**
 * Determines if the given function is a class.
 *
 * @param  {Function} fn
 * @return {boolean}
 */
export function isClass<F extends (...args: any) => unknown = any>(fn: F | Constructor<unknown, unknown>): boolean {
  if (!isFunction(fn)) {
    return false;
  }

  if (Object.getOwnPropertyDescriptor(fn, 'prototype')?.writable === false) {
    return true;
  }

  const prototypeHasConstructor = fn.prototype?.constructor;
  if (prototypeHasConstructor === fn) {
    return true;
  }

  // ES6 class
  if (/^class\s/.test(fn.toString())) {
    return true;
  }

  return false;
}

export const sortResolvers = (resolvers: RegistrationResolver<any, any>[]) => {
  return resolvers.sort((a, b) => {
    if (a.weight !== b.weight) {
      return a.weight - b.weight;
    }

    return a.timestamp - b.timestamp;
  });
};
