import { ContainerResolveOptions, RegistrationMap, RegistrationResolver } from "./types";
import { Token } from "./token";
import { Resolver } from "./resolvers";
import { Registration } from "./registration";
import { sortResolvers } from "./utils";

export class Container {
  private registrationMap: RegistrationMap = new Map();
  #parentContainer?: Container;

  constructor(parentContainer?: Container) {
    this.#parentContainer = parentContainer;
  }

  public get parentContainer(): Container | null {
    return this.#parentContainer ?? null;
  }

  public get rootContainer(): Container {
    if (this.#parentContainer) {
      return this.#parentContainer.rootContainer;
    }
    return this;
  }

  public register<P = unknown, R = unknown>(token: Token<R>, resolver: Resolver<P, R>) {
    // options.root is always register in the root container.
    if (resolver.root) {
      if (this.parentContainer) {
        this.parentContainer.register(token, resolver);
        return;
      }
    }

    if (this.registrationMap.has(token.name)) {
      const registration = this.registrationMap.get(token.name)!;
      registration.set(resolver);
    } else {
      const registration = new Registration(this);
      registration.set(resolver);
      this.registrationMap.set(token.name, registration);
    }
  }

  public async unregister<P = unknown, R = unknown>(token: Token<R>, resolver?: Resolver<P, R>): Promise<any> {
    // 注入根容器的从根容器删除
    if (resolver?.root && this.parentContainer) {
      return this.parentContainer.unregister(token, resolver);
    }

    const disposePromise: Promise<any>[] = [];

    // 清理当前容器
    if (this.registrationMap.has(token.name)) {
      const registration = this.registrationMap.get(token.name)!;

      if (resolver) {
        disposePromise.push(registration.delete(resolver));
      } else {
        this.registrationMap.delete(token.name);
        disposePromise.push(registration.clear());
      }
    }

    // 清理父级容器
    if (this.parentContainer) {
      disposePromise.push(this.parentContainer.unregister(token, resolver));
    }

    return Promise.all(disposePromise).then(arr => {
      const firstPart = arr.slice(0, arr.length - 1);
      const lastElement = arr.slice(arr.length - 1)[0];
      return [...firstPart, lastElement];
    });
  }

  public resolve<T>(token: Token<T>, options: ContainerResolveOptions = {}): T | null {
    if (this.registrationMap.has(token.name)) {
      return this.registrationMap.get(token.name)?.get();
    }

    if (options.scoped) {
      return null;
    }

    if(this.parentContainer) {
      return this.parentContainer.resolve(token);
    }

    return null;
  }
  
  public resolveAll<T>(token: Token<T>, options: ContainerResolveOptions = {}): T[] {
    const hasToken = this.registrationMap.has(token.name);

    if (options.scoped || !this.parentContainer) {
      if (hasToken) {
        return this.registrationMap.get(token.name)!.getAll();
      } else {
        return [];
      }
    }

    return this.getResolvers(token).map(r => r.resolve(this) as T);
  }

  private getResolvers<T>(token: Token<T>) {
    const hasToken = this.registrationMap.has(token.name);

    let resolvers: RegistrationResolver<any, any>[] =[];
    if (hasToken) {
      resolvers = [...this.registrationMap.get(token.name)!.getResolvers()];
    }

    if(this.parentContainer) {
      resolvers = [...resolvers, ...this.parentContainer.getResolvers(token)];
    }

    return sortResolvers(resolvers);
  }

  public async dispose(): Promise<any[]> {
    const registrations: Registration[] = [];
    this.registrationMap.forEach(registration => {
      registrations.push(registration);
    });

    this.registrationMap.clear();
    return await Promise.all(registrations.map(r => r.clear()).flat(1));
  }

  public createScope() {
    const scope = new Container(this);

    return scope;
  }

  public hasRegistration<T>(token: Token<T>, options: ContainerResolveOptions = {}): boolean {
    const scopedHasRegistration = this.registrationMap.has(token.name);

    if (options.scoped || !this.parentContainer) {
      return scopedHasRegistration;
    }

    if (scopedHasRegistration) {
      return true;
    }

    return this.parentContainer.hasRegistration(token, { scoped:false });
  }

  public hasResolved<T>(token: Token<T>, options: ContainerResolveOptions = {}): boolean {
    const scopedHasToken = this.registrationMap.has(token.name);
    const registration = this.registrationMap.get(token.name);

    if (options.scoped || !this.parentContainer) {
      if (!scopedHasToken) {
        return false;
      }

      return registration!.hasResolved();
    }

    if(registration?.hasResolved()) {
      return true;
    }

    return this.parentContainer.hasResolved(token, { scoped: false});
  }
}

export const createContainer = (parentContainer?: Container) => new Container(parentContainer);

export const globalContainer = new Container();
