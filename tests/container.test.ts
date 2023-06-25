import { 
  createContainer,
  createToken,
  Container,
  asValue,
  asFunction,
  asClass,
  LIFETIME,
} from '../src';

class Repo {
  getStuff() {
    return 'stuff';
  }
}

class Test {
  constructor(private repo: Repo) { }

  stuff() {
    return this.repo.getStuff();
  }
}

class Clear {
  constructor(private fn: () => void) { }

  public clear() {
    return this.fn();
  }
}

describe('Container', () => {
  it('createContainer', () => {
    const container = createContainer();
    expect(typeof container).toBe('object');
  });

  it('new Container', () => {
    const container = new Container();
    expect(typeof container).toBe('object');
  });
});

describe("Container resolve", () => {
  it('register some value and resolve it', () => {
    const container = createContainer();
    const token = createToken<number>('someValue', { unique: true });
    const value = 9.9;
    container.register(token, asValue(value));

    expect(container.resolve(token)).toBe(value);
  });

  it('register some function and resolve it', () => {
    const container = createContainer();
    const token = createToken<string>('some_fn_token', { unique: true });
    const fn = () => 'hello world!';

    container.register(token, asFunction(fn));

    const res = container.resolve(token);

    expect(res).toBe('hello world!');
  });

  it('register some class and resolve it', () => {
    const container = createContainer();
    const token = createToken<Repo>('some_class_token', { unique: true });

    container.register(token, asClass(Repo));

    const repo = container.resolve(token);

    expect(repo).toBeInstanceOf(Repo);
    expect(repo?.getStuff()).toBe('stuff');
  });
});

describe('container register multiton', () => {
  it('register some value multiton and resolveAll', () => {
    const container = createContainer();
    const token = createToken<number>('some_value_token', { unique: true });
    const value1 = 6.6;
    const value2 = 9.9;
    const value3 = 8.8;
    container.register(token, asValue(value1));
    container.register(token, asValue(value2));
    container.register(token, asValue(value3));

    expect(container.resolve(token)).toBe(value3);
    expect(Array.isArray(container.resolveAll(token))).toBeTruthy();
    expect(container.resolveAll(token)).toEqual([value1, value2, value3]);
  });

  it('register some function multiton and resolve it', () => {
    const container = createContainer();
    const token = createToken<string>('some_fn_token', { unique: true });
    const fn1 = () => 'fn1';
    const fn2 = () => 'fn2';
    const fn3 = () => 'fn3';

    container.register(token, asFunction(fn1));
    container.register(token, asFunction(fn2));
    container.register(token, asFunction(fn3));

    expect(container.resolve(token)).toBe('fn3');
    expect(container.resolveAll(token)).toEqual(['fn1', 'fn2', 'fn3']);
  });

  it('register some class multiton and resolve it', () => {
    const container = createContainer();
    const token = createToken<Repo>('some_class_token', { unique: true });

    container.register(token, asClass(Repo));
    container.register(token, asClass(Repo));

    const repo = container.resolve(token);

    expect(repo).toBeInstanceOf(Repo);
    expect(repo?.getStuff()).toBe('stuff');
    expect(container.resolveAll(token).length).toBe(2);
  });

});

