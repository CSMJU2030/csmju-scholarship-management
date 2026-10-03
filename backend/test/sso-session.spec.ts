import { cookieNames, safeEqual, safeNextPath, serializeCookie } from '../src/auth/sso-session';

describe('safeNextPath (auth-contract.md 5.2)', () => {
  it.each([
    ['/scholarship/track?tn=1', '/scholarship/track?tn=1'],
    ['/', '/'],
  ])('keeps %s', (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });

  it.each(['//evil.example.com', '/\\evil.example.com', 'https://evil.example.com', 'relative', '/auth', '/auth/login', '/a\u0000b', ''])(
    'rejects %s',
    (input) => {
      expect(safeNextPath(input, '/home')).toBe('/home');
    },
  );

  it('rejects values longer than 512 characters', () => {
    expect(safeNextPath(`/${'a'.repeat(600)}`, '/home')).toBe('/home');
  });
});

describe('cookies', () => {
  it('derives names from the subsystem name', () => {
    expect(cookieNames('csmju-scholarship')).toEqual({
      session: 'csmju_scholarship_access_token',
      state: 'csmju_scholarship_sso_state',
    });
  });

  it('serializes HttpOnly SameSite=Lax cookies', () => {
    const cookie = serializeCookie('x', 'v', { maxAgeSec: 60, path: '/', secure: false });
    expect(cookie).toBe('x=v; Max-Age=60; Path=/; HttpOnly; SameSite=Lax');
    expect(serializeCookie('x', 'v', { maxAgeSec: 60, path: '/', secure: true })).toContain('Secure');
  });

  it('compares states in constant time', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
