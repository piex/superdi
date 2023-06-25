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

  public register<P = unknown, R = unknown>(token: Token<R>, v: Resolver<P, R>) {
    // options.root is always cached in the root container.

    if (v.root) {
      if (this.parentContainer) {
        this.parentContainer.register(token, v);
        return;
      }
    }

    if (this.registrationMap.has(token.name)) {
      const registration = this.registrationMap.get(token.name)!;
      registration.set(v);
    } else {
      const registration = new Registration(this);
      registration.set(v);
      this.registrationMap.set(token.name, registration);
    }
  }

  public async unregister<P = unknown, R = unknown>(token: Token<R>, v?: Resolver<P, R>) {
    if (!this.registrationMap.has(token.name)) {
      return true;
    }

    const registration = this.registrationMap.get(token.name)!;

    if( v === undefined ) {
      this.registrationMap.delete(token.name);
      return registration.clear();
    }
    
    const res = await registration.delete(v);

    if(registration.isEmpty) {
      this.registrationMap.delete(token.name);
    }

    return res;
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

  public getResolvers<T>(token: Token<T>) {
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

  public async dispose() {
    const registrations: Registration[] = [];
    this.registrationMap.forEach(registration => {
      registrations.push(registration);
    });

    this.registrationMap.clear();
    return await Promise.all(registrations.map(r => r.clear()));
  }

  public createScope() {
    const scope = new Container(this);

    return scope;
  }

  public hasRegistration<T>(token: Token<T>) {
    return this.registrationMap.has(token.name);
  }

  public hasResolved<T>(token: Token<T>) {
    if (!this.registrationMap.has(token.name)) {
      return false;
    }

    const registration = this.registrationMap.get(token.name)!;
    return registration.hasResolved();
  }
}

export const createContainer = () => new Container();