describe("resolveAll order", () => {
  it("default order by time", () => {
    const container = createContainer();
    const token = createToken<string>('some_token', { unique: true });

    const fn1 = () => 'fn1';
    const fn2 = () => 'fn2';
    const fn3 = () => 'fn3';

    container.register(token, asFunction(fn1));
    container.register(token, asFunction(fn2));
    container.register(token, asFunction(fn3));

    expect(container.resolveAll(token)).toEqual(['fn1', 'fn2', 'fn3']);
  });

  it("default order by time with scoped", () => {
    const container = createContainer();
    const scope = container.createScope();
    const token = createToken<string>('some_token', { unique: true });

    const fn1 = () => 'fn1';
    const fn2 = () => 'fn2';
    const fn3 = () => 'fn3';
    
    container.register(token, asFunction(fn1));
    container.register(token, asFunction(fn2));
    container.register(token, asFunction(fn3));
    scope.register(token, asFunction(fn3));
    scope.register(token, asFunction(fn2));
    scope.register(token, asFunction(fn1));

    expect(container.resolveAll(token)).toEqual(['fn1', 'fn2', 'fn3']);
    expect(scope.resolveAll(token, { scoped: true })).toEqual(['fn3', 'fn2', 'fn1']);
    expect(scope.resolveAll(token)).toEqual(['fn1', 'fn2', 'fn3', 'fn3', 'fn2', 'fn1']);
  });


  it("order by weight with scoped", () => {
    const container = createContainer();
    const scope = container.createScope();
    const token = createToken<string>('some_token', { unique: true });

    const fn1 = () => 'fn1';
    const fn2 = () => 'fn2';
    const fn3 = () => 'fn3';
    const fn4 = () => 'fn4';
    const fn5 = () => 'fn5';
    const fn6 = () => 'fn6';
    
    container.register(token, asFunction(fn1, { weight: 11 }));
    container.register(token, asFunction(fn2, { weight: 3 }));
    container.register(token, asFunction(fn3, { weight: 10 }));
    scope.register(token, asFunction(fn4, { weight: 10 }));
    scope.register(token, asFunction(fn5, { weight: 12 }));
    scope.register(token, asFunction(fn6, { weight: 3 }));

    expect(container.resolveAll(token)).toEqual(['fn2', 'fn3', 'fn1']);
    expect(scope.resolveAll(token, { scoped: true })).toEqual(['fn6', 'fn4', 'fn5']);
    expect(scope.resolveAll(token)).toEqual(['fn2', 'fn6', 'fn3', 'fn4', 'fn1', 'fn5']);
  });
});

describe('container injector', () => {
  it("register some class and resolve it with injector", () => {
    const container = createContainer();
    const repoToken = createToken<Repo>('repo');
    const testToken = createToken<Test>('test');
  
    container.register(repoToken, asClass(Repo));
    container.register(testToken, asClass(Test, {
      injector: (con) => [con.resolve(repoToken)!],
    }));
  
    expect(container.resolve(repoToken)?.getStuff()).toBe('stuff');
    expect(container.resolve(testToken)?.stuff()).toBe('stuff');
  });
});

describe('container unregister', () => {

  it("unregister a unregister token", async () => {
    const container = createContainer();

    const token = createToken<number>('some_token', { unique: true });
    const res = await container.unregister(token);
    expect(res).toBeTruthy();
  });

  it("simple unregister some value", () => {
    const container = createContainer();

    const token = createToken<number>('some_value_token', { unique: true });
    const value = 6.6;
    container.register(token, asValue(value));

    expect(container.resolve(token)).toBe(value);
    container.unregister(token);
    expect(container.resolve(token)).toBeNull();
  });

  it("unregister class with disposer", async () => {
    const container = createContainer();

    const clearCB = jest.fn();
    const token = createToken<Clear>('some_class_token', { unique: true });
    container.register(token, asClass(Clear, {
      injector: () => [clearCB],
      disposer: (c) => c.clear(),
    }));

    expect(container.resolve(token)).toBeInstanceOf(Clear);
    await container.unregister(token);
    expect(container.resolve(token)).toBeNull();
    expect(clearCB.mock.calls).toHaveLength(1);
  });

  it("unregister a class resolver with disposer", async () => {
    const container = createContainer();

    const clearCB = jest.fn();
    const token = createToken<Clear>('some_class_token', { unique: true });
    const resolver = asClass(Clear, {
      injector: () => [clearCB],
      disposer: (c) => c.clear(),
    });

    container.register(token, resolver);

    expect(container.resolve(token)).toBeInstanceOf(Clear);
    await container.unregister(token, resolver);
    expect(container.resolve(token)).toBeNull();
    expect(clearCB.mock.calls).toHaveLength(1);
    expect(container.resolveAll(token).length).toBe(0);
  });

  it("unregister multi class resolver with disposer", async () => {
    const container = createContainer();

    const clearCB = jest.fn();
    const token = createToken<Clear>('some_class_token', { unique: true });
    const resolver = asClass(Clear, {
      injector: () => [clearCB],
      disposer: (c) => c.clear(),
    }); 
    const resolver2 = asClass(Clear, {
      injector: () => [clearCB],
      disposer: (c) => c.clear(),
    });

    container.register(token, resolver);
    container.register(token, resolver2);

    expect(container.resolve(token)).toBeInstanceOf(Clear);
    await container.unregister(token, resolver);
    expect(container.resolve(token)).toBeInstanceOf(Clear);
    expect(clearCB.mock.calls).toHaveLength(1);
    expect(container.resolveAll(token).length).toBe(1);
  });
});

