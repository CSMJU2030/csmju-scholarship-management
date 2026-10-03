# REPORT — csmju-scholarship

ย้ายระบบทุนการศึกษาและสวัสดิการจาก Next.js + SQLite (API routes ใน Next.js) มาเป็นโครงตามมาตรฐาน
CSMJU2030 `1.7.0`: `backend/` NestJS + Prisma + PostgreSQL แยกจาก `frontend/` Next.js และเข้าสู่ระบบผ่าน Core Hub SSO

## ผลรัน

ทดสอบกับ PostgreSQL 16 จริง และ Core Hub จำลอง (ออก token RS256 + JWKS ตาม `contracts/jwt-contract.json`)
ต้องรันซ้ำกับ `csmju-core-hub` จริงก่อนส่งงาน

```
./standards/scripts/run-all-checks.sh .
  ✅ PASS  Convention / Standards Version / Security & Stack / API Contract Sync
  ✅ PASS  Data Dictionary / UI Token / Code Quality / Exception Validation
✅ All 19 checks passed.

node standards/conformance/run.js          (base_url http://localhost:3227 ผ่าน frontend)
RESULT: 70 passed · 0 failed · 0 skipped · 0 warnings · retries: 0
✅ CONFORMANT — csmju-scholarship meets standard v1.1 L3

pnpm --filter backend test
Tests:       23 passed, 23 total
```

## ไฟล์ที่สร้าง/แก้ไข

- `backend/` — ใหม่ทั้งหมด: NestJS 11, Prisma 7.9.1 (PrismaPg), migration แรก, seed ข้อมูลอ้างอิง, `openapi.json`
- `frontend/` — ย้ายหน้าเว็บเดิมมาไว้ที่นี่ เขียนใหม่เป็น TypeScript ใช้ design token และ lucide-react, เรียก API ผ่าน type ที่ generate จาก `openapi.json`
- ลบ: `app/api/*` (API ใน Next.js), `database/*` (SQLite, ตาราง admins, ข้อมูลจำลอง), `middleware.js`, หน้า login รหัสผ่านแอดมิน, Font Awesome CDN, แกลเลอรีภาพกิจกรรมจำลองในหน้า กยศ.
- ราก repo: `pnpm-workspace.yaml`, `subsystem.yaml`, `.standards-version`, `.github/` (จาก `standards/templates`), `docker-compose.yml`

## ชั้น auth ที่คัดลอกมา

- reference implementation `demo-student-subsystem` เป็น private repo ที่เข้าถึงไม่ได้ตอนทำงานนี้
  จึง**เขียนชั้น auth ขึ้นเองตาม `auth-contract.md` 1.1 ทีละข้อ** แล้วพิสูจน์ด้วย conformance L1–L3 ครบ 70 เคส
- ไฟล์: `jwks.service.ts` · `core-hub-token.verifier.ts` · `auth.errors.ts` · `core-hub-identity.ts` · `guards/` · `decorators/` · `sso-callback.controller.ts` · `sso-session.ts` · `me.controller.ts`
- **ต้องทำต่อ:** เมื่อได้สิทธิ์อ่าน `demo-student-subsystem` ให้แทนไฟล์เหล่านี้ด้วยของ reference ตาม `ai/AGENTS.md` ข้อ 2

## Role mapping ที่ประกาศ (ต้องตรงกับ default_role_mapping ในทะเบียน)

| core role | subsystem role |
|---|---|
| student | STUDENT |
| staff | STAFF |
| lecturer | STAFF |
| admin | ADMIN |
| alumni | — (ไม่รับ → 403) |

## ข้อสมมติที่ตั้งเอง (เพราะมาตรฐานไม่ได้ระบุ)

