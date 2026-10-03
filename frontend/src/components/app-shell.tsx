'use client';

import {
  Bell,
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, fetchAll, reSignIn, SESSION_EXPIRED_EVENT, type Me, type RequestStatistics, type RequestSummary } from '@/lib/api';
import { CORE_ROLE_LABEL, formatRelative } from '@/lib/format';
import { useSeenUpdates } from '@/lib/local-state';
import { usePortal, type Portal } from '@/lib/portal';
import { useSession, type SessionState } from '@/lib/use-session';
import { displayName } from './student-fields';
import { Alert, Button, ButtonLink, cx, ErrorState, ForbiddenState, Modal, PageHeader, SkeletonList, ToastProvider } from './ui';

export type ReadySession = Extract<SessionState, { status: 'ready' }> & { signedIn: boolean };

type IconType = React.ComponentType<{ className?: string; strokeWidth?: number }>;
interface NavItem {
  href: string;
  labelTh: string;
  label: string;
  Icon: IconType;
  badge?: 'unseen';
  /** ซ่อนเมนูเมื่อผู้ใช้ไม่มีสิทธิ์นี้ (ผู้ที่ยังไม่เข้าสู่ระบบเห็นทุกเมนู แล้วค่อยพาไปพอร์ทัล) */
  permission?: string;
}

const STUDENT_NAV: NavItem[] = [
  { href: '/', labelTh: 'หน้าหลัก', label: 'Home', Icon: Home },
  { href: '/welfare/dashboard', labelTh: 'ทุนการศึกษา', label: 'Scholarships', Icon: GraduationCap, permission: 'scholarship:read' },
  { href: '/scholarship/check', labelTh: 'ตรวจสอบสิทธิ์', label: 'Eligibility', Icon: ClipboardCheck, permission: 'scholarship:read' },
  { href: '/welfare/form', labelTh: 'ขอความช่วยเหลือ', label: 'Emergency', Icon: HeartHandshake, permission: 'request:create:own' },
  { href: '/scholarship/track', labelTh: 'คำร้องของฉัน', label: 'My requests', Icon: ClipboardList, badge: 'unseen', permission: 'request:read:own' },
  { href: '/loan-volunteer', labelTh: 'กยศ. และจิตอาสา', label: 'Loan', Icon: BookOpenCheck },
];