describe("container hasRegistration", () => {
  it('returns true if the registration does exist', () => {
    const container = createContainer();
    const token = createToken<number>('someValue', { unique: true });
    const value = 9.9;

    expect(container.hasRegistration(token)).toBeFalsy();
    container.register(token, asValue(value));

    expect(container.resolve(token)).toBe(value);
    expect(container.hasRegistration(token)).toBeTruthy();
  });

  it('returns false if the registration does not exist', () => {
    const token = createToken<number>('someValue', { unique: true });
    expect(createContainer().hasRegistration(token)).toBeFalsy();
  });
});

describe("container hasResolved", () => {
  it('returns true if the resolver hasResolved', () => {
    const container = createContainer();
    const token = createToken<number>('someValue', { unique: true });
    const value = 9.9;

    expect(container.hasResolved(token)).toBeFalsy();
    container.register(token, asValue(value));
    expect(container.hasResolved(token)).toBeFalsy();
    expect(container.resolve(token)).toBe(value);
    expect(container.hasResolved(token)).toBeTruthy();
  });

  it('returns false if the registration does not exist', () => {
    const token = createToken<number>('someValue', { unique: true });
    expect(createContainer().hasRegistration(token)).toBeFalsy();
  });
});

describe('container dispose', () => {
  it('call disposer when container dispose', async () => {
    const container = createContainer();

    const clearCB = jest.fn();
    const token = createToken<Clear>('some_class_token', { unique: true });
    container.register(token, asClass(Clear, {
      injector: () => [clearCB],
      disposer: (c) => c.clear(),
    }));

    expect(container.resolve(token)).toBeInstanceOf(Clear);
    await container.dispose();
    expect(container.resolve(token)).toBeNull();
    expect(clearCB.mock.calls).toHaveLength(1);
  });
});

describe("register with root from scope container", () => {
  it("SINGLETON is always cached in the root container", () => {
    const container = createContainer();
    const scope = container.createScope();

    const token = createToken<Repo>('someValue', { unique: true });

    scope.register(token, asClass(Repo, { root: true }));
    expect(scope.resolve(token)).toBeInstanceOf(Repo);
    expect(container.resolve(token)).toBeInstanceOf(Repo);
    expect(container.resolve(token)).toBe(scope.resolve(token));
  });

  it("scope always reused root SINGLETON", () => {
    const container = createContainer();
    const scope = container.createScope();

    const token = createToken<number>('someValue', { unique: true });
    const value = 9.9;
    const fnToken = createToken<string>('some_fn_token', { unique: true });
    const fn = () => 'hello world!';

    container.register(fnToken, asFunction(fn, { root: true }));
    scope.register(token, asValue(value, { root: true }));
    expect(scope.resolve(token)).toBe(value);
    expect(container.resolve(token)).toBe(value);
    expect(container.resolve(fnToken)).toBe(fn());
    expect(container.resolve(fnToken)).toBe(fn());
  });
});

