/**
 * พอร์ทัล CSMJU2030 จำลอง — ใช้พัฒนา/ทดสอบหน้าเว็บในเครื่องเท่านั้น ระหว่างที่ยังไม่เชื่อมพอร์ทัลจริงของ PM
 *
 * ทำงานแบบเดียวกับ Core Hub ตาม auth-contract 1.1 เฉพาะส่วนที่ระบบทุนใช้:
 *   API  :3000  GET /api/v1/health · GET /api/v1/.well-known/jwks.json · GET /api/v1/people/me · GET /api/v1/people/:personCode
 *   เว็บ :3100  GET /sso/authorize (เลือกบัญชีทดสอบ → ส่ง token กลับ /auth/callback) · GET /logout
 *
 * ไม่ต้องแก้โค้ดระบบทุนเลย — พอพอร์ทัลจริงพร้อม แค่ปิดสคริปต์นี้แล้วชี้ CORE_HUB_URL / CORE_HUB_WEB_URL ไปที่พอร์ทัลจริง
 * กุญแจ RSA สร้างใหม่ทุกครั้งที่เปิด (kid ใหม่) และไม่มีรหัสผ่านใด ๆ — ห้ามใช้บน server จริง
 *
 * รัน: pnpm dev:portal
 */
import { createServer } from 'node:http';
import { generateKeyPairSync, randomUUID, createSign } from 'node:crypto';

const API_PORT = Number(process.env.DEV_PORTAL_API_PORT ?? 3000);
const WEB_PORT = Number(process.env.DEV_PORTAL_WEB_PORT ?? 3100);
const CALLBACK = process.env.DEV_PORTAL_CALLBACK ?? 'http://localhost:3227/auth/callback';
const SUBSYSTEM = process.env.DEV_PORTAL_SUBSYSTEM ?? 'csmju-scholarship';
const APP_URL = new URL(CALLBACK).origin;
const TOKEN_TTL = 15 * 60;

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const KID = `dev-portal-${Date.now()}`;

/**
 * บัญชีทดสอบ (sub คงที่ ข้อมูลที่ยื่นไว้จึงยังอยู่หลังเปิดสคริปต์ใหม่)
 * sub ของนักศึกษาเป็นรูป user-<รหัส> แบบเดียวกับ Core Hub จริง (ไม่ใช่ UUID — auth-contract 1.2)
 */
const PERSONAS = {
  student: { sub: 'user-6704101001', email: '6704101001@sso.mju.local', role: 'student', label: 'นักศึกษา (ทดสอบ 1)', personCode: '6704101001' },
  student2: { sub: 'user-6704101002', email: '6704101002@sso.mju.local', role: 'student', label: 'นักศึกษา (ทดสอบ 2)', personCode: '6704101002' },
  staff: { sub: '7f1c2d3e-0003-4a5b-8c9d-000000000003', email: 'staff.demo@csmju.local', role: 'staff', label: 'เจ้าหน้าที่ทุน', personCode: 'staff.demo' },
  lecturer: { sub: '7f1c2d3e-0005-4a5b-8c9d-000000000005', email: 'lecturer.demo@csmju.local', role: 'lecturer', label: 'อาจารย์', personCode: 'lecturer.demo' },
  admin: { sub: '7f1c2d3e-0004-4a5b-8c9d-000000000004', email: 'admin.demo@csmju.local', role: 'admin', label: 'ผู้ดูแลระบบ', personCode: null },
  guest: { sub: '7f1c2d3e-0006-4a5b-8c9d-000000000006', email: 'guest.demo@csmju.local', role: 'guest', label: 'ผู้เยี่ยมชม (ต้องเข้าไม่ได้)', personCode: null },
};

