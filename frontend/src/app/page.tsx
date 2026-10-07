'use client';

import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LayoutGrid,
  Star,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { AppShell, type ReadySession } from '@/components/app-shell';
import { StatusStepper } from '@/components/request-timeline';
import { displayName } from '@/components/student-fields';
import { applyHref, deadlineTone, FavoriteButton } from '@/components/scholarship-card';
import { ButtonLink, Card, CardHeader, cx, EmptyState, linkClass, SectionTitle, Skeleton, StatCard, StatusBadge } from '@/components/ui';
import { api, fetchAll, type RequestStatistics, type Scholarship } from '@/lib/api';
import { CORE_ROLE_LABEL, daysLeftLabel, formatMoney, formatNumber } from '@/lib/format';
import { useFavorites, useSeenUpdates } from '@/lib/local-state';
import { usePortal } from '@/lib/portal';
import { useAsync } from '@/lib/use-async';
import { useMyRequests } from '@/lib/use-my-requests';

type IconType = typeof GraduationCap;
interface Service {
  href: string;
  title: string;
  description: string;
  icon: IconType;
  external?: boolean;
}

const SERVICES: Service[] = [
  { href: '/welfare/dashboard', title: 'สมัครทุนการศึกษา', description: 'ดูทุนที่เปิดรับ บันทึกทุนที่สนใจ และยื่นใบสมัครทีละขั้น', icon: GraduationCap },
  { href: '/scholarship/check', title: 'ตรวจสอบสิทธิ์ทุน', description: 'กรอกเกรดเฉลี่ยเพื่อดูว่าทุนใดที่คุณมีคุณสมบัติสมัครได้', icon: ClipboardCheck },
  { href: '/welfare/form', title: 'ขอความช่วยเหลือฉุกเฉิน', description: 'ค่าครองชีพ ค่ารักษาพยาบาล อุปกรณ์การเรียน หรือวิกฤตครอบครัว', icon: HeartHandshake },
  { href: '/scholarship/track', title: 'ติดตามคำร้อง', description: 'ดูไทม์ไลน์สถานะ แก้ไข/ยกเลิกคำร้อง และพิมพ์ใบยืนยัน', icon: ClipboardList },
  { href: '/loan-volunteer', title: 'กยศ. และจิตอาสา', description: 'ขั้นตอนกู้ยืม เอกสาร และเครื่องคำนวณชั่วโมงจิตอาสา', icon: BookOpenCheck },
  { href: 'https://erp.mju.ac.th', title: 'ระบบสารสนเทศ (ERP)', description: 'ตรวจสอบชั่วโมงกิจกรรมและข้อมูลนักศึกษาของมหาวิทยาลัย', icon: ExternalLink, external: true },
];

export default function HomePage() {
  return (
    <AppShell requireLogin={false}>
      {(session) =>
        !session.signedIn ? (
          <GuestHome />
        ) : session.me.permissions.includes('request:read:own') ? (
          <SignedInHome session={session} />
        ) : (
          <StaffHome session={session} />
        )
      }
    </AppShell>
  );
}

// ------------------------------------------------------------------ ยังไม่เข้าสู่ระบบ

