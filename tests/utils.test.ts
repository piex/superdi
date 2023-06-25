import { last, uniq, isFunction, isClass } from '../src/utils';

describe("utils last", () => {
  it("should return the last element", () => {
    const arr = [1, 2, 3];

    expect(last(arr)).toBe(arr[arr.length - 1]);
  });

  it('should return `undefined` when querying empty arrays', function() {
    expect(last([])).toBeUndefined();
  });
});

describe("utils uniq", () => {
  it("should uniq the array", () => {
    const arr = [3, 2, 1, 3, 2];

    expect(uniq(arr)).toEqual([3, 2, 1]);
  });
});

describe("utils isFunction", () => {
  it("should return `true` for functions", () => {
    const fn = () => 5;

    expect(isFunction(fn)).toBeTruthy();
  });

  it('should return `true` for async functions', function() {
    const asyncFn = () => Promise.resolve(3);

    expect(isFunction(asyncFn)).toBeTruthy();
  });

  it('should return `true` for class', function() {
    class MyClass {}

    expect(isFunction(MyClass)).toBeTruthy();
    expect(isFunction(class {})).toBeTruthy();
  });

  it('should return `false` for non-functions', () => {
    expect(isFunction(undefined)).toBeFalsy();
    expect(isFunction(null)).toBeFalsy();
    expect(isFunction(5)).toBeFalsy();
    expect(isFunction(true)).toBeFalsy();
    expect(isFunction(false)).toBeFalsy();
    expect(isFunction(BigInt(123))).toBeFalsy();
    expect(isFunction('')).toBeFalsy();
    expect(isFunction(Symbol(5))).toBeFalsy();
    expect(isFunction([])).toBeFalsy();
    expect(isFunction({})).toBeFalsy();
  });
});

describe("utils isClass", () => {
  it("should return `true` for class", () => {
    class MyClass {}

    expect(isClass(MyClass)).toBeTruthy();
  });

  it('should return `true` for anonymous class', () => {
    expect(isClass(class {})).toBeTruthy();
  });

  it('should return `true` for normal functions', () => {
    function MyClass() {/** */}

    expect(isClass(MyClass)).toBeTruthy();
  });

  it('should return `false` for arrow functions', () => {
    const fn = () => 5;

    expect(isClass(fn)).toBeFalsy();
  });

  it('should return `false` for non-functions', () => {
    expect(isClass('hello' as any)).toBeFalsy();
  });

});