/** ทะเบียนบุคคลจำลอง — รูปแบบ field ตาม reference-data.md ข้อ 5.1 (ชื่อสมมติทั้งหมด) */
const SCI = { code: 'SCI', nameTh: 'คณะวิทยาศาสตร์' };
const CS = { code: 'CS', nameTh: 'สาขาวิชาวิทยาการคอมพิวเตอร์' };
const PEOPLE = {
  '6704101001': { personCode: '6704101001', personType: 'STUDENT', fullNameTh: 'นักศึกษา ทดสอบหนึ่ง', fullNameEn: 'Test Student One', entryYear: 2567, status: 'ACTIVE', faculty: SCI, department: CS, curriculum: { code: '65304010', nameTh: 'วท.บ. วิทยาการคอมพิวเตอร์', curriculumYear: 2565 } },
  '6704101002': { personCode: '6704101002', personType: 'STUDENT', fullNameTh: 'นักศึกษา ทดสอบสอง', fullNameEn: 'Test Student Two', entryYear: 2567, status: 'ACTIVE', faculty: SCI, department: CS, curriculum: { code: '65304010', nameTh: 'วท.บ. วิทยาการคอมพิวเตอร์', curriculumYear: 2565 } },
  'staff.demo': { personCode: 'staff.demo', personType: 'STAFF', staffType: 'OFFICER', fullNameTh: 'เจ้าหน้าที่ ทดสอบ', fullNameEn: null, entryYear: null, status: 'ACTIVE', faculty: SCI, department: CS, curriculum: null },
  'lecturer.demo': { personCode: 'lecturer.demo', personType: 'STAFF', staffType: 'LECTURER', academicTitle: 'อ.', fullNameTh: 'อาจารย์ ทดสอบ', fullNameEn: null, entryYear: null, status: 'ACTIVE', faculty: SCI, department: CS, curriculum: null },
};
const withAccount = (person) => {
  const owner = Object.values(PERSONAS).find((p) => p.personCode === person.personCode);
  return { ...person, coreUserId: owner?.sub ?? null, universityEmail: owner?.email ?? null };
};

const b64 = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

