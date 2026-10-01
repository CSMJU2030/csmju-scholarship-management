'use client';

import {
  AlarmClock,
  CheckCircle2,
  Download,
  FileText,
  Hourglass,
  Megaphone,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { GroupedColumnChart, HorizontalBars, RatioRing } from '@/components/charts';
import { HistoryList, StatusStepper } from '@/components/request-timeline';
import { digitsOnly } from '@/components/student-fields';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  Checkbox,
  ConfirmDialog,
  cx,
  DescriptionList,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  ForbiddenState,
  PageHeader,
  Pagination,
  ProgressBar,
  Select,
  SkeletonList,
  StatCard,
  StatusBadge,
  Tabs,
  Tag,
  TextArea,
  TextInput,
  useToast,
} from '@/components/ui';
import {
  api,
  errorMessage,
  fetchAll,
  type Me,
  type Page,
  type RequestDetail,
  type RequestStatistics,
  type RequestSummary,
  type Scholarship,
} from '@/lib/api';
import { downloadCsv } from '@/lib/csv';
import { bahtInputToSatang, daysLeftLabel, formatDate, formatDateTime, formatMoney, formatNumber, formatPhone, formatRelative } from '@/lib/format';
import { useLookups } from '@/lib/lookups';
import { useAsync } from '@/lib/use-async';

type Tab = 'OVERVIEW' | 'WELFARE' | 'SCHOLARSHIP' | 'MANAGE';
const TABS: Tab[] = ['OVERVIEW', 'WELFARE', 'SCHOLARSHIP', 'MANAGE'];
const OVERDUE_DAYS = 7;

export default function AdminPage() {
  return (
    <AppShell permission="request:read:any">
      {({ me }) => (
        <Suspense fallback={<SkeletonList rows={3} />}>
          <Admin me={me} />
        </Suspense>
      )}
    </AppShell>
  );
}

function Admin({ me }: { me: Me }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get('tab') as Tab | null;
  const tab: Tab = raw && TABS.includes(raw) ? raw : 'OVERVIEW';
  const q = params.get('q') ?? '';
  const canStats = me.permissions.includes('statistics:read');
  const stats = useAsync<RequestStatistics | null>(() => (canStats ? api.get<RequestStatistics>('/api/v1/request-statistics') : Promise.resolve(null)), [canStats]);

  // แท็บอยู่ใน URL (?tab=) ให้เมนูด้านข้าง ปุ่มย้อนกลับ และลิงก์แชร์ตรงกัน
  const go = useCallback(
    (next: Tab) => router.replace(next === 'OVERVIEW' ? pathname : `${pathname}?tab=${next}`, { scroll: false }),
    [router, pathname],
  );
  const consumeNew = useCallback(() => go('MANAGE'), [go]);

  const count = (kind: 'WELFARE' | 'SCHOLARSHIP') => (stats.data ? (kind === 'WELFARE' ? stats.data.welfareRequestCount : stats.data.scholarshipRequestCount) : undefined);

  return (
    <div className="space-y-8">
      <PageHeader
        title="แดชบอร์ดเจ้าหน้าที่"
        description="ภาพรวมคำร้อง พิจารณาอนุมัติ และจัดการประกาศทุนของสาขา"
        actions={
          me.permissions.includes('scholarship:create') ? (
            <Button onClick={() => router.replace(`${pathname}?tab=MANAGE&new=1`, { scroll: false })}>
              <Plus className="h-4 w-4" aria-hidden="true" /> เพิ่มประกาศทุน
            </Button>
          ) : undefined
        }
      />
      <Tabs<Tab>
        active={tab}
        onChange={go}
        tabs={[
          { id: 'OVERVIEW', label: 'ภาพรวม' },
          { id: 'WELFARE', label: 'คำร้องขอความช่วยเหลือ', count: count('WELFARE') },
          { id: 'SCHOLARSHIP', label: 'ใบสมัครทุน', count: count('SCHOLARSHIP') },
          { id: 'MANAGE', label: 'ประกาศทุน', count: stats.data?.activeScholarshipCount },
        ]}
      />
      {tab === 'OVERVIEW' &&
        (!canStats ? (
          <ForbiddenState message="บัญชีของคุณยังไม่มีสิทธิ์ดูสถิติ" />
        ) : stats.error ? (
          <ErrorState message={errorMessage(stats.error)} onRetry={stats.reload} />
        ) : !stats.data ? (
          <SkeletonList rows={3} />
        ) : (
          <Overview stats={stats.data} onOpenTab={go} />
        ))}
      {(tab === 'WELFARE' || tab === 'SCHOLARSHIP') && <RequestTable key={`${tab}-${q}`} kind={tab} initialQuery={q} onChanged={stats.reload} />}
      {tab === 'MANAGE' && <ManageScholarships me={me} openNew={params.get('new') === '1'} onChanged={stats.reload} onConsumedNew={consumeNew} />}
    </div>
  );
}

// ------------------------------------------------------------------ ภาพรวม + กราฟ