const STAFF_NAV: NavItem[] = [
  { href: '/scholarship/admin', labelTh: 'แดชบอร์ด', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/scholarship/admin?tab=WELFARE', labelTh: 'คำร้องช่วยเหลือ', label: 'Emergency', Icon: HeartHandshake },
  { href: '/scholarship/admin?tab=SCHOLARSHIP', labelTh: 'ใบสมัครทุน', label: 'Applications', Icon: FileText },
  { href: '/scholarship/admin?tab=MANAGE', labelTh: 'ประกาศทุน', label: 'Programs', Icon: Megaphone },
];

const ANONYMOUS_ME = {
  id: '',
  email: '',
  coreRole: 'student',
  subsystemRole: 'STUDENT',
  permissions: [],
  session: { expiresAt: '' },
  studentProfile: null,
} as unknown as Me;

/**
 * App Shell มาตรฐาน (ui-design-system.md ข้อ 6 · ตามแบบ BackofficeShell ของ csmju-core-hub)
 * — การเข้าสู่ระบบทำที่พอร์ทัล CSMJU2030 เท่านั้น: ระบบนี้ไม่มีหน้า/ปุ่ม login ของตัวเอง
 *   ถ้ายังไม่มี session และพอร์ทัลออนไลน์ จะขอ token จากพอร์ทัลแบบเงียบ (silent SSO) ให้เอง
 *   ถ้าพอร์ทัลออฟไลน์ จะแสดงทางเข้าผ่านพอร์ทัลแทน (ไม่ redirect ไปหน้าที่เปิดไม่ได้)
 */
export function AppShell({
  children,
  title,
  description,
  requireLogin = true,
  permission,
  guardUnsaved = false,
}: {
  children: (session: ReadySession) => ReactNode;
  title?: string;
  description?: string;
  requireLogin?: boolean;
  permission?: string;
  /** หน้าที่มีฟอร์มกรอกค้าง — session หมดอายุแล้วห้าม redirect ทับ (auth-contract ข้อ 7) ให้แสดงแถบต่ออายุแทน */
  guardUnsaved?: boolean;
}) {
  const { state, reload } = useSession();
  const [lastReady, setLastReady] = useState<Extract<SessionState, { status: 'ready' }> | null>(null);
  if (state.status === 'ready' && lastReady !== state) setLastReady(state);
  const keepForm = guardUnsaved && state.status === 'anonymous' && lastReady !== null;
  const { portal, recheck } = usePortal();
  const [navOpen, setNavOpen] = useState(false);

  // API ตอบ 401 ระหว่างใช้งาน → อ่าน session ใหม่ (จะกลายเป็น anonymous แล้วเข้าเงื่อนไขด้านล่าง)
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, reload);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, reload);
  }, [reload]);

  const me = state.status === 'ready' ? state.me : null;
  const canManage = Boolean(me?.permissions.includes('request:read:any'));
  const unseen = useUnseenRequests(me);

  return (
    <ToastProvider>
      <div className="flex min-h-dvh w-full bg-background text-on-surface">
        <a href="#main-content" className="skip-link">
          ข้ามไปเนื้อหาหลัก
        </a>
        <div
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
          className={cx(
            'no-print fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 md:hidden',
            navOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
        <aside
          className={cx(
            'no-print brand-gradient fixed left-0 top-0 z-30 flex h-dvh w-64 flex-col py-4 shadow-xl transition-transform duration-300 ease-out md:translate-x-0',
            navOpen ? 'translate-x-0' : '-translate-x-full',
          )}
          aria-label="เมนูระบบทุนการศึกษา"
        >
          <SidebarHead portal={portal} me={me} canManage={canManage} onNavigate={() => setNavOpen(false)} />
          <Suspense fallback={<nav className="mt-2 flex-1" />}>
            <SideNav me={me} unseenCount={unseen.length} canManage={canManage} onNavigate={() => setNavOpen(false)} />
          </Suspense>
          <SidebarFoot portal={portal} signedIn={Boolean(me)} />
        </aside>

        <div className="print-full ml-0 flex min-h-dvh min-w-0 flex-1 flex-col md:ml-64">
          <TopBar state={state} canManage={canManage} unseen={unseen} onMenu={() => setNavOpen(true)} portal={portal} />
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1280px] flex-1 space-y-8 p-4 outline-none md:p-12">
            {title && <PageHeader title={title} description={description} />}
            {keepForm && (
              <Alert tone="warning">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  เซสชันหมดอายุ ข้อมูลที่กรอกไว้ยังอยู่ —
                  <a href="/auth/login?next=/" target="_blank" rel="noopener" className="font-semibold underline">
                    ต่ออายุการเข้าสู่ระบบในแท็บใหม่
                  </a>
                  แล้วกลับมาที่หน้านี้
                  <button type="button" onClick={reload} className="font-semibold underline">
                    ตรวจสอบอีกครั้ง
                  </button>
                </span>
              </Alert>
            )}
            {/* ตำแหน่งเดิมใน tree เสมอ — ฟอร์มที่กรอกค้างจึงไม่ถูก unmount */}
            <Body
              state={keepForm && lastReady ? lastReady : state}
              reload={reload}
              portal={portal}
              recheck={recheck}
              requireLogin={requireLogin}
              permission={permission}
            >
              {children}
            </Body>
          </main>
          <Footer portal={portal} />
        </div>
      </div>
    </ToastProvider>
  );
}

// ------------------------------------------------------------------ Sidebar

