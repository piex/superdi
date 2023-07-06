import { Container } from "./container";
import { Registration } from "./registration";
import { Resolver } from "./resolvers";

/** 依赖注入作用域 */
export const enum LIFETIME {
  /**
   * 在Singleton模式中，容器只会创建一个实例，并将该实例注入到所有请求该依赖项的类中
   */
  SINGLETON = 'SINGLETON',
  /**
   * 在Transient作用域中，每次请求依赖项时，容器都会创建一个新的实例并进行注入。
   * 这意味着每个请求都将得到一个新的依赖项实例。
   * Transient作用域通常用于不需要共享实例的依赖项，或者那些有状态的依赖项。
   */
  TRANSIENT = 'TRANSIENT',
  /**
   * 在Scoped作用域中，容器会创建一个实例，并使该实例在其指定的作用域范围内可用。
   * 一旦该作用域范围结束，容器就会销毁这个实例。
   * Scoped作用域通常用于在作用域范围内共享相同的依赖项实例，例如请求作用域、会话作用域或周期作用域。
   */
  // SCOPED = 'SCOPED',
}

export const enum RESOLVER_TYPE {
  CLASS = 'class',
  FUNCTION = 'function',
  VALUE = 'value',
}


/** Token Options */
export interface TokenOptions {
  /** 默认 Token name 只能使用一次，如果开启 unique，则会对Token使用symbol包裹，那么即时同一个name，也会被认为是两个完全不同的Token。 */
  unique?: boolean;
  /** 支持注入多实例模式，不开启在开发模式下会 warn */
  multiton?: boolean;
}

/**
 * A class constructor. For example:
 *
 *    class MyClass {}
 *
 *    asClass(MyClass)
 *            ^^^^^^^
 */
export type Constructor<P, T> = new (args?: P) => T;

export type ConstructorParameters<C> = C extends new (...args: infer P) => any ? P : never;

/**
 * Disposer function type.
 */
export type ResolverDisposer<I> = (value: I, container: Container) => any | Promise<any>;

/**
 * A resolver options for asClass() or asFunction() or asValue().
 */
export interface ResolverOptions<I> {
  /** 设置是否注入到根作用域，默认为 false */
  root?: boolean;
  /** 设置注入的权重值，默认为0 */
  weight?: number;
  /** 设置清理器 */
  disposer?: ResolverDisposer<I>;
}

/**
 * Gets passed the container and is expected to return an object
 * whose properties are accessible at construction time for the
 * configured resolver.
 *
 * @type {Function}
 */
export type InjectorFunction<P> = (container: Container) => P;

export interface ResolverOptionsWithLifetime<I> extends ResolverOptions<I> {
  /** 设置注入的生效方式 */
  lifetime?: LIFETIME;
}

export interface ResolverOptionsWithLifetimeAndInjector<I, P> extends ResolverOptionsWithLifetime<I> {
  injector: InjectorFunction<P>;
}

// type AsResolverOptions<P extends unknown[], I> = 
//   P extends [] ? [ResolverOptions<I>?] :
//   P extends any[] ? [ResolverOptionsWithInjector<I, P>] : 
//   [(Partial<ResolverOptionsWithInjector<I, P>>)?];

// export type AsFunctionParamsO<F extends (...arg: any[]) => unknown> = 
//   [F, ...AsResolverOptions<Parameters<F>, ReturnType<F>>];

export type AsFunctionParams<
  F extends (...arg: any[]) => unknown,
  P extends Parameters<F> = any,
  R extends ReturnType<F> = any
> = P extends [] ? [F, ResolverOptionsWithLifetime<R>?] :
    P extends any[] ? [F, ResolverOptionsWithLifetimeAndInjector<R, P>] : 
    [F, (Partial<ResolverOptionsWithLifetimeAndInjector<R, P>>)?];

export type AsClassParams<
  C extends Constructor<any, any>,
  P extends ConstructorParameters<C> = any,
  I extends InstanceType<C> = any,
> = P extends [] ? [C, ResolverOptionsWithLifetime<I>?] :
    P extends any[] ? [C, ResolverOptionsWithLifetimeAndInjector<I, P>] : 
    [C, (Partial<ResolverOptionsWithLifetimeAndInjector<I, P>>)?];

export type RegistrationMap = Map<symbol, Registration<any>>;

export interface ContainerResolveOptions {
  scoped?: boolean;
}

// export interface ResolverRegister<V, R> {
//   readonly resolverType: RESOLVER_TYPE;
//   readonly value: V;
//   readonly root: boolean;
//   readonly lifetime: LIFETIME;
//   readonly weight: number;
//   readonly disposer?: ResolverDisposer<R>;
// }


// export interface ResolverRegisterWithInjector<I, P, R> extends ResolverRegister<I, R> {
//   readonly injector: InjectorFunction<P>;
// }

// export interface ResolverRegisterWithOptionalInjector<I, P, R> extends ResolverRegister<I, R> {
//   readonly injector?: InjectorFunction<P>;
// }

// export type FunctionResolverRegister<
//   F extends (...arg: any[]) => unknown,
//   P extends Parameters<F> = any,
//   R extends ReturnType<F> = any
// > = P extends [] ? ResolverRegister<F, R> : 
//     P extends any[] ? ResolverRegisterWithInjector<F, P, R> :
//     ResolverRegisterWithOptionalInjector<F, P, R>;

// export type ClassResolverRegister<
//   C extends Constructor<any, any>,
//   P extends ConstructorParameters<C> = any,
//   R extends InstanceType<C> = any
// > = P extends [] ? ResolverRegister<C, R> : 
//     P extends any[] ? ResolverRegisterWithInjector<C, P, R> :
//     ResolverRegisterWithOptionalInjector<C, P, R>;

export type RegistrationResolver<P = unknown, R = unknown> = Resolver<P, R> & { 
  timestamp: number;
  __origin: Resolver<P, R>;
};