function GuestHome() {
  const { portal } = usePortal();
  return (
    <div className="space-y-10">
      <section className="brand-gradient fade-slide-up relative overflow-hidden rounded-2xl p-8 text-white md:p-12">
        <Decoration />
        <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-label-sm">สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
        <h1 className="max-w-3xl font-display text-[28px] font-extrabold leading-tight md:text-display-lg">ระบบทุนการศึกษาและสวัสดิการนักศึกษา</h1>
        <p className="mt-4 max-w-2xl text-body-lg text-white/80">
          สมัครทุน ขอความช่วยเหลือฉุกเฉิน และติดตามสถานะคำร้องแบบเรียลไทม์ได้ในที่เดียว เข้าใช้งานด้วยบัญชีเดียวกับทุกระบบในพอร์ทัล CSMJU2030
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {portal?.url && portal.reachable ? (
            <a href={portal.url} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-label-md text-primary-container shadow-md transition hover:bg-white/90">
              <LayoutGrid className="h-4 w-4" aria-hidden="true" /> เข้าใช้งานผ่านพอร์ทัล CSMJU2030
            </a>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-3 text-label-md text-white">
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              {portal ? 'พอร์ทัล CSMJU2030 ยังไม่พร้อมใช้งานในขณะนี้' : 'กำลังตรวจสอบพอร์ทัล...'}
            </span>
          )}
          <Link href="/loan-volunteer" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-label-md text-white transition hover:bg-white/10">
            ข้อมูล กยศ. และจิตอาสา <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3" aria-label="วิธีเข้าใช้งาน">
        {[
          ['1', 'เข้าสู่ระบบที่พอร์ทัล', 'ใช้บัญชี CSMJU ของสาขา ล็อกอินครั้งเดียวใช้ได้ทุกระบบ'],
          ['2', 'เลือก “ทุนการศึกษาและสวัสดิการ”', 'จากแถบระบบย่อยในพอร์ทัล ระบบจะพามาที่นี่อัตโนมัติ'],
          ['3', 'ยื่นและติดตามคำร้อง', 'ดูความคืบหน้าเป็นไทม์ไลน์ พร้อมแจ้งเตือนเมื่อสถานะเปลี่ยน'],
        ].map(([n, title, text], index) => (
          <Card key={n} className={cx('fade-slide-up p-6', `stagger-${index + 1}`)}>
            <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10 font-display text-headline-md text-primary-container">{n}</span>
            <h2 className="text-label-md text-on-surface">{title}</h2>
            <p className="mt-2 text-body-md text-on-surface-variant">{text}</p>
          </Card>
        ))}
      </section>

      <Services />
    </div>
  );
}

// ------------------------------------------------------------------ เข้าสู่ระบบแล้ว

