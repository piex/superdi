import { createToken, Token } from '../src';

describe("token", () => {
  it('createToken', () => {
    const token = createToken('token');
    expect(typeof token).toBe('object');
    expect(token.name).toBe(Symbol.for('token'));
  });

  it('new Token', () => {
    const token = new Token('newToken');
    expect(typeof token).toBe('object');
    expect(token.name).toBe(Symbol.for('newToken'));
  });

  it('createToken unique', () => {
    const tokenName = 'symbol_token';
    const token1 = createToken(tokenName, { unique: true });
    const token2 = createToken(tokenName, { unique: true });
    expect(token1.name).not.toEqual(Symbol.for(tokenName));
    expect(token2.name).not.toEqual(Symbol.for(tokenName));
    expect(token1.name).not.toEqual(token2.name);
  });

  it('createToken same token without unique', () => {
    const tokenName = 'without_unique';
    const token1 = createToken(tokenName);

    expect(token1.name).toBe(Symbol.for(tokenName));
    expect(() => createToken(tokenName)).toThrow(`PowerDI: Token name "${tokenName}" is already been used.`);
  });

  it('createToken multiton', () => {
    const token1 = createToken('token1', { multiton: false });
    const token2 = createToken('token2', { multiton: true });
    expect(token1.multiton).toBeFalsy();
    expect(token2.multiton).toBeTruthy();
  });
});