1. ชื่อระบบ `csmju-scholarship` · พอร์ต backend 4227 / frontend 3227 (ตามไฟล์บัญชี dev server ที่ทีมได้รับ — แถว csmju-scholarship-management) · ฐานข้อมูล `scholarship_db`
2. frontend ส่งต่อ `/api/*` และ `/auth/*` ไป backend (Next.js rewrites) เพื่อให้ผู้ใช้เห็น origin เดียว — `callback_url` ที่ลงทะเบียนจึงเป็น `http://localhost:3227/auth/callback`
3. (1.7.0) เลิกตาราง `students` — ไม่เก็บชื่อ/ชั้นปี/สาขา · คำร้องเก็บ `core_user_id` + `person_code` (จาก `/people/me` ตอนยื่น) · เบอร์ติดต่อ GPA อายุ สัญชาติ เลขบัตร เป็นข้อมูลที่ผู้ยื่นแจ้งในคำร้องนั้น จึงเก็บกับคำร้อง (migration `20261001120000` ย้ายข้อมูลเดิมให้)
4. GPA เก็บเป็นจำนวนเต็ม "ร้อยส่วน" (`gpa_hundredths`, 3.25 → 325) เพื่อไม่ใช้ทศนิยมในฐานข้อมูล · API ส่งเป็นตัวเลขทศนิยมปกติ
5. หน้าติดตามคำร้องเดิมค้นด้วยรหัสติดตาม/เบอร์โทรโดยไม่ login — ขัดกับกฎ "ทุก /api/v1 ต้องมี token" จึงเปลี่ยนเป็นแสดงคำร้องของผู้ใช้ที่ login (`record.core_user_id === token.sub`)
6. ประกาศทุนที่มีใบสมัครแล้วลบไม่ได้ (409) ให้ปิดประกาศด้วย `PATCH isActive=false` แทน
7. ผู้ยื่นแก้ไข/ยกเลิกคำร้องเองได้เฉพาะสถานะ `PENDING_ADVISOR` (ทุกครั้งบันทึกลงประวัติ) · ยกเลิกแล้วสมัครทุนเดิมใหม่ได้ · core role `lecturer` map เป็น `STAFF`
8. สถานะพอร์ทัล (`GET /api/health` → `data.portal`) ตรวจทั้ง API และเว็บของ Core Hub ทุก 30 วินาที — หน้าเว็บใช้ตัดสินว่าจะ silent SSO หรือแสดงทางเข้าผ่านพอร์ทัล · โลโก้ในแถบข้างโหลด `/csmju-logo.png` จากพอร์ทัล (มีโลโก้สำรองเมื่อโหลดไม่ได้)
9. ทุนที่บันทึกไว้ และรายการที่เปิดดูแล้ว (สำหรับป้าย "อัปเดตใหม่") เก็บใน localStorage ของเบราว์เซอร์ต่อผู้ใช้ — เป็นความสะดวกเท่านั้น ไม่ใช่ข้อมูลหลัก
10. กราฟวาดด้วย SVG เอง (ยังไม่มี chart library ใน whitelist) ใช้สี `--color-chart-1..6` มี legend ตัวเลขกำกับ ลายทแยง และมุมมองตาราง
11. เปลี่ยนสถานะคำร้องใช้ `PATCH /api/v1/requests/:id` และบันทึกประวัติทุกครั้งในตาราง `request_status_histories`

## ย้ายเป็น standards 1.7.0 (1 ต.ค. 2569)

- ตรวจ token ครบ 10 ขั้น (เพิ่ม `iat` + อายุ ≤ 900+60 วินาที · `azp` ต้องเป็น `csmju-scholarship` เมื่อมี · `sub` เป็น text ≤ 64 ไม่ใช่ UUID · claim อื่นปล่อยผ่าน) + test
- callback: state ไม่ตรง → 401 หน้า HTML ปุ่ม "เข้าสู่ระบบอีกครั้ง" · role ที่ไม่รับ → 403 หน้า HTML · log แค่ path (`jwt.verification.failure` · `authorization.role_mapping_failed`)
- token ของผู้ใช้เก็บใน WeakMap ต่อ request ใช้เรียก Core Hub เฉพาะ `/people/me` และ `/people/:personCode` · 401 จาก Core Hub → 401 · ล่ม/429 → 503 + `Retry-After`
- core role 6 ค่า · `lecturer` → STAFF · `guest`/`alumni` ไม่รับ · `subsystem.yaml` ชี้ `https://csmju2030.jowave.com` · พอร์ต 3227/4227
- หน้าที่มีฟอร์มค้าง (สมัครทุน · ขอความช่วยเหลือ) เมื่อ session หมดจะไม่ redirect ทับ แต่ขึ้นแถบให้ต่ออายุในแท็บใหม่
- ยังไม่ได้รัน conformance กับพอร์ทัลจริง (ต้องลงทะเบียนและได้ไฟล์บัญชีจากผู้ดูแลก่อน)

## สิ่งที่ยังทำไม่ได้ / เคสที่ยังไม่ผ่าน

- ยังไม่ได้รัน conformance กับ `csmju-core-hub` ตัวจริงและยังไม่ได้ลงทะเบียนระบบ (ขั้นตอนอยู่ใน README ข้อ 5)
- `@csmju2030/design-system` (`<CsmjuAppShell>`, `formatDate`, `<RoleBadge>`) ยังไม่มีให้ใช้ จึงทำ `AppShell` และ util แสดงผลในเครื่องไว้ก่อน (`frontend/src/components/app-shell.tsx`, `frontend/src/lib/format.ts`) — เปลี่ยนเป็นของ package เมื่อพร้อม
- ชั้น auth ยังไม่ใช่ไฟล์จาก reference implementation (ดูหัวข้อด้านบน)
- ระหว่างที่ยังไม่เชื่อมพอร์ทัลจริง ใช้พอร์ทัลจำลอง `tools/dev-portal` (`pnpm dev:portal`) — ไม่ได้แก้โค้ดระบบ เป็นแค่เครื่องมือในเครื่อง
- ไม่มีข้อมูลจำลองแล้ว — ต้องให้เจ้าหน้าที่ (role `staff`) สร้างประกาศทุนแรกผ่านหน้า "จัดการทุนและคำร้อง"
