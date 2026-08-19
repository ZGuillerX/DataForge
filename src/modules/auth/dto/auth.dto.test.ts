import { RegisterSchema, ResetPasswordSchema } from './auth.dto';

describe('password rules (RegisterSchema)', () => {
  const base = { email: 'user@test.com' };

  it('accepts a password with 8+ chars, upper, lower and a digit', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'Abcdef12' })).not.toThrow();
  });

  it('accepts a password with a symbol instead of a digit', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'Abcdefg!' })).not.toThrow();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'Ab1defg' })).toThrow();
  });

  it('rejects passwords without an uppercase letter', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'abcdefg1' })).toThrow();
  });

  it('rejects passwords without a lowercase letter', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'ABCDEFG1' })).toThrow();
  });

  it('rejects passwords without a digit or symbol', () => {
    expect(() => RegisterSchema.parse({ ...base, password: 'Abcdefgh' })).toThrow();
  });
});

describe('ResetPasswordSchema', () => {
  it('requires both a token and a valid password', () => {
    expect(() => ResetPasswordSchema.parse({ token: 'abc', password: 'Abcdef12' })).not.toThrow();
    expect(() => ResetPasswordSchema.parse({ token: '', password: 'Abcdef12' })).toThrow();
    expect(() => ResetPasswordSchema.parse({ token: 'abc', password: 'weak' })).toThrow();
  });
});
