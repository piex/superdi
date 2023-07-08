<h1 align='center'>SuperDI</h1>

<p align='center'>100% type safe, lightweight Dependency Injection tool for Typescript</p>

<p align='center'>
  English | <a href='./README.zh-CN.md'>简体中文</a>
</p>

<h2 align='center' style="margin: 50px 0 20px;">Why create a new DI tool?</h2>

There are have many DI tools：

1. [microsoft/tsyringe](https://github.com/microsoft/tsyringe)
2. [typestack/typedi](https://github.com/typestack/typedi)
3. [inversify/InversifyJS](https://github.com/inversify/InversifyJS)
4. [jeffijoe/awilix](https://github.com/jeffijoe/awilix)

These tools are incredibly powerful, many project use these tools. However, there is one issue: these tools are primarily built on ES6 Class and Decorator principles, making them more like framework-driven DI solutions. They can be complex to use and are not suitable for lightweight scenarios. Moreover, they lack type inference in non-Class situations.

The primary reason for developing this library was born out of a typical scenario:
I needed to create an SDK with certain functionalities that could be
implemented either through plugins or by integrating with other systems. In such
cases, dependency injection is a viable solution. However, without a specific
implementation in place, the decorator injection approach cannot be used.

In this particular scenario, it became necessary to define an identifier on the SDK side, allowing the integrators to inject the required dependencies using this identifier. Furthermore, the dependencies required by the business side could be of any type - be it a `number`, `string`, `function`, or even a `class`. Except for `classes`, decorators do not support the types. Hence, it was imperative to have the ability to infer the correctness of the injected dependency based on the identifier, which none of the existing libraries offered.

Motivated by the aforementioned reasons, I created SuperDI - a lightweight dependency injection tool that guarantees 100% type safety. Leveraging the power of the token mechanism, SuperDI allows for the advance declaration of required dependency types. Consequently, during dependency injection, the system can accurately deduce the correctness of the injected dependency type. Moreover, SuperDI boasts numerous other powerful features that make it an indispensable tool in any development project.

## Features

- [x] 100% type safe.
- [x] No third-party dependencies.
- [x] Lifetime support `singleton` and `transient`.
- [x] Support unregister.
- [x] Support multiton register and resolveAll mode.
- [x] Support async dispose.
- [x] Support injector.
- [x] Support register value, function and class.
- [ ] Clear the history register when unregister.

<h2 align='center' style="margin: 50px 0 20px;">Usage</h2>

### Installation

```shell
npm install superdi
```

### API

#### Token

SuperDI operates by utilizing Tokens for dependency injection. Therefore, it is essential to first grasp the concept of Tokens when utilizing SuperDI. There are two key approaches in applying Tokens:

```ts
import { createToken, Token } from 'superdi';

const token1 = createToken<number>('token1');
const token2 = new Token<number>('token2');
```

The two methods for creating a `Token` mentioned above are equivalent. The generic type `number` is used to indicate the type that the `Token` depends on, and it needs to be declared explicitly.

The parameters for creating a Token using both methods are identical. The first parameter is a string that represents the identification of the Token (only string inputs are supported), and the second parameter should have the following type:

```ts
interface TokenOptions {
  /** 
   * By default, the token name can only be used once.
   * However, if the "unique" is true, the token will be wrapped with the symbol() function. 
   * In this case, even if the name is the same, it will be considered as two completely different tokens.
   */
  unique?: boolean;
  /** 
   * multi-instance pattern, wherein a single Token can inject multiple dependencies. 
   */
  multiton?: boolean;
}
```

#### Resolver

##### `asValue`

```ts
type ResolverDisposer<I> = (value: I, container: Container) => any | Promise<any>;

interface ResolverOptions<I> {
  /** 设置是否注入到根作用域，默认为 false */
  root?: boolean;
  /** 设置注入的权重值，默认为 0，resolverAll 时会根据该权重值排序 */
  weight?: number;
  /** 设置清理器，在取消注入和销毁容器时会调用 */
  disposer?: ResolverDisposer<I>;
}
```

##### `asFunction`

```ts
// 创建一个容器
const container = createContainer();

// 创建三个Token
const token = createToken<number>('token');
const num1 = createToken<number>('num1');
const num2 = createToken<number>('num2');

// 声明一个两数相加的 add 函数
const add = (a: number, b: number) => a + b;

// 使用 token 将 add 函数注入到容器中
// 并从容器中获取 num1 和 num2 作为 add 函数的参数
// 因为 add 函数有两个参数，所以需要返回数组
container.register(token, asFunction(add, {
  injector: (con) => [con.resolve(num1)!, con.resolve(num2)!],
}));
// 注入 num1，其依赖是一个数字，会根据 num1 的类型自动推导
container.register(num1, asValue(0.1));
// 注入 num2，也是一个数字
container.register(num2, asValue(0.2));
// 最终可以通过 token 获取一个数字，其实执行 add 后的返回值
container.resolve(token) // 0.30000000000000004;
```

```ts
const bigAdd = (a: number, b: number) => Big(a).plus(b).toNumber();

container.register(token, asFunction(bigAdd, {
  injector: (con) => [con.resolve(num1)!, con.resolve(num2)!],
}));
```

##### `asClass`

#### Container

##### `createContainer`

```ts
import { createContainer } from 'superdi';
const container = createContainer();
```

##### `register`

```ts
const token = createToken<number>('someNumberToken');
const value = 9.9;
container.register(token, asValue(value));
container.register(token, asFunction(() => value));
```

##### `hasRegistration`

```ts
interface ContainerResolveOptions {
  scoped?: boolean;
}

Container.hasRegistration<T>(token: Token<T>, options?: ContainerResolveOptions): boolean;
```

```ts
container.hasRegistration(token);
```

##### `resolve`

```ts
interface ContainerResolveOptions {
  scoped?: boolean;
}

Container.resolve<T>(token: Token<T>, options?: ContainerResolveOptions): T | null;
```

##### `resolveAll`

```ts
interface ContainerResolveOptions {
  scoped?: boolean;
}

Container.resolveAll<T>(token: Token<T>, options?: ContainerResolveOptions): T[]
```

##### `hasResolved`

```ts
Container.hasResolved<T>(token: Token<T>, options?: ContainerResolveOptions): boolean;
```

##### `unregister`

```ts
Container.unregister<P = unknown, R = unknown>(token: Token<R>, resolver?: Resolver<P, R>): Promise<any>;
```

##### `dispose`

```ts
Container.dispose(): Promise<any[]>;
```

#### Scope

```ts
const container = createContainer();
const scope = container.createScope();
```