describe("container lifetime TRANSIENT", () => {
  it("TRANSIENT call every resolve", () => {
    const container = createContainer();
    const fn = jest.fn(() => 123);
    const token = createToken<number>('some_token', { unique: true });
    container.register(token, asFunction(fn, { lifetime: LIFETIME.TRANSIENT }));

    expect(container.resolve(token)).toBe(123);
    container.resolve(token);
    container.resolve(token);
    expect(fn.mock.calls).toHaveLength(3);
  });

  it("TRANSIENT will not access in the root container", () => {
    const container = createContainer();
    const scope = container.createScope();
    const token = createToken<Repo>('someValue', { unique: true });

    scope.register(token, asClass(Repo, { lifetime: LIFETIME.TRANSIENT }));
    expect(scope.resolve(token)).toBeInstanceOf(Repo);
    expect(container.resolve(token)).toBeNull();
  });

});

describe("container lifetime SCOPED", () => {
  it("SCOPED will not cached in the root container", () => {
    const container = createContainer();
    const scope = container.createScope();
    const token = createToken<Repo>('someValue', { unique: true });

    scope.register(token, asClass(Repo));
    expect(scope.resolve(token)).toBeInstanceOf(Repo);
    expect(container.resolve(token)).toBeNull();
  });

  it("SCOPED will cached in the scope container", () => {
    const container = createContainer();
    const scope = container.createScope();
    const fn = jest.fn(() => 123);
    const token = createToken<number>('some_token', { unique: true });
    scope.register(token, asFunction(fn));

    expect(scope.resolve(token)).toBe(123);
    scope.resolve(token);
    scope.resolve(token);
    expect(fn.mock.calls).toHaveLength(1);
  });

  
  it('register some value and resolve it scoped', () => {
    const container = createContainer();
    const scope = container.createScope();
    const token = createToken<string>('some_token', { unique: true });

    const v1 = 'hello';
    const v2 = 'world';

    container.register(token, asValue(v1));
    expect(container.resolve(token)).toBe(v1);
    expect(scope.resolve(token)).toBe(v1);
    expect(scope.resolve(token, { scoped: true })).toBeNull();
    scope.register(token, asValue(v2));
    expect(scope.resolve(token)).toBe(v2);
    expect(scope.resolve(token, { scoped: true })).toBe(v2);
  });

  it('register some value and resolveAll it scoped', () => {
    const container = createContainer();
    const scope = container.createScope();
    const token = createToken<string>('some_token', { unique: true });

    const v1 = 'hello';
    const v2 = 'world';

    container.register(token, asValue(v1));

    expect(container.resolveAll(token)).toEqual([v1]);
    expect(scope.resolveAll(token)).toEqual([v1]);
    expect(scope.resolveAll(token, { scoped: true })).toEqual([]);

    scope.register(token, asValue(v2));

    expect(scope.resolveAll(token)).toEqual([v1, v2]);
    expect(scope.resolveAll(token, { scoped: true })).toEqual([v2]);
  });
});

describe("container chain", () => {
  it("parentContainer", () => {
    const parent = createContainer();
    const bro = parent.createScope();
    const sis = parent.createScope();
    const grandson = bro.createScope();

    expect(grandson.parentContainer).toBe(bro);
    expect(bro.parentContainer).toBe(parent);
    expect(sis.parentContainer).toBe(parent);
  });

  it("rootContainer", () => {
    const parent = createContainer();
    const bro = parent.createScope();
    const sis = parent.createScope();
    const grandson1 = bro.createScope();
    const grandson2 = bro.createScope();
    const grandson3 = sis.createScope();
  
    expect(parent.rootContainer).toBe(parent);
    expect(bro.rootContainer).toBe(parent);
    expect(sis.rootContainer).toBe(parent);
    expect(grandson1.rootContainer).toBe(parent);
    expect(grandson2.rootContainer).toBe(parent);
    expect(grandson3.rootContainer).toBe(parent);
  });
});