function Overview({ stats, onOpenTab }: { stats: RequestStatistics; onOpenTab: (tab: Tab) => void }) {
  const total = stats.scholarshipRequestCount + stats.welfareRequestCount;
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="ตัวชี้วัดหลัก">
        <StatCard label="รอดำเนินการ" value={formatNumber(stats.awaitingActionCount)} hint={`จากคำร้องทั้งหมด ${formatNumber(total)} รายการ`} icon={Hourglass} emphasis />
        <StatCard
          label={`รออาจารย์เกิน ${OVERDUE_DAYS} วัน`}
          value={formatNumber(stats.overdueCount)}
          hint={stats.overdueCount ? 'ควรติดตามโดยเร็ว' : 'ไม่มีคำร้องค้างนาน'}
          icon={AlarmClock}
          className={cx('stagger-1', stats.overdueCount > 0 && 'border-error/40')}
        />
        <StatCard
          label="อัตราอนุมัติ"
          value={stats.approvalRatePercent === null ? '–' : `${stats.approvalRatePercent}%`}
          hint="อนุมัติ ÷ (อนุมัติ + ไม่ผ่าน)"
          icon={CheckCircle2}
          className="stagger-2"
        />
        <StatCard label="ยอดเงินที่อนุมัติ" value={formatMoney(stats.totalApprovedSatang).replace(' บาท', '')} hint={`บาท · ทุนเปิดรับ ${stats.activeScholarshipCount} ทุน`} icon={Wallet} className="stagger-3" />
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="คำร้องรายเดือน (6 เดือนล่าสุด)" />
          <div className="p-6">
            <GroupedColumnChart
              title="จำนวนคำร้องรายเดือน แยกใบสมัครทุนและคำร้องช่วยเหลือ"
              labels={stats.monthly.map((m) => m.label)}
              series={[
                { name: 'ใบสมัครทุน', values: stats.monthly.map((m) => m.scholarship) },
                { name: 'คำร้องช่วยเหลือ', values: stats.monthly.map((m) => m.welfare) },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="สถานะคำร้องทั้งหมด" count={total} />
          <div className="p-6">
            <HorizontalBars
              items={stats.byStatus.map((s) => ({ key: s.code, label: s.label, value: s.total, tone: s.tone }))}
              renderLabel={(item) => <StatusBadge tone={item.tone}>{item.label}</StatusBadge>}
              emptyText="ยังไม่มีคำร้อง"
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader title="ประเภทความเดือดร้อน" actions={<button type="button" onClick={() => onOpenTab('WELFARE')} className="text-label-md text-primary-container hover:underline">ดูคำร้อง</button>} />
          <div className="p-6">
            <HorizontalBars items={stats.byIssueType.map((s) => ({ key: s.code, label: s.label, value: s.total }))} color={1} emptyText="ยังไม่มีคำร้องขอความช่วยเหลือ" />
          </div>
        </Card>
        <Card>
          <CardHeader title="คำร้องที่ยังเปิดอยู่ ตามความเร่งด่วน" />
          <div className="space-y-3 p-6">
            {stats.openByUrgency.every((u) => u.total === 0) ? (
              <p className="rounded-lg bg-surface p-6 text-center text-body-md text-on-surface-variant">ไม่มีคำร้องช่วยเหลือที่ค้างอยู่</p>
            ) : (
              [...stats.openByUrgency].reverse().map((u) => (
                <div key={u.code} className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 px-4 py-3">
                  <StatusBadge tone={u.tone}>{u.label}</StatusBadge>
                  <span className="font-display text-headline-md tabular-nums text-on-surface">{formatNumber(u.total)}</span>
                </div>
              ))
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="ยอดเงิน: อนุมัติเทียบยอดที่ขอ" />
          <div className="flex items-center gap-6 p-6">
            <RatioRing value={stats.totalApprovedSatang} total={stats.totalRequestedSatang} label="ของยอดที่ขอ" />
            <dl className="space-y-3">
              <div>
                <dt className="text-label-sm text-on-surface-variant">ยอดที่ขอทั้งหมด</dt>
                <dd className="text-label-md text-on-surface">{formatMoney(stats.totalRequestedSatang)}</dd>
              </div>
              <div>
                <dt className="text-label-sm text-on-surface-variant">อนุมัติแล้ว</dt>
                <dd className="text-label-md text-chart-3">{formatMoney(stats.totalApprovedSatang)}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="ทุนที่มีผู้สมัครมากที่สุด" actions={<button type="button" onClick={() => onOpenTab('MANAGE')} className="text-label-md text-primary-container hover:underline">จัดการประกาศทุน</button>} />
        {stats.topScholarships.length === 0 ? (
          <p className="p-6 text-body-md text-on-surface-variant">ยังไม่มีใบสมัครทุน</p>
        ) : (
          <ul className="divide-y divide-outline-variant/30">
            {stats.topScholarships.map((item, index) => {
              const percent = item.quota > 0 ? Math.round((item.applicationCount / item.quota) * 100) : 0;
              return (
                <li key={item.id} className="grid grid-cols-1 items-center gap-3 px-6 py-4 md:grid-cols-[2rem_1fr_16rem]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/10 text-label-md text-primary-container">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-label-md text-on-surface">{item.title}</p>
                    <p className="text-body-md text-on-surface-variant">
                      ผู้สมัคร {formatNumber(item.applicationCount)} · อนุมัติ {formatNumber(item.approvedCount)}
                      {item.quota > 0 ? ` · โควตา ${formatNumber(item.quota)} ทุน` : ' · ไม่จำกัดจำนวน'}
                    </p>
                  </div>
                  {item.quota > 0 ? (
                    <div className="space-y-1">
                      <ProgressBar value={percent} label={`ผู้สมัครเทียบโควตา ${percent}%`} />
                      <p className="text-right text-caption text-secondary">{percent}% ของโควตา</p>
                    </div>
                  ) : (
                    <div className="md:justify-self-end">
                      <Tag>ไม่จำกัดจำนวน</Tag>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------ ตารางคำร้อง

function isOverdue(item: RequestSummary) {
  return item.statusCode === 'PENDING_ADVISOR' && Date.now() - new Date(item.createdAt).getTime() > OVERDUE_DAYS * 86_400_000;
}

function RequestTable({ kind, initialQuery, onChanged }: { kind: 'WELFARE' | 'SCHOLARSHIP'; initialQuery: string; onChanged: () => void }) {
  const toast = useToast();
  const { lookups } = useLookups(['request-statuses']);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery);
  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const filterParams = useMemo(() => {
    const params = new URLSearchParams({ kind });
    if (status) params.set('statusCode', status);
    if (search) params.set('q', search);
    return params;
  }, [kind, status, search]);
  const { data, error, reload } = useAsync<Page<RequestSummary>>(
    () => api.page<RequestSummary>(`/api/v1/requests?${filterParams}&page=${page}&limit=20`),
    [filterParams.toString(), page],
  );

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await fetchAll<RequestSummary>(`/api/v1/requests?${filterParams}`);
      // ไม่มีชื่อในไฟล์ — ระบบนี้ไม่เก็บชื่อ และห้ามเรียกพอร์ทัลทีละแถว (reference-data ข้อ 7.2) · ใช้รหัสนักศึกษาค้นชื่อในพอร์ทัล
      const header = ['รหัสติดตาม', 'วันที่ยื่น', 'รหัสนักศึกษา', 'เบอร์ติดต่อ', kind === 'WELFARE' ? 'ประเภท' : 'ทุน'];
      if (kind === 'WELFARE') header.push('ความเร่งด่วน');
      header.push('ยอดที่ขอ (บาท)', 'ยอดที่อนุมัติ (บาท)', 'สถานะ', 'ช่องทางรับเงิน', 'ไฟล์แนบ');
      downloadCsv(
        `${kind === 'WELFARE' ? 'welfare' : 'scholarship'}-requests-${new Date().toISOString().slice(0, 10)}.csv`,
        header,
        all.map((item) => [
          item.trackingNo,
          formatDateTime(item.createdAt),
          item.applicant.personCode ?? '',
          item.applicant.contactPhone,
          kind === 'WELFARE' ? item.issueLabel : item.scholarshipTitle,
          ...(kind === 'WELFARE' ? [item.urgencyLabel] : []),
          item.amountRequestedSatang / 100,
          item.amountApprovedSatang === null ? '' : item.amountApprovedSatang / 100,
          item.statusLabel,
          item.payoutLabel,
          item.attachmentCount,
        ]),
      );
      toast(`ส่งออก ${formatNumber(all.length)} รายการเรียบร้อย`);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  }

  const filtered = Boolean(search || status);

  return (
    <div className="space-y-6">
      <Card className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[1fr_240px_auto] md:p-6">
        <form
          className="relative"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(q.trim());
          }}
        >
          <label htmlFor="admin-search" className="sr-only">
            ค้นหาคำร้อง
          </label>
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-outline" aria-hidden="true" />
          <TextInput id="admin-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="รหัสนักศึกษา รหัสติดตาม หรือชื่อทุน แล้วกด Enter" className="pl-9" />
        </form>
        <Select
          aria-label="ตัวกรองสถานะ"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">ทุกสถานะ</option>
          {(lookups['request-statuses'] ?? []).map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={exportCsv} loading={exporting} disabled={!data || data.meta.total === 0} disabledReason="ไม่มีรายการให้ส่งออก">
          <Download className="h-4 w-4" aria-hidden="true" /> ส่งออก CSV
        </Button>
      </Card>

      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : !data ? (
        <SkeletonList rows={3} />
      ) : data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            title="ค้นหาแล้วไม่พบคำร้อง"
            description="ลองเปลี่ยนคำค้นหาหรือสถานะ"
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQ('');
                  setSearch('');
                  setStatus('');
                }}
              >
                ล้างตัวกรอง
              </Button>
            }
          />
        ) : (
          <EmptyState title="ยังไม่มีคำร้อง" description="เมื่อนักศึกษายื่นคำร้อง รายการจะแสดงที่นี่" />
        )
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-body-md">
              <thead className="bg-surface text-label-sm text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3 font-semibold">รหัสติดตาม</th>
                  <th className="px-6 py-3 font-semibold">รหัสนักศึกษา</th>
                  <th className="px-6 py-3 font-semibold">{kind === 'WELFARE' ? 'ประเภท / ความเร่งด่วน' : 'ทุน'}</th>
                  <th className="px-6 py-3 text-right font-semibold">จำนวนเงิน</th>
                  <th className="px-6 py-3 font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setOpenId(item.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpenId(item.id))}
                    tabIndex={0}
                    className="cursor-pointer border-t border-outline-variant/40 transition-colors hover:bg-primary-container/5 focus-visible:bg-primary-container/5"
                    aria-label={`เปิดคำร้อง ${item.trackingNo}`}
                  >
                    <td className="px-6 py-4">
                      <span className="text-label-md text-primary-container">{item.trackingNo}</span>
                      <div className="flex items-center gap-2 text-caption text-secondary">
                        {formatDate(item.createdAt)}
                        {item.attachmentCount > 0 && (
                          <span className="inline-flex items-center gap-0.5" title={`ไฟล์แนบ ${item.attachmentCount} ไฟล์`}>
                            <Paperclip className="h-3 w-3" aria-hidden="true" /> {item.attachmentCount}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="tabular-nums">{item.applicant.personCode ?? 'ไม่ผูกรหัส'}</span>
                      <div className="text-caption text-on-surface-variant">{formatPhone(item.applicant.contactPhone)}</div>
                    </td>
                    <td className="max-w-72 px-6 py-4">
                      {kind === 'WELFARE' ? (
                        <>
                          <span className="line-clamp-1">{item.issueLabel}</span>
                          {item.urgencyLabel && (
                            <div className="mt-1">
                              <StatusBadge tone={item.urgencyTone}>{item.urgencyLabel}</StatusBadge>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="line-clamp-2">{item.scholarshipTitle}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right tabular-nums">
                      {formatMoney(item.amountRequestedSatang)}
                      {item.amountApprovedSatang !== null && <div className="text-caption text-success">อนุมัติ {formatMoney(item.amountApprovedSatang)}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>
                      {isOverdue(item) && (
                        <div className="mt-1 inline-flex items-center gap-1 text-caption text-error">
                          <AlarmClock className="h-3 w-3" aria-hidden="true" /> ค้าง {formatRelative(item.createdAt).replace('ที่แล้ว', '')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
        </Card>
      )}

      {openId && (
        <ReviewDrawer
          id={openId}
          onClose={() => setOpenId(null)}
          onSaved={() => {
            reload();
            onChanged();
          }}
        />
      )}
    </div>
  );
}

/** ปุ่มลัดตามลำดับขั้นการพิจารณา */
const NEXT_STEP: Record<string, Array<{ code: string; label: string }>> = {
  PENDING_ADVISOR: [
    { code: 'UNDER_REVIEW', label: 'ส่งต่อคณะกรรมการ' },
    { code: 'REJECTED', label: 'ไม่อนุมัติ' },
  ],
  UNDER_REVIEW: [
    { code: 'PRE_APPROVED', label: 'อนุมัติขั้นต้น' },
    { code: 'REJECTED', label: 'ไม่อนุมัติ' },
  ],
  PRE_APPROVED: [
    { code: 'APPROVED', label: 'อนุมัติและเบิกจ่าย' },
    { code: 'REJECTED', label: 'ไม่อนุมัติ' },
  ],
};

/** สถานะที่ต้องระบุวงเงินอนุมัติ (ตรงกับ backend) */
const AMOUNT_STATUSES = ['PRE_APPROVED', 'APPROVED'];
const REJECT_REASONS = [
  'คุณสมบัติไม่ตรงตามเกณฑ์ของทุน',
  'เอกสารหลักฐานไม่ครบถ้วน',
  'งบประมาณของทุนในรอบนี้เต็มแล้ว',
  'ได้รับทุน/ความช่วยเหลืออื่นซ้ำซ้อน',
];

function ReviewDrawer({ id, onClose, onSaved }: { id: string; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const { lookups } = useLookups(['request-statuses']);
  const { data: detail, error, reload } = useAsync(() => api.get<RequestDetail>(`/api/v1/requests/${id}`), [id]);
  const [form, setForm] = useState<{ statusCode: string; note: string; approvedBaht: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ตั้งค่าฟอร์มจากข้อมูลล่าสุดครั้งแรกที่โหลดเสร็จ (ปรับ state ระหว่าง render)
  const [formFor, setFormFor] = useState<string | null>(null);
  if (detail && formFor !== `${detail.id}:${detail.updatedAt}`) {
    setFormFor(`${detail.id}:${detail.updatedAt}`);
    setForm({
      statusCode: detail.statusCode,
      note: detail.staffNote,
      approvedBaht: detail.amountApprovedSatang !== null ? String(detail.amountApprovedSatang / 100) : '',
    });
  }

  const needsAmount = Boolean(form && AMOUNT_STATUSES.includes(form.statusCode));
  const rejecting = Boolean(form && detail && form.statusCode === 'REJECTED' && detail.statusCode !== 'REJECTED');

  /** เปลี่ยนสถานะ — ถ้าเป็นสถานะอนุมัติและยังไม่ได้กรอกวงเงิน ให้เติมยอดที่ขอไว้ก่อน */
  function chooseStatus(statusCode: string) {
    if (!form || !detail) return;
    const approvedBaht = AMOUNT_STATUSES.includes(statusCode) && !form.approvedBaht ? String(Math.round(detail.amountRequestedSatang / 100)) : form.approvedBaht;
    setForm({ ...form, statusCode, approvedBaht });
    setSaveError('');
  }

  async function save() {
    if (!detail || !form) return;
    const amount = bahtInputToSatang(form.approvedBaht);
    if (needsAmount && amount < 100) return setSaveError('กรุณาระบุวงเงินที่อนุมัติ');
    if (needsAmount && amount > detail.amountRequestedSatang) return setSaveError(`วงเงินที่อนุมัติต้องไม่เกินยอดที่ขอ (${formatMoney(detail.amountRequestedSatang)})`);
    if (rejecting && form.note.trim().length < 5) return setSaveError('กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อแจ้งให้ผู้ยื่นทราบ');
    setSaving(true);
    setSaveError('');
    try {
      await api.patch<RequestDetail>(`/api/v1/requests/${id}`, {
        statusCode: form.statusCode,
        staffNote: form.note.trim(),
        ...(needsAmount ? { amountApprovedSatang: amount } : {}),
      });
      toast(form.statusCode === 'REJECTED' ? 'บันทึกผล "ไม่อนุมัติ" แล้ว' : 'บันทึกผลการพิจารณาเรียบร้อย');
      reload();
      onSaved();
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const statusLabel = (code: string) => lookups['request-statuses']?.find((s) => s.code === code)?.label ?? code;

  return (
    <Drawer
      title={detail ? `พิจารณาคำร้อง ${detail.trackingNo}` : 'รายละเอียดคำร้อง'}
      subtitle={detail ? `${detail.person?.fullNameTh ?? detail.applicant.personCode ?? 'ผู้ยื่น'} · ${detail.scholarshipTitle ?? detail.issueLabel}` : undefined}
      onClose={onClose}
      footer={
        detail && form ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              ปิด
            </Button>
            <Button variant={form.statusCode === 'REJECTED' ? 'danger' : 'primary'} onClick={save} loading={saving}>
              {form.statusCode === 'REJECTED' ? 'ยืนยันไม่อนุมัติ' : AMOUNT_STATUSES.includes(form.statusCode) ? 'บันทึกการอนุมัติ' : 'บันทึกผลการพิจารณา'}
            </Button>
          </>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : !detail || !form ? (
        <SkeletonList rows={2} />
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl bg-surface p-5">
            <StatusStepper item={detail} history={detail.history} />
          </div>

          <Card className="space-y-4 border-primary-container/30 p-5">
            <h3 className="text-label-md text-primary-container">ผลการพิจารณา</h3>
            {saveError && <Alert>{saveError}</Alert>}
            {detail.statusCode === 'CANCELLED' && <Alert tone="warning">ผู้ยื่นยกเลิกคำร้องนี้แล้ว</Alert>}
            {(NEXT_STEP[detail.statusCode] ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2" aria-label="ขั้นถัดไปที่แนะนำ">
                {NEXT_STEP[detail.statusCode].map((next) => {
                  const selected = form.statusCode === next.code;
                  const reject = next.code === 'REJECTED';
                  return (
                    <button
                      key={next.code}
                      type="button"
                      onClick={() => chooseStatus(next.code)}
                      aria-pressed={selected}
                      className={cx(
                        'rounded-full border px-3 py-1.5 text-label-md transition-colors',
                        selected && reject && 'border-error bg-error text-white',
                        selected && !reject && 'border-primary-container bg-primary-container text-white',
                        !selected && reject && 'border-error/40 text-error hover:bg-error-container',
                        !selected && !reject && 'border-outline-variant text-primary-container hover:border-primary-container',
                      )}
                    >
                      {next.label}
                    </button>
                  );
                })}
              </div>
            )}
            <Field label="สถานะ" htmlFor="statusCode" hint={form.statusCode !== detail.statusCode ? `เปลี่ยนจาก “${statusLabel(detail.statusCode)}”` : undefined}>
              <Select id="statusCode" value={form.statusCode} onChange={(e) => chooseStatus(e.target.value)}>
                {(lookups['request-statuses'] ?? []).map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            {needsAmount && (
              <div className="fade-slide-up space-y-3 rounded-lg bg-sso-container/60 p-4">
                <Field
                  label="วงเงินที่อนุมัติ (บาท)"
                  required
                  htmlFor="approved"
                  hint={`ขอรับ ${formatMoney(detail.amountRequestedSatang)}${
                    form.approvedBaht ? ` · อนุมัติ ${Math.round((bahtInputToSatang(form.approvedBaht) / detail.amountRequestedSatang) * 100)}% ของยอดที่ขอ` : ''
                  }`}
                >
                  <TextInput id="approved" inputMode="numeric" value={form.approvedBaht} onChange={(e) => setForm({ ...form, approvedBaht: digitsOnly(e.target.value, 7) })} />
                </Field>
                <div className="flex flex-wrap gap-2" aria-label="วงเงินลัด">
                  {[100, 75, 50].map((percent) => {
                    const baht = Math.round((detail.amountRequestedSatang / 100) * (percent / 100));
                    return (
                      <button
                        key={percent}
                        type="button"
                        onClick={() => setForm({ ...form, approvedBaht: String(baht) })}
                        className="rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-sm text-on-surface-variant transition-colors hover:border-primary-container hover:text-primary-container"
                      >
                        {percent === 100 ? 'เต็มจำนวน' : `${percent}%`} · {baht.toLocaleString('th-TH')} บาท
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {form.statusCode === 'REJECTED' && (
              <div className="fade-slide-up space-y-3 rounded-lg bg-error-container/60 p-4">
                <p className="text-body-md text-on-error-container">
                  คำร้องจะสิ้นสุดที่ “ไม่ผ่านการพิจารณา” และไม่มีวงเงินอนุมัติ ผู้ยื่นจะเห็นเหตุผลด้านล่างในหน้าคำร้องของฉัน
                </p>
                <div className="flex flex-wrap gap-2" aria-label="เหตุผลที่ใช้บ่อย">
                  {REJECT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setForm({ ...form, note: form.note.trim() ? `${form.note.trim()}\n${reason}` : reason })}
                      className="rounded-full border border-error/30 bg-surface-container-lowest px-3 py-1 text-label-sm text-error transition-colors hover:bg-error-container"
                    >
                      + {reason}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Field
              label={form.statusCode === 'REJECTED' ? 'เหตุผลที่ไม่อนุมัติ' : 'หมายเหตุถึงผู้ยื่น'}
              required={rejecting}
              htmlFor="note"
              hint="ผู้ยื่นเห็นข้อความนี้ในหน้าคำร้องของฉัน และบันทึกลงประวัติ"
            >
              <TextArea id="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={500} className="min-h-20" />
            </Field>
          </Card>

          <DescriptionList
            items={[
              ['ผู้ยื่น', detail.person ? `${detail.person.fullNameTh} (${detail.person.personCode})` : `${detail.applicant.personCode ?? '-'} · ไม่พบชื่อในข้อมูลกลาง`],
              ['คณะ / สาขา', detail.person ? [detail.person.facultyName, detail.person.departmentName].filter(Boolean).join(' · ') || '-' : '-'],
              ['ปีที่เข้าศึกษา', detail.person?.entryYear ? String(detail.person.entryYear) : '-'],
              ['เบอร์ติดต่อ', formatPhone(detail.applicant.contactPhone)],
              ...(detail.kind === 'SCHOLARSHIP'
                ? ([
                    ['ทุน', detail.scholarshipTitle ?? '-'],
                    ['GPA / อายุ', `${detail.applicant.gpa?.toFixed(2) ?? '-'} / ${detail.applicant.age ?? '-'} ปี`],
                    ['เลขบัตรประชาชน', detail.applicant.nationalId ?? '-'],
                    ['รายได้ครอบครัวต่อปี', formatMoney(detail.familyIncomeSatang)],
                    ['สถานภาพครอบครัว', detail.familyStatusLabel ?? '-'],
                  ] as Array<[string, string]>)
                : ([
                    ['ประเภทความเดือดร้อน', detail.issueLabel ?? '-'],
                    ['ความเร่งด่วน', detail.urgencyLabel ? <StatusBadge key="u" tone={detail.urgencyTone}>{detail.urgencyLabel}</StatusBadge> : '-'],
                  ] as Array<[string, React.ReactNode]>)),
              ['จำนวนเงินที่ขอ', formatMoney(detail.amountRequestedSatang)],
              ['ช่องทางรับเงิน', `${detail.payoutLabel} ${detail.payoutAccount}`],
              ['ยื่นเมื่อ', formatDateTime(detail.createdAt)],
            ]}
          />
          {detail.familyExpenses && (
            <section>
              <h3 className="mb-2 text-label-md text-on-surface">ภาระค่าใช้จ่ายของครอบครัว</h3>
              <p className="whitespace-pre-line text-body-md text-on-surface-variant">{detail.familyExpenses}</p>
            </section>
          )}
          <section>
            <h3 className="mb-2 text-label-md text-on-surface">เหตุผล / รายละเอียด</h3>
            <p className="whitespace-pre-line text-body-md text-on-surface-variant">{detail.reason}</p>
          </section>
          <section>
            <h3 className="mb-2 text-label-md text-on-surface">ไฟล์แนบ ({detail.attachments.length})</h3>
            {detail.attachments.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">ไม่มีไฟล์แนบ</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {detail.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={`/api/v1/attachments/${file.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-outline-variant/40 px-3 py-2 text-body-md text-primary-container transition-colors hover:border-primary-container"
                    >
                      <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{file.originalName}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h3 className="mb-4 text-label-md text-on-surface">ประวัติการดำเนินการ</h3>
            <HistoryList history={detail.history} />
          </section>
        </div>
      )}
    </Drawer>
  );
}

// ------------------------------------------------------------------ ประกาศทุน

interface ScholarshipForm {
  title: string;
  typeCode: string;
  amountMinBaht: string;
  amountMaxBaht: string;
  amountNote: string;
  deadline: string;
  quota: string;
  minGpa: string;
  criteria: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: ScholarshipForm = {
  title: '',
  typeCode: '',
  amountMinBaht: '',
  amountMaxBaht: '',
  amountNote: '',
  deadline: '',
  quota: '0',
  minGpa: '0',
  criteria: '',
  description: '',
  isActive: true,
};

function toForm(item: Scholarship): ScholarshipForm {
  return {
    title: item.title,
    typeCode: item.typeCode,
    amountMinBaht: String(item.amountMinSatang / 100),
    amountMaxBaht: String(item.amountMaxSatang / 100),
    amountNote: item.amountNote,
    deadline: item.deadline,
    quota: String(item.quota),
    minGpa: item.minGpa.toFixed(2),
    criteria: item.criteria,
    description: item.description,
    isActive: item.isActive,
  };
}

type ManageFilter = 'all' | 'active' | 'inactive' | 'expired';

function ManageScholarships({ me, openNew, onChanged, onConsumedNew }: { me: Me; openNew: boolean; onChanged: () => void; onConsumedNew: () => void }) {
  const toast = useToast();
  const { lookups } = useLookups(['scholarship-types']);
  const { data: items, error, reload } = useAsync(() => fetchAll<Scholarship>('/api/v1/scholarships?includeInactive=true'), []);
  const canCreate = me.permissions.includes('scholarship:create');
  const canUpdate = me.permissions.includes('scholarship:update');
  const canDelete = me.permissions.includes('scholarship:delete');
  const [editing, setEditing] = useState<Scholarship | 'new' | null>(null);
  const [form, setForm] = useState<ScholarshipForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<Scholarship | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [filter, setFilter] = useState<ManageFilter>('all');

  const open = (item: Scholarship | 'new') => {
    setEditing(item);
    setForm(item === 'new' ? EMPTY_FORM : toForm(item));
    setFormError('');
  };

  // เปิดฟอร์มเพิ่มทุนจากปุ่มด้านข้าง/หัวหน้า (?new=1) แล้วเอา new ออกจาก URL
  useEffect(() => {
    if (!openNew) return;
    if (canCreate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- เปิดฟอร์มครั้งเดียวตามลิงก์ ?new=1
      setEditing('new');
      setForm(EMPTY_FORM);
      setFormError('');
    }
    onConsumedNew();
  }, [openNew, canCreate, onConsumedNew]);

  async function save() {
    const min = bahtInputToSatang(form.amountMinBaht || form.amountMaxBaht);
    const max = bahtInputToSatang(form.amountMaxBaht);
    const gpa = Number(form.minGpa || 0);
    if (form.title.trim().length < 5) return setFormError('ชื่อทุนต้องมีอย่างน้อย 5 ตัวอักษร');
    if (!form.typeCode) return setFormError('กรุณาเลือกประเภททุน');
    if (max < 100) return setFormError('กรุณาระบุวงเงินสูงสุด');
    if (min > max) return setFormError('วงเงินขั้นต่ำต้องไม่มากกว่าวงเงินสูงสุด');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.deadline)) return setFormError('กรุณาเลือกวันปิดรับสมัคร');
    if (Number.isNaN(gpa) || gpa < 0 || gpa > 4) return setFormError('เกรดเฉลี่ยขั้นต่ำต้องอยู่ระหว่าง 0.00 ถึง 4.00');
    if (form.criteria.trim().length < 5 || form.description.trim().length < 5) return setFormError('กรุณากรอกคุณสมบัติและรายละเอียดอย่างน้อย 5 ตัวอักษร');
    const body = {
      title: form.title.trim(),
      typeCode: form.typeCode,
      amountMinSatang: min,
      amountMaxSatang: max,
      amountNote: form.amountNote.trim(),
      deadline: form.deadline,
      quota: Number(form.quota || 0),
      minGpa: Math.round(gpa * 100) / 100,
      criteria: form.criteria.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing === 'new') await api.post('/api/v1/scholarships', body);
      else if (editing) await api.patch(`/api/v1/scholarships/${editing.id}`, body);
      toast(editing === 'new' ? 'เพิ่มประกาศทุนเรียบร้อย' : 'บันทึกประกาศทุนเรียบร้อย');
      setEditing(null);
      reload();
      onChanged();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(item: Scholarship) {
    try {
      await api.patch(`/api/v1/scholarships/${item.id}`, { isActive: !item.isActive });
      toast(item.isActive ? 'ปิดประกาศทุนแล้ว' : 'เปิดประกาศทุนแล้ว', 'info');
      reload();
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  }

  async function remove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await api.delete(`/api/v1/scholarships/${removing.id}`);
      toast('ลบประกาศทุนเรียบร้อย');
      setRemoving(null);
      reload();
      onChanged();
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setRemoveBusy(false);
    }
  }

  const set = (key: keyof ScholarshipForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: event.target.value });

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />;
  if (!items) return <SkeletonList rows={2} />;

  const counts = {
    all: items.length,
    active: items.filter((i) => i.isActive && !i.isExpired).length,
    inactive: items.filter((i) => !i.isActive).length,
    expired: items.filter((i) => i.isActive && i.isExpired).length,
  };
  const visible = items.filter((i) =>
    filter === 'active' ? i.isActive && !i.isExpired : filter === 'inactive' ? !i.isActive : filter === 'expired' ? i.isActive && i.isExpired : true,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="ตัวกรองประกาศทุน" className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'ทั้งหมด'],
              ['active', 'เปิดรับอยู่'],
              ['expired', 'เลยวันปิดรับ'],
              ['inactive', 'ปิดประกาศ'],
            ] as Array<[ManageFilter, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={filter === id}
              onClick={() => setFilter(id)}
              className={cx(
                'min-h-9 rounded-full border px-3 py-1.5 text-label-md transition-colors',
                filter === id ? 'border-primary-container bg-primary-container text-white' : 'border-outline-variant text-on-surface-variant hover:border-primary-container hover:text-primary-container',
              )}
            >
              {label} <span className="ml-1 tabular-nums opacity-80">{counts[id]}</span>
            </button>
          ))}
        </div>
        {canCreate && (
          <Button onClick={() => open('new')}>
            <Plus className="h-4 w-4" aria-hidden="true" /> เพิ่มประกาศทุน
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="ยังไม่มีประกาศทุน"
          description="เริ่มต้นด้วยการเพิ่มประกาศทุนแรกของสาขา"
          action={canCreate ? <Button onClick={() => open('new')}>เพิ่มประกาศทุน</Button> : undefined}
        />
      ) : visible.length === 0 ? (
        <EmptyState title="ไม่มีประกาศทุนในกลุ่มนี้" description="เลือกตัวกรองอื่น" action={<Button variant="secondary" onClick={() => setFilter('all')}>ดูทั้งหมด</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {visible.map((item) => {
            const percent = item.quota > 0 ? Math.round((item.applicationCount / item.quota) * 100) : 0;
            return (
              <Card key={item.id} className="card-lift fade-slide-up flex flex-col p-6">
                <div className="mb-3 flex flex-wrap gap-2">
                  <StatusBadge tone={!item.isActive ? 'neutral' : item.isExpired ? 'warning' : 'success'}>
                    {!item.isActive ? 'ปิดประกาศ' : item.isExpired ? 'เลยวันปิดรับ' : 'เปิดรับ'}
                  </StatusBadge>
                  <Tag emphasis>{item.typeLabel}</Tag>
                  {item.isActive && !item.isExpired && <Tag>{daysLeftLabel(item.daysLeft)}</Tag>}
                </div>
                <h3 className="font-display text-headline-md leading-snug text-on-surface">{item.title}</h3>
                <p className="mt-1 text-label-md text-primary-container">{item.amountLabel}</p>
                <p className="mt-2 text-body-md text-on-surface-variant">
                  ปิดรับ {formatDate(item.deadline)} · GPA ขั้นต่ำ {item.minGpa > 0 ? item.minGpa.toFixed(2) : 'ไม่กำหนด'}
                </p>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-label-sm text-on-surface-variant">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" /> ใบสมัคร {formatNumber(item.applicationCount)} ใบ
                    </span>
                    <span>{item.quota > 0 ? `โควตา ${formatNumber(item.quota)} ทุน (${percent}%)` : 'ไม่จำกัดจำนวน'}</span>
                  </div>
                  {item.quota > 0 && <ProgressBar value={percent} label={`ใบสมัครเทียบโควตา ${percent}%`} />}
                </div>
                <div className="mt-auto flex flex-wrap justify-end gap-2 pt-5">
                  {canUpdate && (
                    <>
                      <Button variant="tonal" onClick={() => toggle(item)}>
                        <Megaphone className="h-4 w-4" aria-hidden="true" /> {item.isActive ? 'ปิดประกาศ' : 'เปิดประกาศ'}
                      </Button>
                      <Button variant="secondary" onClick={() => open(item)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" /> แก้ไข
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button variant="danger" onClick={() => setRemoving(item)} disabled={item.applicationCount > 0} disabledReason="ทุนนี้มีใบสมัครแล้ว ให้ปิดประกาศแทนการลบ">
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> ลบ
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <Drawer
          title={editing === 'new' ? 'เพิ่มประกาศทุน' : 'แก้ไขประกาศทุน'}
          subtitle={editing === 'new' ? 'ประกาศจะแสดงให้นักศึกษาเห็นทันทีเมื่อเปิดรับสมัคร' : editing.title}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                ยกเลิก
              </Button>
              <Button onClick={save} loading={saving}>
                บันทึก
              </Button>
            </>
          }
        >
          <div className="space-y-5">
            {formError && <Alert>{formError}</Alert>}
            <Field label="ชื่อโครงการทุน" required htmlFor="s-title">
              <TextInput id="s-title" value={form.title} onChange={set('title')} maxLength={200} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="ประเภททุน" required htmlFor="s-type">
                <Select id="s-type" value={form.typeCode} onChange={set('typeCode')}>
                  <option value="">เลือกประเภท</option>
                  {(lookups['scholarship-types'] ?? []).map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="วันปิดรับสมัคร" required htmlFor="s-deadline">
                <TextInput id="s-deadline" type="date" value={form.deadline} onChange={set('deadline')} />
              </Field>
              <Field label="วงเงินขั้นต่ำ (บาท)" htmlFor="s-min" hint="เว้นว่าง = เท่ากับวงเงินสูงสุด">
                <TextInput id="s-min" inputMode="numeric" value={form.amountMinBaht} onChange={(e) => setForm({ ...form, amountMinBaht: digitsOnly(e.target.value, 7) })} />
              </Field>
              <Field label="วงเงินสูงสุด (บาท)" required htmlFor="s-max">
                <TextInput id="s-max" inputMode="numeric" value={form.amountMaxBaht} onChange={(e) => setForm({ ...form, amountMaxBaht: digitsOnly(e.target.value, 7) })} />
              </Field>
              <Field label="หน่วยวงเงิน" htmlFor="s-note" hint="เช่น / ภาคเรียน">
                <TextInput id="s-note" value={form.amountNote} onChange={set('amountNote')} maxLength={60} />
              </Field>
              <Field label="จำนวนทุน" htmlFor="s-quota" hint="0 = ไม่จำกัด">
                <TextInput id="s-quota" inputMode="numeric" value={form.quota} onChange={(e) => setForm({ ...form, quota: digitsOnly(e.target.value, 4) })} />
              </Field>
              <Field label="เกรดเฉลี่ยขั้นต่ำ" htmlFor="s-gpa" hint="0 = ไม่กำหนด">
                <TextInput id="s-gpa" inputMode="decimal" value={form.minGpa} onChange={(e) => setForm({ ...form, minGpa: e.target.value.replace(/[^\d.]/g, '').slice(0, 4) })} />
              </Field>
            </div>
            <Field label="คุณสมบัติผู้สมัคร" required htmlFor="s-criteria">
              <TextArea id="s-criteria" value={form.criteria} onChange={set('criteria')} maxLength={500} />
            </Field>
            <Field label="รายละเอียด" required htmlFor="s-desc">
              <TextArea id="s-desc" value={form.description} onChange={set('description')} maxLength={1000} className="min-h-36" />
            </Field>
            <Checkbox id="s-active" checked={form.isActive} onChange={(checked) => setForm({ ...form, isActive: checked })}>
              เปิดรับสมัคร (แสดงให้นักศึกษาเห็น)
            </Checkbox>
          </div>
        </Drawer>
      )}

      {removing && (
        <ConfirmDialog
          title="ลบประกาศทุนนี้?"
          message={
            <>
              ยืนยันการลบ <strong>{removing.title}</strong> การลบย้อนกลับไม่ได้
            </>
          }
          confirmLabel="ลบประกาศทุน"
          danger
          loading={removeBusy}
          onConfirm={remove}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  );
}
