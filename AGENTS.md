# AGENTS.md

ระบบนี้เป็นระบบย่อยของแพลตฟอร์ม CSMJU2030 — AI agent ทุกตัวต้องอ่านและทำตาม
`standards/ai/AGENTS.md` (git submodule ของ `csmju2030-standards`) ก่อนแก้โค้ด

สรุปสั้น ๆ ของกฎที่มักพลาดในโปรเจกต์นี้

- stack บังคับ: Node 22 · pnpm 12.3.4 · NestJS 11 (`backend/`) · Prisma 7.9.1 + PostgreSQL (`scholarship_db`) · Next.js App Router (`frontend/`)
- frontend ห้ามต่อฐานข้อมูลเอง ห้ามมีหน้า login/ฟอร์มรหัสผ่าน — ทุกอย่างผ่าน backend และ Core Hub SSO
- ตัวตนผู้ใช้คือ `core_user_id` (= `token.sub`) เท่านั้น · เงินเป็นจำนวนเต็มหน่วยสตางค์ · id เป็น UUID v4
- แก้ endpoint แล้วต้องรัน `pnpm --filter backend generate:openapi` และ `pnpm --filter frontend generate:api-types`
- ห้ามแก้ไฟล์ใน `standards/` และ `.github/workflows/`
