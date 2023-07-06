import { 
  LIFETIME, 
  ResolverOptions, 
  InjectorFunction,
  ResolverDisposer, 
  RESOLVER_TYPE,
  Constructor,
  AsFunctionParams,
  AsClassParams,
  ConstructorParameters,
} from "./types";
import { Container } from "./container";

export abstract class Resolver<P = unknown, R = unknown> {
  protected injector: InjectorFunction<P> | undefined;
  public readonly weight: number;
  public readonly disposer: ResolverDisposer<R> | undefined;
  public readonly root: boolean;

  constructor(options: ResolverOptions<R> = {}) {
    this.weight = options.weight || 0;
    this.disposer = options.disposer;
    this.root = options.root ?? false;
  }

  abstract get resolverType(): RESOLVER_TYPE;

  abstract get hasResolved(): boolean;

  abstract resolve(container: Container): R;
}

class ValueResolver<V = unknown> extends Resolver<void, V> {
  readonly #value: V;
  #hasResolved = false;

  constructor(value: V, options: ResolverOptions<V> = {}) {
    super(options);
    this.#value = value;
  }

  public get resolverType() {
    return RESOLVER_TYPE.VALUE;
  }

  public get hasResolved() {
    return this.#hasResolved;
  }

  public resolve(_: Container): V {
    this.#hasResolved = true;
    return this.#value;
  }
}

class FunctionResolver<
  F extends (...params: unknown[]) => any,
  P extends Parameters<F>[0],
  R extends ReturnType<F>,
> extends Resolver<P, R> {
  readonly #fn: F;
  readonly #lifetime: LIFETIME;
  #instance: R | undefined;
  #hasResolved = false;


  constructor(...params: AsFunctionParams<F>) {
    const [fn, options] = params;
    super(options);
    this.#fn = fn;
    this.#lifetime = options?.lifetime || LIFETIME.SINGLETON;
    this.injector = (options as any)?.injector;
  }

  public get resolverType() {
    return RESOLVER_TYPE.FUNCTION;
  }

  public get hasResolved() {
    return this.#hasResolved;
  }

  public resolve(container: Container): R {
    this.#hasResolved = true;

    const fn = this.#fn;

    if(this.#lifetime === LIFETIME.TRANSIENT) {
      return fn(...(this.injector?.(container) ?? [] as any));
    }

    if (!this.#instance) {
      this.#instance = fn(...(this.injector?.(container) ?? [] as any));
    }

    return this.#instance!;
  }
}

class ClassResolver<
  C extends Constructor<any, any>,
  P extends ConstructorParameters<C> = any,
  R extends InstanceType<C> = any,
> extends Resolver<P, R> {
  readonly #lifetime: LIFETIME;
  readonly #Cls: Constructor<P, R>;
  #instance: R | undefined;
  #hasResolved = false;

  constructor(...params: AsClassParams<C>) {
    const [Cls, options] = params;
    super(options);
    this.#Cls = Cls;
    this.#lifetime = options?.lifetime || LIFETIME.SINGLETON;
    this.injector = (options as any)?.injector;
  }

  public get resolverType() {
    return RESOLVER_TYPE.CLASS;
  }

  public get hasResolved() {
    return this.#hasResolved;
  }

  public resolve(container: Container): R {
    this.#hasResolved = true;

    const Cls = this.#Cls;

    if(this.#lifetime === LIFETIME.TRANSIENT) {
      return new Cls(...(this.injector?.(container) ?? [] as any));
    }

    if (!this.#instance) {
      this.#instance = new Cls(...(this.injector?.(container) ?? [] as any));
    }

    return this.#instance!;
  }
}

export function asValue<V>(value: V, options?: ResolverOptions<V>) {
  return new ValueResolver<V>(value, options);
}

export function asFunction <F extends (...args: any[]) => unknown>(
  ...params: AsFunctionParams<F, Parameters<F>, ReturnType<F>>
) {
  return new FunctionResolver<F, Parameters<F>, ReturnType<F>>(...params);
}

export function asClass <C extends Constructor<any, any>>(
  ...params: AsClassParams<C, ConstructorParameters<C>, InstanceType<C>>
) {
  return new ClassResolver<C, ConstructorParameters<C>, InstanceType<C>>(...params);
}