function PortalLogo({ portal }: { portal: Portal | null }) {
  const [failed, setFailed] = useState(false);
  const src = portal?.url ? `${portal.url}/csmju-logo.png` : '';
  if (!src || failed || !portal?.reachable) {
    return (
      <span className="flex flex-col items-center gap-1 text-white">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 font-display text-headline-md font-extrabold tracking-wide backdrop-blur-sm">
          CS
        </span>
        <span className="text-caption text-white/70">CSMJU2030</span>
      </span>
    );
  }
  return (
    // โลโก้กลางโหลดจากพอร์ทัล (ใช้ไฟล์เดียวกับทุกระบบ) — ไม่ผ่าน next/image เพราะเป็นอีก origin
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="โลโก้ สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้"
      className="h-auto w-full max-w-[120px] object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function SidebarHead({ portal, me, canManage, onNavigate }: { portal: Portal | null; me: Me | null; canManage: boolean; onNavigate: () => void }) {
  const [choosing, setChoosing] = useState(false);
  const canCreateScholarship = Boolean(me?.permissions.includes('scholarship:create'));
  return (
    <div className="mb-2 px-4 pt-4">
      <div className="flex items-start justify-between gap-2">
        <Link href="/" onClick={onNavigate} aria-label="กลับหน้าแรกระบบทุน" className="flex w-full justify-center rounded-xl p-2 transition-opacity hover:opacity-80">
          <PortalLogo portal={portal} />
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="ปิดเมนู"
          className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mb-4 mt-1 text-center text-label-sm text-white/80">ทุนการศึกษาและสวัสดิการ</p>
      {canManage && canCreateScholarship ? (
        <Link
          href="/scholarship/admin?tab=MANAGE&new=1"
          onClick={onNavigate}
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-label-md text-white shadow-md"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> เพิ่มประกาศทุน
        </Link>
      ) : me && !me.permissions.includes('request:create:own') ? null : (
        <button
          type="button"
          onClick={() => setChoosing(true)}
          className="btn-gradient flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-label-md text-white shadow-md"
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> ยื่นคำร้องใหม่
        </button>
      )}
      {choosing && (
        <Modal title="ต้องการยื่นเรื่องใด" onClose={() => setChoosing(false)}>
          <div className="grid gap-3">
            <ChooserLink
              href="/welfare/dashboard"
              Icon={GraduationCap}
              title="สมัครทุนการศึกษา"
              description="เลือกทุนที่เปิดรับ แล้วกรอกใบสมัครทีละขั้น"
              onClick={() => {
                setChoosing(false);
                onNavigate();
              }}
            />
            <ChooserLink
              href="/welfare/form"
              Icon={HeartHandshake}
              title="ขอความช่วยเหลือฉุกเฉิน"
              description="ค่าครองชีพ ค่ารักษา อุปกรณ์การเรียน หรือวิกฤตครอบครัว"
              onClick={() => {
                setChoosing(false);
                onNavigate();
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

function ChooserLink({ href, Icon, title, description, onClick }: { href: string; Icon: IconType; title: string; description: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-start gap-4 rounded-xl border border-outline-variant/60 p-4 transition-colors hover:border-primary-container hover:bg-primary-container/5"
    >
      <span className="rounded-lg bg-primary-container/10 p-2.5 text-primary-container">
        <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-label-md text-on-surface group-hover:text-primary-container">{title}</span>
        <span className="mt-1 block text-body-md text-on-surface-variant">{description}</span>
      </span>
    </Link>
  );
}

function isActive(href: string, pathname: string, tab: string | null) {
  const [path, query] = href.split('?');
  if (path === '/') return pathname === '/';
  if (path === '/scholarship/admin') {
    if (pathname !== path) return false;
    const target = new URLSearchParams(query ?? '').get('tab');
    return (target ?? 'OVERVIEW') === (tab ?? 'OVERVIEW');
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function SideNav({ me, unseenCount, canManage, onNavigate }: { me: Me | null; unseenCount: number; canManage: boolean; onNavigate: () => void }) {
  const pathname = usePathname();
  const tab = useSearchParams().get('tab');
  const allowed = (item: NavItem) => !me || !item.permission || me.permissions.includes(item.permission);
  const groups: Array<{ id: string; label?: string; items: NavItem[] }> = [{ id: 'student', items: STUDENT_NAV.filter(allowed) }];
  if (canManage) groups.push({ id: 'staff', label: 'เจ้าหน้าที่', items: STAFF_NAV });

  return (
    <nav className="mt-2 flex-1 overflow-y-auto" aria-label="เมนูหลัก">
      {groups.map((group) => (
        <div key={group.id} className="mb-2">
          {group.label && <p className="mb-1 mt-4 px-7 text-caption uppercase tracking-wider text-white/45">{group.label}</p>}
          <ul className="space-y-1">
            {group.items.map(({ href, label, labelTh, Icon, badge }) => {
              const active = isActive(href, pathname, tab);
              const count = badge === 'unseen' ? unseenCount : 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'flex items-center gap-3 py-2.5 pr-4 duration-200',
                      active ? 'border-l-4 border-accent bg-white/10 pl-6 text-white' : 'pl-7 text-white/70 transition-all hover:bg-white/5 hover:text-white',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="text-label-md">{labelTh}</span>
                    <span className="truncate text-caption text-white/50">{label}</span>
                    {count > 0 && (
                      <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-label-sm text-white" aria-label={`อัปเดตใหม่ ${count} รายการ`}>
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

const sidebarButton =
  'mx-4 mt-2 flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 py-2.5 text-label-md text-white backdrop-blur-sm transition-colors hover:bg-white/20';

function SidebarFoot({ portal, signedIn }: { portal: Portal | null; signedIn: boolean }) {
  return (
    <div className="mt-4">
      {portal?.url && (
        <a href={portal.url} className={sidebarButton}>
          <LayoutGrid className="h-4 w-4" aria-hidden="true" /> กลับพอร์ทัล CSMJU2030
        </a>
      )}
      {signedIn && (
        // ออกจากระบบ = ออกทั้งแพลตฟอร์ม (backend ล้างคุกกี้แล้วส่งต่อไป /logout ของพอร์ทัล — auth-contract ข้อ 7)
        <form method="post" action="/auth/logout">
          <button type="submit" className={cx(sidebarButton, 'w-[calc(100%-2rem)]')}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> ออกจากระบบ
          </button>
        </form>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Top bar

function TopBar({
  state,
  canManage,
  unseen,
  onMenu,
  portal,
}: {
  state: SessionState;
  canManage: boolean;
  unseen: RequestSummary[];
  onMenu: () => void;
  portal: Portal | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const placeholder = canManage ? 'ค้นหาคำร้อง: รหัสนักศึกษา รหัสติดตาม ชื่อทุน...' : 'ค้นหาทุนการศึกษา...';
  return (
    <header className="no-print sticky top-0 z-10 flex h-16 w-full items-center justify-between gap-4 border-b border-surface-variant bg-surface-container-lowest px-4 shadow-sm md:px-12">
      <div className="flex items-center gap-2 md:hidden">
        <button type="button" onClick={onMenu} aria-label="เปิดเมนู" className="rounded-lg p-2 text-on-surface transition-colors hover:bg-surface-variant/50">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <span className="text-gradient font-display text-headline-md">CSMJU ทุน</span>
      </div>

      <form
        role="search"
        className="relative mx-auto hidden max-w-md flex-1 items-center md:flex"
        onSubmit={(event) => {
          event.preventDefault();
          const term = q.trim();
          const params = new URLSearchParams(term ? { q: term } : {});
          if (canManage) {
            params.set('tab', 'SCHOLARSHIP');
            router.push(`/scholarship/admin?${params}`);
          } else router.push(`/welfare/dashboard${term ? `?${params}` : ''}`);
        }}
      >
        <Search className="pointer-events-none absolute left-3 h-5 w-5 text-outline" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-full border border-outline-variant/50 bg-surface py-2.5 pl-10 pr-4 text-body-md transition-colors focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
        />
      </form>

      <div className="flex items-center gap-2 text-on-surface-variant">
        {state.status === 'ready' && <Notifications me={state.me} canManage={canManage} unseen={unseen} />}
        <UserChip state={state} portal={portal} />
      </div>
    </header>
  );
}

function initials(me: Me) {
  const name = displayName(me);
  return (name || '?').trim().charAt(0).toUpperCase();
}

function UserChip({ state, portal }: { state: SessionState; portal: Portal | null }) {
  if (state.status === 'loading') return <span className="h-9 w-32 animate-pulse rounded-full bg-surface-container" />;
  if (state.status !== 'ready') {
    return portal?.url ? (
      <a
        href={portal.url}
        className="flex items-center gap-2 rounded-full border border-outline-variant/60 px-3 py-1.5 text-label-md text-primary-container transition-colors hover:bg-primary-container/10"
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" /> เข้าผ่านพอร์ทัล
      </a>
    ) : null;
  }
  const { me } = state;
  const handle = displayName(me);
  return (
    <div title={me.email} className="flex items-center gap-2 rounded-full p-1">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant/50 bg-primary-container text-label-md text-white shadow-sm" aria-hidden="true">
        {initials(me)}
      </span>
      <span className="hidden flex-col leading-tight md:flex">
        <span className="max-w-48 truncate text-label-md text-on-surface">{handle}</span>
        <span className="text-caption text-on-surface-variant">{CORE_ROLE_LABEL[me.coreRole] ?? me.coreRole}</span>
      </span>
    </div>
  );
}

/** คำร้องของตัวเองที่มีความเคลื่อนไหวหลังจากเปิดดูครั้งล่าสุด */
function useUnseenRequests(me: Me | null) {
  const { isUnseen, initialized, markSeen } = useSeenUpdates(me?.id ?? '');
  const [items, setItems] = useState<RequestSummary[]>([]);
  const canRead = Boolean(me?.permissions.includes('request:read:own'));
  useEffect(() => {
    if (!me || !canRead) return;
    let cancelled = false;
    fetchAll<RequestSummary>('/api/v1/requests')
      .then((list) => {
        if (cancelled) return;
        const mine = list.filter((item) => item.coreUserId === me.id);
        setItems(mine);
        if (!initialized) markSeen(mine);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // โหลดครั้งเดียวต่อผู้ใช้ต่อหน้า
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id, canRead]);
  return items.filter(isUnseen);
}

function Notifications({ me, canManage, unseen }: { me: Me; canManage: boolean; unseen: RequestSummary[] }) {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<RequestStatistics | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canManage || !me.permissions.includes('statistics:read')) return;
    api.get<RequestStatistics>('/api/v1/request-statistics').then(setStats, () => undefined);
  }, [canManage, me.permissions]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => !box.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const staffItems = stats
    ? [
        stats.overdueCount > 0 && { key: 'overdue', text: `คำร้องรออาจารย์ที่ปรึกษาเกิน 7 วัน ${stats.overdueCount} รายการ`, href: '/scholarship/admin?tab=WELFARE', tone: 'error' },
        stats.awaitingActionCount > 0 && { key: 'awaiting', text: `คำร้องที่ยังไม่สิ้นสุด ${stats.awaitingActionCount} รายการ`, href: '/scholarship/admin', tone: 'info' },
      ].filter(Boolean)
    : [];
  const total = unseen.length + staffItems.length;

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        aria-label={total ? `การแจ้งเตือน ${total} รายการ` : 'การแจ้งเตือน'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 transition-colors hover:bg-surface-variant/50 hover:text-primary-container active:opacity-80"
      >
        <Bell className="h-6 w-6" aria-hidden="true" />
        {total > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-error" />}
      </button>
      {open && (
        <div className="fade-slide-up absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xl">
          <p className="border-b border-outline-variant/40 px-4 py-3 text-label-md text-on-surface">การแจ้งเตือน</p>
          {total === 0 ? (
            <p className="px-4 py-6 text-center text-body-md text-on-surface-variant">ไม่มีการแจ้งเตือนใหม่</p>
          ) : (
            <ul className="max-h-80 divide-y divide-outline-variant/30 overflow-y-auto">
              {unseen.map((item) => (
                <li key={item.id}>
                  <Link href={`/scholarship/track?tn=${encodeURIComponent(item.trackingNo)}`} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-surface">
                    <span className="block text-label-md text-primary-container">{item.trackingNo}</span>
                    <span className="block text-body-md text-on-surface">สถานะ: {item.statusLabel}</span>
                    <span className="text-caption text-secondary">{formatRelative(item.updatedAt)}</span>
                  </Link>
                </li>
              ))}
              {staffItems.map((item) =>
                item ? (
                  <li key={item.key}>
                    <Link href={item.href} onClick={() => setOpen(false)} className="flex items-start gap-2 px-4 py-3 text-body-md text-on-surface hover:bg-surface">
                      <span className={cx('mt-2 h-2 w-2 shrink-0 rounded-full', item.tone === 'error' ? 'bg-error' : 'bg-primary-container')} aria-hidden="true" />
                      {item.text}
                    </Link>
                  </li>
                ) : null,
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Footer

function Footer({ portal }: { portal: Portal | null }) {
  return (
    <footer className="no-print mt-auto w-full border-t border-outline-variant/30 bg-surface-container-low py-8">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-6 px-4 md:grid-cols-2 md:px-12">
        <div>
          <p className="text-body-md text-on-surface-variant">© 2026 Computer Science, Maejo University</p>
          <p className="text-caption text-secondary">ระบบทุนการศึกษาและสวัสดิการ · ระบบย่อยของแพลตฟอร์ม CSMJU2030</p>
        </div>
        <div className="flex flex-wrap gap-6 md:justify-end">
          {portal?.url && (
            <a href={portal.url} className="text-label-sm text-on-surface-variant transition-colors hover:text-primary-container hover:underline">
              พอร์ทัล CSMJU2030
            </a>
          )}
          <Link href="/loan-volunteer" className="text-label-sm text-on-surface-variant transition-colors hover:text-primary-container hover:underline">
            กยศ. และจิตอาสา
          </Link>
          <a href="https://www.mju.ac.th" target="_blank" rel="noreferrer" className="text-label-sm text-on-surface-variant transition-colors hover:text-primary-container hover:underline">
            มหาวิทยาลัยแม่โจ้
          </a>
        </div>
      </div>
    </footer>
  );
}

// ------------------------------------------------------------------ Body (สถานะ session)

function Body({
  state,
  reload,
  portal,
  recheck,
  requireLogin,
  permission,
  children,
}: {
  state: SessionState;
  reload: () => void;
  portal: Portal | null;
  recheck: () => void;
  requireLogin: boolean;
  permission?: string;
  children: (session: ReadySession) => ReactNode;
}) {
  if (state.status === 'loading') return <SkeletonList rows={2} />;
  if (state.status === 'forbidden') return <ForbiddenState message={state.message} />;
  if (state.status === 'error') {
    return <ErrorState message="เชื่อมต่อระบบหลังบ้านไม่ได้ในขณะนี้ กรุณาลองอีกครั้งในอีกสักครู่" onRetry={reload} />;
  }
  if (state.status === 'anonymous') {
    if (!requireLogin) return <>{children({ status: 'ready', me: ANONYMOUS_ME, signedIn: false })}</>;
    return <PortalGate portal={portal} recheck={recheck} />;
  }
  if (permission && !state.me.permissions.includes(permission)) return <ForbiddenState />;
  return <>{children({ ...state, signedIn: true })}</>;
}

/**
 * ยังไม่มี session ของระบบนี้:
 *  - พอร์ทัลออนไลน์ → ขอ token จากพอร์ทัลแบบเงียบ (ผู้ใช้ที่ล็อกอินพอร์ทัลอยู่แล้วจะกลับมาทันที)
 *  - พอร์ทัลออฟไลน์ / เพิ่งลองไปแล้ว → แสดงทางเข้าผ่านพอร์ทัล
 */
export function PortalGate({ portal, recheck }: { portal: Portal | null; recheck: () => void }) {
  const [redirecting, setRedirecting] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!portal || tried) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- เริ่ม redirect ครั้งเดียวเมื่อรู้สถานะพอร์ทัล
    setTried(true);
    if (reSignIn(portal.reachable)) setRedirecting(true);
  }, [portal, tried]);

  if (!portal || redirecting) {
    return (
      <div className="fade-slide-up mx-auto flex max-w-lg flex-col items-center py-16 text-center" role="status">
        <span className="mb-4 flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
          <ShieldCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="text-label-md text-on-surface">กำลังยืนยันตัวตนกับพอร์ทัล CSMJU2030...</p>
        <p className="mt-1 text-body-md text-on-surface-variant">ระบบจะพากลับมาหน้านี้ให้อัตโนมัติ</p>
      </div>
    );
  }

  const steps = [
    'เข้าสู่ระบบที่พอร์ทัล CSMJU2030 ด้วยบัญชีของสาขา',
    'เลือกเมนู “ทุนการศึกษาและสวัสดิการ” ในแถบระบบย่อย',
    'ระบบจะพากลับมาที่นี่พร้อมบัญชีเดิม ไม่ต้องล็อกอินซ้ำ',
  ];

  return (
    <div className="fade-slide-up mx-auto max-w-2xl overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm">
      <div className="brand-gradient px-8 py-10 text-white">
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
          <LayoutGrid className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="font-display text-headline-lg">ระบบนี้เข้าใช้งานผ่านพอร์ทัล CSMJU2030</h2>
        <p className="mt-2 text-body-md text-white/80">
          การเข้าสู่ระบบของทุกระบบย่อยในสาขาทำที่พอร์ทัลกลางที่เดียว ระบบทุนการศึกษาไม่มีหน้าเข้าสู่ระบบแยก
        </p>
      </div>
      <div className="space-y-6 p-8">
        {!portal.reachable && (
          <Alert tone="warning">
            ขณะนี้เชื่อมต่อพอร์ทัล CSMJU2030 ไม่ได้ (ระบบกลางอาจยังไม่เปิดหรือกำลังปิดปรับปรุง) กรุณาลองใหม่อีกครั้งภายหลัง
          </Alert>
        )}
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-label-md text-primary-container">
                {index + 1}
              </span>
              <span className="pt-1 text-body-md text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          {portal.url && portal.reachable && (
            <ButtonLink href={portal.url}>
              <LayoutGrid className="h-4 w-4" aria-hidden="true" /> ไปที่พอร์ทัล CSMJU2030
            </ButtonLink>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              setTried(false);
              recheck();
            }}
          >
            ตรวจสอบอีกครั้ง
          </Button>
          <ButtonLink href="/loan-volunteer" variant="tonal">
            ดูข้อมูล กยศ. (ไม่ต้องเข้าสู่ระบบ)
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
