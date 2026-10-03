import { exportJWK, generateKeyPair, SignJWT, type KeyLike } from 'jose';
import { InvalidTokenError } from '../src/auth/auth.errors';
import { CoreHubTokenVerifier } from '../src/auth/core-hub-token.verifier';
import type { JwksService } from '../src/auth/jwks.service';

const KID = 'core-hub-2026';

describe('CoreHubTokenVerifier', () => {
  let privateKey: KeyLike;
  let verifier: CoreHubTokenVerifier;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    await exportJWK(pair.publicKey);
    const jwks = {
      getKey: async (kid: string) => {
        if (kid !== KID) throw new InvalidTokenError('unknown kid');
        return pair.publicKey;
      },
    } as unknown as JwksService;
    verifier = new CoreHubTokenVerifier(jwks, { subsystemName: 'csmju-scholarship' });
  });

  const token = (claims: Record<string, unknown> = {}, kid = KID, issuer = 'core-hub') =>
    new SignJWT({ email: 'student@core.local', role: 'student', sid: 's1', ...claims })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid })
      .setSubject('user-002')
      .setIssuer(issuer)
      .setAudience('csmju2030')
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(privateKey);

  it('accepts a valid Core Hub token', async () => {
    const claims = await verifier.verify(await token());
    expect(claims.sub).toBe('user-002');
    expect(claims.role).toBe('student');
  });

  it('rejects a wrong issuer', async () => {
    await expect(verifier.verify(await token({}, KID, 'evil-hub'))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects an unknown kid', async () => {
    await expect(verifier.verify(await token({}, 'other-kid'))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects an expired token', async () => {
    const expired = await new SignJWT({ role: 'student' })
      .setProtectedHeader({ alg: 'RS256', kid: KID })
      .setSubject('user-002')
      .setIssuer('core-hub')
      .setAudience('csmju2030')
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 120)
      .sign(privateKey);
    await expect(verifier.verify(expired)).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects unsigned and malformed tokens', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', kid: KID })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'x' })).toString('base64url');
    await expect(verifier.verify(`${header}.${payload}.`)).rejects.toBeInstanceOf(InvalidTokenError);
    await expect(verifier.verify('not-a-jwt')).rejects.toBeInstanceOf(InvalidTokenError);
  });

  const signWith = (claims: Record<string, unknown>, iat: number | undefined, exp: number, sub = 'user-6704101001') => {
    let jwt = new SignJWT({ role: 'student', ...claims }).setProtectedHeader({ alg: 'RS256', kid: KID }).setSubject(sub);
    jwt = jwt.setIssuer('core-hub').setAudience('csmju2030').setExpirationTime(exp);
    if (iat !== undefined) jwt = jwt.setIssuedAt(iat);
    return jwt.sign(privateKey);
  };
  const now = () => Math.floor(Date.now() / 1000);

  it('accepts a non-UUID sub such as user-<studentCode> and ignores unknown claims (step 8)', async () => {
    const claims = await verifier.verify(await signWith({ extra: 'x', foo: 1 }, now(), now() + 900));
    expect(claims.sub).toBe('user-6704101001');
  });

  it('rejects a sub longer than 64 characters (step 8)', async () => {
    await expect(verifier.verify(await signWith({}, now(), now() + 900, 'x'.repeat(65)))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a token without iat (step 9)', async () => {
    await expect(verifier.verify(await signWith({}, undefined, now() + 900))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('rejects a long-lived token such as a refresh token (step 9)', async () => {
    await expect(verifier.verify(await signWith({}, now(), now() + 7 * 86400))).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it('accepts a lifetime within 900 + 60 seconds (step 9)', async () => {
    await expect(verifier.verify(await signWith({}, now(), now() + 960))).resolves.toBeDefined();
  });

  it('accepts azp equal to this subsystem and rejects another subsystem (step 10)', async () => {
    await expect(verifier.verify(await signWith({ azp: 'csmju-scholarship' }, now(), now() + 900))).resolves.toBeDefined();
    await expect(verifier.verify(await signWith({ azp: 'csmju-equipment' }, now(), now() + 900))).rejects.toBeInstanceOf(InvalidTokenError);
  });
});