function SignedInHome({ session }: { session: ReadySession }) {
  const { me } = session;
  const canManage = me.permissions.includes('request:read:any');
  const scholarships = useAsync(() => fetchAll<Scholarship>('/api/v1/scholarships'), []);
  const requests = useMyRequests(me);
  const favorites = useFavorites(me.id);
  const { isUnseen } = useSeenUpdates(me.id);

  const open = (scholarships.data ?? []).filter((item) => !item.isExpired);
  const closingSoon = open.filter((item) => item.isClosingSoon).sort((a, b) => a.daysLeft - b.daysLeft);
  const mine = requests.data ?? [];
  const active = mine.filter((item) => !item.isFinal);
  const approvedSatang = mine.filter((item) => item.statusCode === 'APPROVED').reduce((sum, item) => sum + (item.amountApprovedSatang ?? 0), 0);
  const savedOpen = open.filter((item) => favorites.has(item.id));
  const name = displayName(me);
  const featured = closingSoon.length ? closingSoon : savedOpen.length ? savedOpen : open;

  return (
    <div className="space-y-10">
      <section className="brand-gradient fade-slide-up relative overflow-hidden rounded-2xl p-8 text-white md:p-10">
        <Decoration />
        <p className="text-label-md text-white/70">ยินดีต้อนรับกลับ</p>
        <h1 className="mt-1 font-display text-[28px] font-extrabold leading-tight md:text-display-lg">สวัสดี {name}</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-white/80">
          {active.length > 0
            ? `คุณมีคำร้องที่กำลังดำเนินการ ${active.length} รายการ${closingSoon.length ? ` และมี ${closingSoon.length} ทุนที่ใกล้ปิดรับสมัคร` : ''}`
            : closingSoon.length
              ? `มี ${closingSoon.length} ทุนที่จะปิดรับสมัครภายใน 7 วัน อย่าพลาด!`
              : 'เลือกทุนที่เหมาะกับคุณ หรือยื่นคำร้องขอความช่วยเหลือได้ตลอดเวลา'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/welfare/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-label-md text-primary-container shadow-md transition hover:bg-white/90">
            <GraduationCap className="h-4 w-4" aria-hidden="true" /> ดูทุนที่เปิดรับ
          </Link>
          <Link href="/welfare/form" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-label-md text-white transition hover:bg-white/10">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" /> ขอความช่วยเหลือฉุกเฉิน
          </Link>
          {canManage && (
            <Link href="/scholarship/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-label-md text-white transition hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> แดชบอร์ดเจ้าหน้าที่
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="สรุปภาพรวม">
        <StatCard label="คำร้องที่กำลังดำเนินการ" value={requests.data ? formatNumber(active.length) : '–'} hint={`ทั้งหมด ${formatNumber(mine.length)} รายการ`} icon={ClipboardList} emphasis />
        <StatCard label="ยอดที่ได้รับอนุมัติ" value={requests.data ? formatMoney(approvedSatang).replace(' บาท', '') : '–'} hint="บาท (รวมทุกคำร้อง)" icon={Wallet} className="stagger-1" />
        <StatCard label="ทุนที่เปิดรับอยู่" value={scholarships.data ? formatNumber(open.length) : '–'} hint={closingSoon.length ? `ใกล้ปิดรับ ${closingSoon.length} ทุน` : 'ยังไม่มีทุนใกล้ปิด'} icon={GraduationCap} className="stagger-2" />
        <StatCard label="ทุนที่บันทึกไว้" value={formatNumber(savedOpen.length)} hint="กดดาวที่การ์ดทุนเพื่อบันทึก" icon={Star} className="stagger-3" />
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="คำร้องล่าสุดของฉัน" count={mine.length || undefined} actions={<Link href="/scholarship/track" className={linkClass}>ดูทั้งหมด</Link>} />
          {!requests.data ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : mine.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="ยังไม่มีคำร้อง"
                description="เมื่อยื่นใบสมัครทุนหรือคำร้องขอความช่วยเหลือ จะเห็นความคืบหน้าเป็นไทม์ไลน์ที่นี่"
                action={<ButtonLink href="/welfare/dashboard">เริ่มสมัครทุน</ButtonLink>}
              />
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {mine.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link href={`/scholarship/track?tn=${encodeURIComponent(item.trackingNo)}`} className="block space-y-4 px-6 py-5 transition-colors hover:bg-surface">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-label-md text-primary-container">
                          {item.trackingNo}
                          {isUnseen(item) && <span className="rounded-full bg-error px-2 py-0.5 text-caption text-white">อัปเดตใหม่</span>}
                        </p>
                        <p className="truncate text-body-md text-on-surface">{item.scholarshipTitle ?? item.issueLabel}</p>
                      </div>
                      <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>
                    </div>
                    <StatusStepper item={item} compact />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
                {closingSoon.length ? 'ทุนใกล้ปิดรับสมัคร' : savedOpen.length ? 'ทุนที่บันทึกไว้' : 'ทุนที่เปิดรับ'}
              </span>
            }
            actions={<Link href="/welfare/dashboard" className={linkClass}>ดูทุนทั้งหมด</Link>}
          />
          {!scholarships.data ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : featured.length === 0 ? (
            <p className="p-6 text-body-md text-on-surface-variant">ยังไม่มีทุนที่เปิดรับในขณะนี้</p>
          ) : (
            <ul className="divide-y divide-outline-variant/30">
              {featured.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <Link href={applyHref(item.id)} className="block truncate text-label-md text-on-surface hover:text-primary-container">
                      {item.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-body-md text-primary-container">{item.amountLabel}</span>
                      <StatusBadge tone={deadlineTone(item)}>{daysLeftLabel(item.daysLeft)}</StatusBadge>
                    </div>
                  </div>
                  <FavoriteButton active={favorites.has(item.id)} onToggle={() => favorites.toggle(item.id)} title={item.title} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Services />
    </div>
  );
}

// ------------------------------------------------------------------ เจ้าหน้าที่ (ไม่มีคำร้องของตัวเอง)

function StaffHome({ session }: { session: ReadySession }) {
  const { me } = session;
  const canStats = me.permissions.includes('statistics:read');
  const stats = useAsync(() => (canStats ? api.get<RequestStatistics>('/api/v1/request-statistics') : Promise.resolve(null)), [canStats]);
  const scholarships = useAsync(() => fetchAll<Scholarship>('/api/v1/scholarships'), []);
  const closing = (scholarships.data ?? []).filter((item) => item.isClosingSoon).sort((a, b) => a.daysLeft - b.daysLeft);
  const s = stats.data;
  return (
    <div className="space-y-10">
      <section className="brand-gradient fade-slide-up relative overflow-hidden rounded-2xl p-8 text-white md:p-10">
        <Decoration />
        <p className="text-label-md text-white/70">{CORE_ROLE_LABEL[me.coreRole] ?? 'เจ้าหน้าที่'}</p>
        <h1 className="mt-1 font-display text-[28px] font-extrabold leading-tight md:text-display-lg">สวัสดี {displayName(me)}</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-white/80">
          {s ? `มีคำร้องรอดำเนินการ ${formatNumber(s.awaitingActionCount)} รายการ${s.overdueCount ? ` (ค้างเกิน 7 วัน ${formatNumber(s.overdueCount)} รายการ)` : ''}` : 'ภาพรวมงานทุนการศึกษาและสวัสดิการของสาขา'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/scholarship/admin" className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-label-md text-primary-container shadow-md transition hover:bg-white/90">
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> ไปแดชบอร์ดเจ้าหน้าที่
          </Link>
          <Link href="/scholarship/admin?tab=WELFARE" className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-label-md text-white transition hover:bg-white/10">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" /> คำร้องขอความช่วยเหลือ
          </Link>
        </div>
      </section>
      {s && (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="สรุปภาพรวม">
          <StatCard label="รอดำเนินการ" value={formatNumber(s.awaitingActionCount)} icon={ClipboardList} emphasis />
          <StatCard label="ค้างเกิน 7 วัน" value={formatNumber(s.overdueCount)} icon={Clock} className="stagger-1" />
          <StatCard label="อัตราอนุมัติ" value={s.approvalRatePercent === null ? '–' : `${s.approvalRatePercent}%`} icon={Star} className="stagger-2" />
          <StatCard label="ทุนที่เปิดรับ" value={formatNumber(s.activeScholarshipCount)} icon={GraduationCap} className="stagger-3" />
        </section>
      )}
      <Card>
        <CardHeader title="ทุนใกล้ปิดรับสมัคร" count={closing.length || undefined} actions={<Link href="/scholarship/admin?tab=MANAGE" className={linkClass}>จัดการประกาศทุน</Link>} />
        {closing.length === 0 ? (
          <p className="p-6 text-body-md text-on-surface-variant">ไม่มีทุนที่จะปิดรับภายใน 7 วัน</p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {closing.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <p className="truncate text-label-md text-on-surface">{item.title}</p>
                  <p className="text-body-md text-on-surface-variant">ผู้สมัคร {formatNumber(item.applicationCount)} คน</p>
                </div>
                <StatusBadge tone={deadlineTone(item)}>{daysLeftLabel(item.daysLeft)}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ ส่วนร่วม

function Services() {
  return (
    <section className="space-y-6" aria-labelledby="services-title">
      <SectionTitle>
        <span id="services-title">บริการสำหรับนักศึกษา</span>
      </SectionTitle>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, index) => {
          const content = (
            <>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container/10 text-primary-container transition-colors group-hover:bg-primary-container group-hover:text-white">
                <service.icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3 className="text-label-md text-on-surface">{service.title}</h3>
              <p className="mt-2 flex-1 text-body-md text-on-surface-variant">{service.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-label-md text-primary-container">
                {service.external ? 'เปิดระบบ' : 'ไปที่บริการ'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </>
          );
          const className = cx(
            'group card-lift fade-slide-up flex flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm hover:border-primary-container',
            `stagger-${(index % 3) + 1}`,
          );
          return service.external ? (
            <a key={service.href} href={service.href} target="_blank" rel="noreferrer" className={className}>
              {content}
            </a>
          ) : (
            <Link key={service.href} href={service.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** วงกลมตกแต่งบนแบนเนอร์ (ตามแบบ hero ของพอร์ทัล) */
function Decoration() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
      <span className="absolute -bottom-24 right-24 h-72 w-72 rounded-full bg-white/5" />
      <span className="absolute right-10 top-10 hidden h-24 w-24 rounded-full border border-white/10 md:block" />
    </span>
  );
}
