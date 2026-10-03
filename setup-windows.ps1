# ติดตั้งระบบ csmju-scholarship บน Windows (ขั้นที่ 1-4 ใน README)
# วิธีใช้: วางไฟล์นี้ในโฟลเดอร์ mis-scholarship แล้วคลิกขวา > Run with PowerShell
#          หรือเปิด PowerShell ในโฟลเดอร์นั้นแล้วพิมพ์  powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { Read-Host "$what ไม่สำเร็จ (ดูข้อความด้านบน) กด Enter เพื่อปิด"; exit 1 } }

# ---------- 1) ลบของเก่าที่เหลือ (ของเดิมสำรองไว้ใน _legacy_backup แล้ว)
Step 'ลบ .next / database เดิม (ถ้ายังเหลือ)'
foreach ($dir in '.next', 'database') {
  if (Test-Path $dir) { Remove-Item $dir -Recurse -Force; Write-Host "  ลบ $dir แล้ว" }
}

# ---------- 2) pnpm
Step 'ตรวจ pnpm'
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  try { corepack enable pnpm } catch { }
  if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host '  corepack ต้องใช้สิทธิ์ Administrator — ติดตั้งผ่าน npm แทน'
    npm install -g pnpm@12.3.4; Check 'ติดตั้ง pnpm'
  }
}
Write-Host "  pnpm $(pnpm -v)"

# ---------- 3) ฐานข้อมูล PostgreSQL
Step 'สร้างฐานข้อมูล scholarship_db'
$psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | Select-Object -First 1
if (-not $psql) { throw 'ไม่พบ psql.exe ใน C:\Program Files\PostgreSQL — ติดตั้ง PostgreSQL 16+ ก่อน' }
$pgUser = Read-Host '  ชื่อผู้ใช้ PostgreSQL (Enter = postgres)'
if (-not $pgUser) { $pgUser = 'postgres' }
$secure = Read-Host "  รหัสผ่านของ $pgUser" -AsSecureString
$pgPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
$env:PGPASSWORD = $pgPass
$exists = & $psql.FullName -U $pgUser -h localhost -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'scholarship_db'"
if ($LASTEXITCODE -ne 0) { throw 'เชื่อมต่อ PostgreSQL ไม่ได้ — ตรวจชื่อผู้ใช้/รหัสผ่าน และว่า service PostgreSQL เปิดอยู่' }
if ($exists -ne '1') {
  & $psql.FullName -U $pgUser -h localhost -d postgres -c 'CREATE DATABASE scholarship_db;'; Check 'CREATE DATABASE'
  Write-Host '  สร้าง scholarship_db แล้ว'
} else { Write-Host '  มี scholarship_db อยู่แล้ว' }
Remove-Item Env:PGPASSWORD

# ใส่ DATABASE_URL ใน backend\.env (เขียนแบบ UTF-8 ไม่มี BOM)
if (-not (Test-Path 'backend\.env')) { Copy-Item 'backend\.env.example' 'backend\.env' }
$url = "postgresql://$([uri]::EscapeDataString($pgUser)):$([uri]::EscapeDataString($pgPass))@localhost:5432/scholarship_db?schema=public"
$envPath = (Resolve-Path 'backend\.env').Path
$lines = [IO.File]::ReadAllLines($envPath) | ForEach-Object { if ($_ -match '^DATABASE_URL=') { "DATABASE_URL=$url" } else { $_ } }
[IO.File]::WriteAllLines($envPath, $lines, (New-Object Text.UTF8Encoding $false))
Write-Host '  บันทึก DATABASE_URL ใน backend\.env แล้ว'

# ---------- 4) ติดตั้ง + สร้างตาราง + ข้อมูลอ้างอิง
Step 'pnpm install'
pnpm install; Check 'pnpm install'
Step 'สร้างตาราง (prisma migrate deploy)'
pnpm --filter backend db:migrate; Check 'migrate'
Step 'ใส่ข้อมูลอ้างอิง (ไม่มีข้อมูลจำลอง)'
pnpm --filter backend db:seed; Check 'seed'

Write-Host "`nเสร็จขั้นที่ 1-4 แล้ว" -ForegroundColor Green
Write-Host 'ขั้นต่อไป: ลงทะเบียนที่ https://csmju2030.jowave.com (README ข้อ 5) หรือทดสอบในเครื่องด้วย pnpm dev:portal'
Write-Host 'จากนั้นเปิด 2 หน้าต่าง:  pnpm dev:backend   และ   pnpm dev:frontend   แล้วเข้า http://localhost:3227'
Read-Host 'กด Enter เพื่อปิดหน้าต่าง'
