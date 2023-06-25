import { TokenOptions } from './types';

const defaultTokenOptions: TokenOptions = {
  unique: false,
  multiton: false,
};

const tokenMap = new Map<string, boolean>();

export class Token<T> {
  readonly #name: symbol;
  public readonly multiton: boolean;
  private readonly _: T | undefined = undefined;

  constructor(name: string, options: TokenOptions = defaultTokenOptions) {
    if(options.unique) {
      this.#name = Symbol(name);
    } else {
      if (tokenMap.has(name)) {
        throw new Error(`Podi: Token name "${name}" is already been used.`);
      }
      this.#name = Symbol.for(name);
      tokenMap.set(name, true);
    }

    this.multiton = options.multiton ?? false;
  }

  public get name() {
    return this.#name;
  }
}

export const createToken = <T>(name: string, options?: TokenOptions) => new Token<T>(name, options);
