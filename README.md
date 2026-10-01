# csmju-scholarship — ระบบทุนการศึกษาและสวัสดิการนักศึกษา

ระบบย่อยของแพลตฟอร์ม **CSMJU2030** (สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้)
ทำตามมาตรฐานกลาง [`csmju2030-standards`](https://github.com/CSMJU2030/csmju2030-standards) เวอร์ชัน `1.7.0`

- สมัครทุนแบบฟอร์มหลายขั้น · บันทึกทุนที่สนใจ (ดาว) · ตัวกรอง/เรียงลำดับ · ตรวจสอบสิทธิ์จากเกรดเฉลี่ย · แจ้งเตือนทุนใกล้ปิดรับ
- ยื่นคำร้องขอความช่วยเหลือฉุกเฉิน (หลายขั้น) พร้อมแนบไฟล์หลักฐานแบบลากวาง
- คำร้องของฉัน: ไทม์ไลน์สถานะ · ป้าย "อัปเดตใหม่" + กระดิ่งแจ้งเตือน · แก้ไข/ยกเลิกได้ระหว่างรออาจารย์ที่ปรึกษา · แนบไฟล์เพิ่ม · พิมพ์ใบยืนยัน
- เจ้าหน้าที่: แดชบอร์ดกราฟ (รายเดือน สถานะ ประเภทความเดือดร้อน ความเร่งด่วน ทุนยอดนิยม) · พิจารณาคำร้องใน drawer · ส่งออก CSV · จัดการประกาศทุน
- **เข้าใช้งานผ่านพอร์ทัล CSMJU2030 เท่านั้น** — ระบบนี้ไม่มีหน้า/ปุ่ม login: ถ้าพอร์ทัลออนไลน์จะขอ token แบบเงียบ (silent SSO) ให้เอง ถ้าพอร์ทัลปิดอยู่จะแสดงหน้า "ระบบนี้เข้าใช้งานผ่านพอร์ทัล CSMJU2030" แทน (ไม่ redirect ไปหน้าที่เปิดไม่ได้)

## โครงสร้าง

```text
mis-scholarship/
├── backend/            NestJS 11 + Prisma 7.9.1 + PostgreSQL  → http://127.0.0.1:4227
│   ├── prisma/         schema.prisma · migrations/ · seed.ts (ข้อมูลอ้างอิงเท่านั้น)
│   ├── src/auth/       ตรวจ token ของ Core Hub (RS256 + JWKS + kid) · SSO · role/permission
│   └── openapi.json    สัญญา API (generate จากโค้ด)
├── frontend/           Next.js (App Router) + Tailwind v4        → http://localhost:3227
│   └── src/            ส่งต่อ /api/* และ /auth/* ไป backend (origin เดียว)
├── subsystem.yaml      manifest ที่ CI และ conformance อ่าน
├── tools/dev-portal/   พอร์ทัลจำลองสำหรับทดสอบในเครื่อง (ไม่ขึ้น server)
├── .standards-version  1.7.0
└── pnpm-workspace.yaml
```

| พอร์ต | ระบบ |
|---|---|
| 3227 | **หน้าเว็บระบบนี้** (เปิดที่นี่ · พอร์ตที่ลงทะเบียน callback) |
| 4227 | backend ระบบนี้ |
| 5432 | PostgreSQL (`scholarship_db`) |
| 3000 · 3100 | พอร์ทัลจำลอง (`pnpm dev:portal`) — ใช้เฉพาะตอนยังไม่เชื่อมพอร์ทัลจริง |

> พอร์ต 32xx/42xx ตามที่ผู้ดูแล dev server กำหนดให้ทีม (standards `connect-core-hub.md` ข้อ 1) —
> ถ้าทีมได้เลขอื่น แก้ `frontend/package.json` (`-p`), `PORT` ใน `backend/.env`, `BACKEND_URL` ใน `frontend/.env.local` และ `base_url` ใน `subsystem.yaml`
>
> **ไม่ต้องโคลนหรือรัน Core Hub เอง** — Core Hub ตัวจริงอยู่ที่ `https://csmju2030.jowave.com` (repo ของ Core Hub มีข้อมูลนักศึกษาจริง)

## ติดตั้งครั้งแรก (Windows)

ใช้ PowerShell ในโฟลเดอร์โปรเจกต์ (คำสั่ง `curl` / สคริปต์ `.sh` ใช้ Git Bash)

**1. เตรียมเครื่อง** — Node.js 22.x · PostgreSQL 16+ · pnpm

```powershell
# เปิด PowerShell แบบ Run as Administrator ครั้งเดียว
corepack enable pnpm
pnpm -v        # ต้องได้ 12.3.4 (corepack อ่านจาก packageManager ใน package.json)
```

**2. สร้างฐานข้อมูล** — ใน pgAdmin หรือ psql ด้วย user `postgres`

```sql
CREATE DATABASE scholarship_db;
```

**3. ตั้งค่า backend**

```powershell
copy backend\.env.example backend\.env
notepad backend\.env
```

แก้บรรทัด `DATABASE_URL` ให้เป็นรหัสผ่าน postgres ของเครื่อง เช่น

```text
DATABASE_URL=postgresql://postgres:<รหัสผ่านของคุณ>@localhost:5432/scholarship_db?schema=public
```

**4. ติดตั้งและสร้างตาราง**

```powershell
pnpm install
pnpm --filter backend db:migrate     # สร้างตารางทั้งหมด
pnpm --filter backend db:seed        # ใส่ข้อมูลอ้างอิง (สถานะ ประเภททุน ธนาคาร) — ไม่มีข้อมูลจำลอง
```

**5. ลงทะเบียนระบบกับพอร์ทัลจริง (ครั้งเดียว — PL ของทีม)** ตาม standards `docs/connect-core-hub.md` ข้อ 3

login `https://csmju2030.jowave.com` ด้วยบัญชีเจ้าของระบบของทีม → หลังบ้าน → ระบบย่อย → ลงทะเบียนระบบย่อย แล้วกรอก

| ช่อง | ค่า |
|---|---|
| ชื่อระบบ | `csmju-scholarship` |
| ชื่อที่แสดง | ทุนการศึกษาและสวัสดิการ |
| Repository | `github.com/CSMJU2030/<ชื่อ repo>` |
| Callback URL | `http://localhost:3227/auth/callback` (พอร์ต **frontend**) |
| Base URL | เว้นว่าง |
| บทบาท | student→`STUDENT` · staff→`STAFF` · lecturer→`STAFF` · admin→`ADMIN` (ไม่ติ๊ก alumni · guest) |

รอ admin ระบบกลางอนุมัติ — ระหว่างรอ ปุ่มเข้าระบบจะพาไปหน้า "ระบบนี้ยังไม่เปิดให้ใช้งาน" ของพอร์ทัล ·
บัญชีทดสอบได้จากผู้ดูแล dev server ทางข้อความส่วนตัวเท่านั้น ห้ามใส่ใน repo

## รันระบบ

เปิด 2 terminal (ใช้ `backend/.env` ที่ชี้ `https://csmju2030.jowave.com`)

```powershell
pnpm dev:backend     # http://127.0.0.1:4227  (API docs: http://127.0.0.1:4227/api/docs)
pnpm dev:frontend    # http://localhost:3227  ← เปิดหน้านี้
```

เปิดจากเครื่องอื่นในวง LAN/VPN ได้โดยใส่ IP ใน `frontend/.env.local` → `ALLOWED_DEV_ORIGINS=26.155.53.96`

## ทดลองในเครื่องโดยยังไม่เชื่อมพอร์ทัลจริง (พอร์ทัลจำลอง)

ระหว่างที่พอร์ทัลของ PM ยังไม่พร้อม ใช้พอร์ทัลจำลองในเครื่องแทนได้ — ทำงานแบบเดียวกับ Core Hub (ออก token RS256 + JWKS + หน้า `/sso/authorize`)
โค้ดระบบทุนไม่ต้องแก้อะไร พอพอร์ทัลจริงพร้อม แค่ปิดพอร์ทัลจำลองแล้วชี้ `CORE_HUB_URL` / `CORE_HUB_WEB_URL` ไปที่ของจริง

เปิด 3 terminal ที่โฟลเดอร์โปรเจกต์:

```powershell
pnpm dev:portal     # พอร์ทัลจำลอง :3000 (API) + :3100 (เว็บ)
pnpm dev:backend    # :4227
pnpm dev:frontend   # :3227
```

เปิด http://localhost:3227 แล้วเข้าเมนูใดก็ได้ ระบบจะพาไปหน้าเลือก "บัญชีทดสอบ" (นักศึกษา 2 คน · เจ้าหน้าที่ · ผู้ดูแลระบบ) เลือกแล้วจะกลับมาที่ระบบทุนทันที
อยากเปลี่ยนบัญชี กด "ออกจากระบบ" ที่แถบซ้าย แล้วเข้าใหม่ — ตั้ง `backend/.env` เป็น `CORE_HUB_URL=http://localhost:3000` และ `CORE_HUB_WEB_URL=http://localhost:3100` (บรรทัดที่ comment ไว้ใน `.env.example`) แล้วเปิด backend ใหม่ ·
พอร์ทัลจำลองมีข้อมูลบุคคลสมมติให้ `/people/me` และ `/people/:personCode` ด้วย (ชื่อนักศึกษาที่เห็นจึงเป็นชื่อสมมติ)

> ห้ามใช้พอร์ทัลจำลองบน server จริง — ไม่มีรหัสผ่าน ใครก็เลือกบัญชีได้

## ข้อมูลบุคคล (standards 1.7.0)

ระบบนี้**ไม่เก็บชื่อ อีเมล คณะ สาขา** และไม่มีตารางนักศึกษาของตัวเอง — เก็บแค่ `core_user_id` (claim `sub` · text) กับ `person_code`
(รหัสนักศึกษาจาก `GET /people/me` ของพอร์ทัลตอนยื่นคำร้อง) · ชื่อดึงจากพอร์ทัลตอนแสดงผลด้วย token ของผู้ดู ไม่ cache:
นักศึกษาเห็นของตัวเองจาก `/people/me` · เจ้าหน้าที่เห็นในหน้ารายละเอียดคำร้องจาก `/people/:personCode` · ตารางรายการและไฟล์ CSV แสดงรหัสนักศึกษา
(ห้ามเรียกพอร์ทัลทีละแถว) · ข้อมูลที่ผู้ยื่นกรอกเอง (เบอร์ติดต่อ GPA อายุ เลขบัตร) เก็บกับคำร้องนั้น

## ใครทำอะไรได้

| core role (Core Hub) | ในระบบนี้ | ทำได้ |
|---|---|---|
| `student` | STUDENT | ดูทุน · ยื่นคำร้อง · แนบไฟล์ · ดูคำร้องของตัวเอง |
| `staff` | STAFF | + ดู/พิจารณาคำร้องทั้งหมด · สร้าง/แก้ไข/ปิดประกาศทุน · ดูสถิติ |
| `admin` | ADMIN | + ลบประกาศทุนที่ยังไม่มีใบสมัคร |
| `alumni` | — | เข้าระบบนี้ไม่ได้ (403) |

เมทริกซ์ทั้งหมดอยู่ที่ `backend/src/auth/permissions.ts`

## API หลัก (`/api/v1`, ต้องมี token ทุกเส้น)

| Method | Path | สิทธิ์ |
|---|---|---|
| GET | `/api/health` | public |
| GET | `/me` | ทุก role ที่เข้าได้ |
| GET | `/request-statuses` · `/urgency-levels` · `/scholarship-types` · `/issue-types` · `/family-statuses` · `/payout-methods` | `reference:read` |
| GET · POST | `/scholarships` | read · `scholarship:create` |
| GET · PATCH · DELETE | `/scholarships/:id` | read · update · delete |
| GET · POST | `/requests` | own/any · `request:create:own` |
| GET · PATCH | `/requests/:id` | own/any · `request:update:any` |
| GET · POST | `/requests/:id/attachments` | own/any · `attachment:create:own` |
| GET | `/attachments/:id` | own/any (ส่งไฟล์) |
| GET | `/request-statistics` | `statistics:read` |

รูปแบบคำตอบ `{ success, data[, meta] }` · error `{ success: false, error: { code, message, details } }`
เงินทุกช่องเป็น **สตางค์** (`amountRequestedSatang: 500000` = 5,000 บาท) · id เป็น UUID v4

## ตรวจก่อนเปิด PR

```bash
git submodule update --init standards/
pnpm -r typecheck && pnpm -r lint && pnpm --filter backend test && pnpm -r build
./standards/scripts/run-all-checks.sh .     # static — เหมือน CI
node standards/conformance/run.js           # runtime — ต้องรัน Core Hub + ระบบนี้อยู่
```

แก้ endpoint แล้วต้องรัน `pnpm --filter backend generate:openapi` และ `pnpm --filter frontend generate:api-types` แล้ว commit ทั้งสองไฟล์
