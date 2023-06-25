import { Container } from "./container";
import { Resolver } from "./resolvers";
import { RegistrationResolver } from "./types";
import { last, sortResolvers, uniq } from "./utils";

let lastRegisterTimestamp  = 0;

export class Registration<P = any, R = any> {
  private resolvers: RegistrationResolver<P, R>[] = [];

  constructor(private container: Container) {}

  public get isEmpty() {
    return this.resolvers.length === 0;
  }
  
  public set(v: Resolver<P, R>) {
    const rs = createRegistrationResolver(v);
    this.resolvers = sortResolvers(uniq([...this.resolvers, rs]));
  }

  public get() : R | null {
    if (this.resolvers.length === 0) {
      return null;
    }

    return last(this.resolvers).resolve(this.container);
  }

  public getAll(): R[] {
    return this.resolvers.map(r => r.resolve(this.container));
  }

  public getResolvers(): RegistrationResolver<P, R>[] {
    return this.resolvers;
  }
  
  public async delete(v: Resolver<P, R>) {
    const originLength = this.resolvers.length;
    this.resolvers = this.resolvers.filter(r => r.__origin !== v);

    if (this.resolvers.length !== originLength) {
      return await v.disposer?.(v.resolve(this.container), this.container);
    }

    return null;
  }

  public async clear() {
    const resolvers = [...this.resolvers];
    this.resolvers = [];

    return await Promise.all(resolvers.map(r => r.disposer?.(r.resolve(this.container), this.container)));
  }

  public hasResolved() {
    return this.resolvers.some(resolver => resolver.hasResolved);
  }
}

const createRegistrationResolver = <P = unknown, R = unknown>(resolvers: Resolver<P, R>) => {
  const now = new Date().getTime();
  const timestamp = now <= lastRegisterTimestamp ? lastRegisterTimestamp + 1 : now;
  lastRegisterTimestamp = timestamp;

  return new Proxy(resolvers, {
    get(target, prop) {
      if (prop === 'timestamp') {
        return timestamp;
      } else if (prop === '__origin') {
        return target;
      } else {
        const value = (target as any)[prop];

        if (typeof value === 'function') {
          return value.bind(target);
        }

        return value;
      }
    }
  }) as unknown as  RegistrationResolver<P, R>;
};