function sign(persona) {
  const iat = Math.floor(Date.now() / 1000);
  const header = b64({ alg: 'RS256', typ: 'JWT', kid: KID });
  const payload = b64({ sub: persona.sub, email: persona.email, role: persona.role, sid: randomUUID(), iss: 'core-hub', aud: 'csmju2030', azp: SUBSYSTEM, iat, exp: iat + TOKEN_TTL });
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};
const html = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>พอร์ทัล CSMJU2030 (จำลอง)</title>
<style>body{font-family:system-ui,'Noto Sans Thai',sans-serif;background:#f4f6fb;margin:0;color:#16264d}main{max-width:460px;margin:8vh auto;padding:0 16px}
.card{background:#fff;border-radius:16px;box-shadow:0 8px 30px rgba(22,38,77,.12);overflow:hidden}.head{background:linear-gradient(135deg,#16264d,#0d4fa8);color:#fff;padding:24px}
.head h1{margin:0;font-size:22px}.head p{margin:6px 0 0;opacity:.8;font-size:14px}.body{padding:20px 24px}
a.btn{display:block;text-decoration:none;color:#16264d;border:1px solid #d6dbe8;border-radius:12px;padding:12px 16px;margin:10px 0}a.btn:hover{border-color:#2154d9;background:#f0f4ff}
a.btn small{display:block;color:#6b7280}.warn{background:#fff7e0;color:#8a5a00;border-radius:10px;padding:10px 12px;font-size:13px}</style></head><body><main>${body}</main></body></html>`);
};
function personaOf(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  try {
    const claims = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64url').toString());
    return Object.values(PERSONAS).find((p) => p.sub === claims.sub) ?? null;
  } catch {
    return null;
  }
}
const cookie = (req, name) => (req.headers.cookie ?? '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === name)?.[1];

function redirectToCallback(res, persona, state, extraHeaders = {}) {
  const target = new URL(CALLBACK);
  target.searchParams.set('access_token', sign(persona));
  target.searchParams.set('token_type', 'Bearer');
  target.searchParams.set('expires_in', String(TOKEN_TTL));
  if (state) target.searchParams.set('state', state);
  res.writeHead(302, { location: target.toString(), 'cache-control': 'no-store', ...extraHeaders });
  res.end();
}

// ------------------------------------------------------------------ API :3000
createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/api/v1/health') return json(res, 200, { success: true, data: { status: 'ok', service: 'dev-portal' } });
  if (url.pathname === '/api/v1/.well-known/jwks.json') {
    return json(res, 200, { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: KID, use: 'sig', alg: 'RS256' }] });
  }
  // ข้อมูลบุคคล — ต้องมี Bearer ที่ออกโดยพอร์ทัลนี้ (ตรวจแค่ถอด payload พอสำหรับเครื่องมือในเครื่อง)
  if (url.pathname.startsWith('/api/v1/people/')) {
    const caller = personaOf(req);
    if (!caller) return json(res, 401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    const code = decodeURIComponent(url.pathname.slice('/api/v1/people/'.length));
    if (code === 'me') {
      if (caller.role === 'guest') return json(res, 403, { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
      const person = caller.personCode ? PEOPLE[caller.personCode] : null;
      return json(res, 200, { success: true, data: person ? withAccount(person) : null });
    }
    if (!['staff', 'lecturer', 'admin'].includes(caller.role)) return json(res, 403, { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } });
    const person = PEOPLE[code];
    if (!person) return json(res, 404, { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } });
    return json(res, 200, { success: true, data: withAccount(person) });
  }
  json(res, 404, { success: false, error: { code: 'NOT_FOUND', message: 'dev portal: not implemented' } });
}).listen(API_PORT, () => console.log(`[dev-portal] API  http://localhost:${API_PORT}`));

// ------------------------------------------------------------------ เว็บ :3100
createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const state = url.searchParams.get('state') ?? '';

  if (url.pathname === '/sso/authorize') {
    // มี "session พอร์ทัล" อยู่แล้ว → ส่งกลับทันที (เหมือนผู้ใช้ล็อกอินพอร์ทัลไว้)
    const current = PERSONAS[cookie(req, 'dev_portal_persona') ?? ''];
    if (current) return redirectToCallback(res, current, state);
    const links = Object.entries(PERSONAS)
      .map(([key, p]) => `<a class="btn" href="/sso/pick?persona=${key}&state=${encodeURIComponent(state)}"><b>${p.label}</b><small>${p.email} · role ${p.role}</small></a>`)
      .join('');
    return html(res, 200, `<div class="card"><div class="head"><h1>พอร์ทัล CSMJU2030 (จำลอง)</h1><p>เลือกบัญชีทดสอบเพื่อเข้าระบบทุนการศึกษา</p></div>
<div class="body"><p class="warn">สำหรับพัฒนาในเครื่องเท่านั้น — ระบบจริงเข้าสู่ระบบผ่านพอร์ทัลของ PM</p>${links}</div></div>`);
  }

  if (url.pathname === '/sso/pick') {
    const key = url.searchParams.get('persona') ?? '';
    const persona = PERSONAS[key];
    if (!persona) return html(res, 400, '<p>ไม่พบบัญชีทดสอบ</p>');
    return redirectToCallback(res, persona, state, { 'set-cookie': `dev_portal_persona=${key}; Path=/; HttpOnly; SameSite=Lax` });
  }

  if (url.pathname === '/logout') {
    return html(
      res,
      200,
      `<div class="card"><div class="head"><h1>ออกจากระบบแล้ว</h1><p>ออกจากพอร์ทัลจำลองเรียบร้อย</p></div>
<div class="body"><a class="btn" href="${APP_URL}/"><b>กลับไประบบทุนการศึกษา</b><small>${APP_URL}</small></a></div></div>`,
      { 'set-cookie': 'dev_portal_persona=; Path=/; Max-Age=0' },
    );
  }

  // หน้าแรกพอร์ทัล — ลิงก์เข้าระบบย่อยแบบเดียวกับแถบเมนูของพอร์ทัลจริง
  html(res, 200, `<div class="card"><div class="head"><h1>พอร์ทัล CSMJU2030 (จำลอง)</h1><p>ระบบย่อย</p></div>
<div class="body"><a class="btn" href="/sso/authorize?subsystem=csmju-scholarship"><b>ทุนการศึกษาและสวัสดิการ</b><small>csmju-scholarship</small></a>
<p class="warn">สำหรับพัฒนาในเครื่องเท่านั้น</p></div></div>`);
}).listen(WEB_PORT, () => console.log(`[dev-portal] เว็บ http://localhost:${WEB_PORT}  (callback → ${CALLBACK})`));
