import { 
  RESOLVER_TYPE,
  asClass,
  asFunction,
  asValue,
  createContainer,
  LIFETIME,
} from '../src';

class Test {
  echo(text: string) {
    return text;
  }
}

class Person {
  constructor(private name: string) {}

  speak() {
    return `I am ${this.name}.`;
  }
}

describe("Resolver asValue", () => {
  const c = createContainer();

  it("resolverType", () => {
    const r = asValue("hello");
    expect(r.resolverType).toBe(RESOLVER_TYPE.VALUE);
  });

  it("Resolve Primitive Type", () => {
    [
      undefined,
      null,
      'abcdef',
      123,
      BigInt(99),
      true,
      false,
      Symbol('tttt')
    ].forEach(value => {
      const r = asValue(value);
      expect(r.hasResolved).toBeFalsy();
      expect(r.resolve(c)).toBe(value);
      expect(r.hasResolved).toBeTruthy();
    });
  });

  it("Resolve Object Type", () => {
    const obj = { a: 1 };

    const r = asValue(obj);
    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c)).toBe(obj);
    expect(r.hasResolved).toBeTruthy();
  });

  it("Resolve Function Type", () => {
    const fn = (a: number, b: number) => a + b;

    const r = asValue(fn);
    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c)).toBe(fn);
    expect(r.hasResolved).toBeTruthy();
  });

  it("Resolve Class Type", () => {
    const bob = new Person('Bob');

    const r = asValue(bob);
    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c)).toBe(bob);
    expect(r.hasResolved).toBeTruthy();
  });
});


describe("Resolver asFunction", () => {
  const c = createContainer();

  it("resolverType", () => {
    const r = asFunction(() => "hello", { weight: 1 });
    expect(r.resolverType).toBe(RESOLVER_TYPE.FUNCTION);
  });


  it("without parameters", () => {
    const r = asFunction(() => "hello");
    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c)).toBe('hello');
    expect(r.hasResolved).toBeTruthy();


    const r2 = asFunction(() => 6);
    expect(r2.hasResolved).toBeFalsy();
    expect(r2.resolve(c)).toBe(6);
    expect(r2.hasResolved).toBeTruthy();
  });

  it("with parameters", () => {
    const fn = (a: number, b: number) => a + b;

    const r = asFunction(fn, {
      injector: () => [3, 5] as [number, number],
    });

    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c)).toBe(8);
    expect(r.hasResolved).toBeTruthy();
  });

  it("LIFETIME SINGLETON", () => {
    const fn = () => Math.random();

    const r = asFunction(fn, {
      lifetime: LIFETIME.SINGLETON,
    });

    expect(r.resolve(c)).toBe(r.resolve(c));
  });

  it("LIFETIME TRANSIENT", () => {
    const fn = () => Math.random();

    const r = asFunction(fn, {
      lifetime: LIFETIME.TRANSIENT,
    });

    expect(r.resolve(c)).not.toBe(r.resolve(c));
  });

});


describe("Resolver asClass", () => {
  const c = createContainer();

  it("resolverType", () => {
    const r = asClass(Person, {
      injector: () => ['Jack'],
    });

    expect(r.resolverType).toBe(RESOLVER_TYPE.CLASS);
  });

  it("without parameters", () => {
    const r = asClass(Test);

    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c).echo('Hello World!')).toBe("Hello World!");
    expect(r.hasResolved).toBeTruthy();
  });

  it("with parameters", () => {
    const r = asClass(Person, {
      injector: () => ['Jack'],
    });

    expect(r.hasResolved).toBeFalsy();
    expect(r.resolve(c).speak()).toBe("I am Jack.");
    expect(r.hasResolved).toBeTruthy();
  });

  it("LIFETIME SINGLETON", () => {
    const r = asClass(Person, {
      injector: () => ['Jack']
    });

    expect(r.resolve(c)).toBe(r.resolve(c));
  });

  it("LIFETIME TRANSIENT", () => {
    const r = asClass(Person, {
      injector: () => ['Jack'],
      lifetime: LIFETIME.TRANSIENT,
    });

    expect(r.resolve(c)).not.toBe(r.resolve(c));


    const r2 = asClass(Test, {
      lifetime: LIFETIME.TRANSIENT,
    });
    expect(r2.resolve(c)).not.toBe(r2.resolve(c));
  });

});
