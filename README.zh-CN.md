<h1 align='center'>SuperDI</h1>

<p align='center'>100% 类型安全的轻量依赖注入工具。</p>

<p align='center'>
  <a href='./README.md'>English</a> | 简体中文
</p>

<h2 align='center' style="margin: 50px 0 20px;">为什么要实现一个新的 DI 工具？</h2>

现在已经有很多的依赖注入工具了：

1. [microsoft/tsyringe](https://github.com/microsoft/tsyringe)
2. [typestack/typedi](https://github.com/typestack/typedi)
3. [inversify/InversifyJS](https://github.com/inversify/InversifyJS)
4. [jeffijoe/awilix](https://github.com/jeffijoe/awilix)

这些工具都非常强大，久经社区考验，不过有一个问题：这些工具基本都是基于ES6 `Class` 和 `Decorator` 来实现的，是类似框架性质的依赖注入解决方案，使用起来很复杂，在轻量级的场景不适用，而且在非 `Class` 场景，基本没有类型推断。

开发这个库的主要原因就是一个典型的场景，我要实现一个 SDK，有一些功能希望通过插件或者接入方自己实现，这时候依赖注入就是一个不错的方案，但是此时还没有具体的实现，所以装饰器注入方案是无法使用的。在这种场景下需要在 SDK 侧先定义一个标识，然后让接入方使用该标识注入所需要的依赖。

而且业务方所需要的依赖可能是任何类型的，`number`、`string`、`function`、`class` 等，而除了 `class`，其他类型都不支持装饰器，如果需要在注入时能根据标识推断出所注入的依赖类型正确与否，这个能力也是上面这些库所不具备的。

基于以上原因，我实现了 SuperDI，SuperDI 是一个 100% 类型安全的轻量依赖注入工具，通过 `Token` 机制，可以提前定义所需依赖的类型，然后依赖注入的时候可以推断出注入的依赖类型的正确与否，此外还有很多其他功能。

<h2 align='center' style="margin: 50px 0 20px;">Super DI 的优势</h2>

- [x] 100% 类型安全，可以提前定义依赖类型，在依赖注入时进行类型推断和检查；
- [x] 非常轻量，不依赖任何第三方库；
- [x] 支持 `singleton` 和 `transient` 两种生命周期；
- [x] 将 `scoped` 从生命周期中剥离出来，作为单独的维度和生命周期交叉使用；
- [x] 支持注入多个依赖项，然后通过 `resolveAll` 获取所有注入的依赖项，并按照权重和注入顺序排序；
- [x] 支持取消注入时执行异步的 `dispose` 方法清理一些副作用，并将结果返回；
- [x] 支持 `value`、`function`、`class` 三种不同的注入形式，应用场景更广泛；
- [x] 注入时支持 `injector` 方法，可以在运行时传入函数与类的初始化参数；
- [ ] 支持取消注入，取消注入后会触发清理依赖回调，使用方可以注册监听回调，然后释放注入的依赖资源；
- [ ] 支持在注入新依赖时清理所有的历史依赖，并触发清理依赖回调；
- [ ] `dispose` 和 `unregister` 支持 `withoutDisposeCallback` 参数。

<h2 align='center' style="margin: 50px 0 20px;">使用指南</h2>

### 安装

```shell
npm install superdi
```

### API

#### Token

SuperDI 是通过 Token 进行依赖注入的，所以在使用 SuperDI 时先要学会 Token 的使用，Token 有以下两种使用方式：

```ts
import { createToken, Token } from 'superdi';

const token1 = createToken<number>('token1');
const token2 = new Token<number>('token2');
```

以上两种创建 `Token` 的方式是等价的，这里定义的泛型 `number` 是指该 `Token` 对应的依赖的类型，需要显式的进行声明。

这两种创建 `Token` 方式的参数也完全一样，第一个参数是 `Token` 的标识字符串（仅支持字符串），第二个参数类型如下：

```ts
interface TokenOptions {
  /** 
   * 默认 Token name 只能使用一次
   * 如果开启 unique，则会对 Token 使用 symbol() 包裹
   * 那么即使是同一个name，也会被认为是两个完全不同的 Token 
   */
  unique?: boolean;
  /** 
   * 支持注入多实例模式，即同一个 Token 可以注入多个依赖，可以在 resolveAll 获取注入的所有依赖
   * 不开启在开发模式下会 warn，线上无影响
   */
  multiton?: boolean;
}
```

#### Resolver

`Resolver` 是负责处理注入的依赖的部分，SuperDI 提供了三种方式来生成 `Resolver`：

##### `asValue`

`asValue` 会直接注入一个值到依赖关系中，SuperDI 不会对该值做任何处理，而是将其直接交给使用方。

`asValue` 还支持以下配置:

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

`asFunction` 会注入一个函数到依赖关系中，SuperDI 会执行该函数，并将返回值提供给依赖方。

`asFunction` 支持 `asValue` 的所有配置参数，还额外支持以下两个参数：

1. `lifetime`: 设置注入的依赖的生效方式，其有以下两个取值：
   1. `LIFETIME.SINGLETON`: 默认值，在该模式中，容器只会执行一次传入的函数，并将该函数的返回值缓存起来，如果请求该依赖项，则直接返回缓存的值。这意味着所有的请求都会使用同一个函数返回值。
   2. `LIFETIME.TRANSIENT`: 在该模式种，每次请求依赖项时，容器都会执行函数并得到一个新的函数返回值并进行注入。这意味着每个请求都将得到一个新的函数返回值，其通常用于不需要共享实例的依赖项，或者那些有状态的依赖项。
2. `injector`: SuperDI 执行函数前，会先执行 `injector`，然后将其返回值传递给注入的函数。

`injector` 的类型如下，SuperDI 会将当前容器传递给 `injector` 作为参数。

```ts
type InjectorFunction<P> = (container: Container) => P;
```

特别需要说明的是，`injector` 的返回值必须是一个数组，用来支持注入函数的多参数能力。

举一个简单的例子:

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

上述 Demo 通过 `token` 最终可以获取一个数字 `0.30000000000000004`，这里将 `0.1` 和 `0.2` 注入到 `container` 中，然后再将其从 `injector` 中返回，并传递给 `add` 函数作为其两个参数，所以会得到 `num1` 和 `num2` 注入的两数之和。

这个例子也能体现依赖注入的优势，比如简单的 `add` 函数有精度计算问题，则可以通过 `token` 注入新的方法来替换掉该方法，如使用 `big.js`:

```ts
const bigAdd = (a: number, b: number) => Big(a).plus(b).toNumber();

container.register(token, asFunction(bigAdd, {
  injector: (con) => [con.resolve(num1)!, con.resolve(num2)!],
}));
```

这样，所有依赖该 `token` 的地方都会使用 `bigAdd` 而不是原来的 `add` 方法了，也就没有计算精度问题了。

##### `asClass`

`asClass` 会注入一个类到依赖关系中，SuperDI 会对该类进行实例化，并将实例提供给使用方。

`asClass` 的参数与 `asFunction` 一致，只是第一个参数必须为可以 `new` 的类，实例化前会执行 `injector` 并将其返回值作为其实例化时的参数。

#### Container

了解了 `Token` 和 `Resolver`，就可以使用 `Container` 进行依赖管理与注入了。

##### `createContainer`

首先需要创建一个 `Container` 容器：

```ts
import { createContainer } from 'superdi';
const container = createContainer();
```

这样就创建了一个 `Container` 实例，可以往 `Container` 里注入依赖，也可以从 `Container` 里获取注入的依赖。

##### `register`

可以通过 `Container` 的 `register` 方法向容器里注入一个依赖，注入依赖需要 `Token` 和依赖的 `Resolver`：

```ts
const token = createToken<number>('someNumberToken');
const value = 9.9;
container.register(token, asValue(value));
container.register(token, asFunction(() => value));
```

上面定义了一个 `token`，通过 TS 泛型约束了该 `token` 对应的依赖是 `number` 类型，如果不是 `number` 类型，`register` 时会有 TS 类型报错。

##### `hasRegistration`

可以通过 `Container` 的 `hasRegistration` 方法判断某个 `token` 是否已经被注入过依赖。

`hasRegistration` 的类型定义如下：

```ts
interface ContainerResolveOptions {
  scoped?: boolean;
}

Container.hasRegistration<T>(token: Token<T>, options?: ContainerResolveOptions): boolean;
```

使用时传入 token 就可以了，`true` 为已经有依赖注入，`false` 为还没有依赖注入。

```ts
container.hasRegistration(token);
```

如果传入了 `options.scoped` 为 `true`，则只在当前作用域查找，不会向上递归查找其父级作用域。

##### `resolve`

可以通过 `resolve` 方法获取对应 token 注入的依赖，如果该 token 还未注入依赖，则返回 `null`。

```ts
interface ContainerResolveOptions {
  scoped?: boolean;
}

Container.resolve<T>(token: Token<T>, options?: ContainerResolveOptions): T | null;
```

如果传入了 `options.scoped` 为 `true`，则只在当前作用域查找，不会向上递归查找其父级作用域。

##### `resolveAll`

可以通过 `resolveAll` 方法获取某个 `Token` 历史注入的所有依赖，并按照 `weight` 和注入顺序排序，以数组的形式进行返回。

```ts
interface ContainerResolveOptions {
  scoped?: boolean;
}

Container.resolveAll<T>(token: Token<T>, options?: ContainerResolveOptions): T[]
```

##### `hasResolved`

还可以通过 `Container` 的 `hasResolved` 方法判断某个 `token` 注入的依赖是否已经被依赖方使用。

```ts
Container.hasResolved<T>(token: Token<T>, options?: ContainerResolveOptions): boolean;
```

如果传入了 `options.scoped` 为 `true`，则只在当前作用域查找，不会向上递归查找其父级作用域。

##### `unregister`

可以通过 `unregister` 方法取消注入的依赖。

```ts
Container.unregister<P = unknown, R = unknown>(token: Token<R>, resolver?: Resolver<P, R>): Promise<any>;
```

该方法第二个参数可以省略，如果省略，则会清理该 `token` 历史注入的所有依赖，如果第二个参数也传了，则只会清理掉传入的 `resolver`。

该方法会返回清理依赖时执行依赖 `dispose` 方法的返回值，如果传了 `resolver`，则只会返回该 `resolver` 的 `dispose` 返回值或 `null`，如果没有传 `resolver`，则会返回数组，包括所有被清理的 `resolver` 的 `dispose` 的返回值。

##### `dispose`

```ts
Container.dispose(): Promise<any[]>;
```

该方法会将容器销毁，并执行所有注入的依赖 `dispose` 方法，将其返回值以数组形式返回。

#### Scope

SuperDI 有作用域的概念，可以在某个 `Container` 下创建一个 `Scope Container` 作为其子作用域，子作用域的方法和普通的容器完全一样，只是子作用域有一些特殊的处理逻辑：

1. `Container` 支持 `parentContainer`，子作用域会指向其父容器，如果没有父容器，则返回 `null`。
2. `Container` 支持 `rootContainer`，会递归的查找到最顶层的父容器，如果没有父容器，则返回 `null`。
3. `register` 时可以在 `Resolver` 上设置 `root` 为 `true`，那么即使是在子作用域注入的依赖，也会将其保存在根作用域上，默认 `root` 为 `false`。
4. `resolve` 和 `resolveAll` 等方法也可以指定 `scoped` 参数，为 `true` 表示只在当前作用域查找注入的依赖，为 `false` 表示会递归查找其父级作用域。

子作用域的创建方式如下：

```ts
const container = createContainer();
const scope = container.createScope();
```

很简单的在一个 `Container` 上执行 `createScope` 方法，就会在该 `Container` 下创建一个子作用域。
