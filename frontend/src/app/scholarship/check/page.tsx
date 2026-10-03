'use client';

import { CheckCircle2, Clock, Sparkles, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { applyHref, deadlineTone, FavoriteButton } from '@/components/scholarship-card';
import { Alert, Button, ButtonLink, Card, cx, EmptyState, ErrorState, Field, Modal, PageHeader, Select, SkeletonList, StatusBadge, TextInput } from '@/components/ui';
import { errorMessage, fetchAll, type Me, type Scholarship } from '@/lib/api';
import { daysLeftLabel, formatDate } from '@/lib/format';
import { useFavorites } from '@/lib/local-state';
import { useAsync } from '@/lib/use-async';

export default function EligibilityPage() {
  return <AppShell permission="scholarship:read">{({ me }) => <Checker me={me} />}</AppShell>;
}

function Checker({ me }: { me: Me }) {
  const { data: items, error: loadError, reload } = useAsync(() => fetchAll<Scholarship>('/api/v1/scholarships'), []);
  const favorites = useFavorites(me.id);
  const [gpaText, setGpaText] = useState(me.lastApplication?.gpa?.toFixed(2) ?? '');
  const [type, setType] = useState('');
  const [selected, setSelected] = useState<Scholarship | null>(null);

  const gpa = gpaText === '' ? null : Number(gpaText);
  const gpaValid = gpa !== null && !Number.isNaN(gpa) && gpa >= 0 && gpa <= 4;

  const open = useMemo(() => (items ?? []).filter((item) => !item.isExpired && (!type || item.typeCode === type)).sort((a, b) => a.daysLeft - b.daysLeft), [items, type]);
  const eligible = gpaValid ? open.filter((item) => item.minGpa <= (gpa as number)) : [];
  const notEligible = gpaValid ? open.filter((item) => item.minGpa > (gpa as number)).sort((a, b) => a.minGpa - b.minGpa) : [];
  const closingSoon = open.filter((item) => item.isClosingSoon).length;
  const types = useMemo(() => {
    const map = new Map<string, string>();
    (items ?? []).forEach((item) => map.set(item.typeCode, item.typeLabel));
    return [...map.entries()];
  }, [items]);
  const percent = open.length ? Math.round((eligible.length / open.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="ตรวจสอบสิทธิ์ทุนการศึกษา" description="กรอกเกรดเฉลี่ยสะสม ระบบจะแยกให้ทันทีว่าทุนใดที่คุณมีคุณสมบัติสมัครได้" />
      {loadError ? (
        <ErrorState message={errorMessage(loadError)} onRetry={reload} />
      ) : !items ? (
        <SkeletonList rows={2} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="fade-slide-up grid grid-cols-1 gap-4 p-6 sm:grid-cols-[220px_1fr]">
              <Field label="เกรดเฉลี่ยสะสม (GPAX)" htmlFor="gpa" error={gpaText && !gpaValid ? 'กรอกค่าระหว่าง 0.00 ถึง 4.00' : undefined} hint={me.lastApplication?.gpa ? 'ดึงจากใบสมัครล่าสุดของคุณ' : undefined}>
                <TextInput
                  id="gpa"
                  inputMode="decimal"
                  value={gpaText}
                  onChange={(e) => setGpaText(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))}
                  placeholder="เช่น 3.25"
                  invalid={Boolean(gpaText && !gpaValid)}
                  className="font-display text-headline-md"
                />
              </Field>
              <Field label="ประเภททุน" htmlFor="type">
                <Select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="">ทุกประเภท</option>
                  {types.map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
            </Card>
            <Card className="fade-slide-up stagger-1 flex items-center gap-5 p-6">
              <Gauge percent={gpaValid ? percent : 0} />
              <div>
                <p className="text-label-md text-on-surface-variant">ทุนที่คุณสมัครได้</p>
                <p className="font-display text-headline-lg text-primary-container">{gpaValid ? `${eligible.length}/${open.length}` : '–'}</p>
                <p className="text-label-sm text-secondary">{gpaValid ? 'ของทุนที่เปิดรับอยู่' : 'กรอกเกรดเฉลี่ยเพื่อคำนวณ'}</p>
              </div>
            </Card>
          </div>

          {closingSoon > 0 && (
            <Alert tone="warning">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" /> มี {closingSoon} ทุนที่จะปิดรับสมัครภายใน 7 วัน
              </span>
            </Alert>
          )}

          {open.length === 0 ? (
            <EmptyState title="ยังไม่มีทุนที่เปิดรับสมัคร" description="เมื่อมีประกาศทุนใหม่ จะตรวจสอบสิทธิ์ได้ที่หน้านี้" action={<ButtonLink href="/" variant="secondary">กลับหน้าหลัก</ButtonLink>} />
          ) : !gpaValid ? (
            <Group title="ทุนที่เปิดรับทั้งหมด" items={open} onOpen={setSelected} favorites={favorites} note="กรอกเกรดเฉลี่ยเพื่อดูว่าทุนใดที่คุณมีคุณสมบัติ" />
          ) : (
            <>
              <Group title={`ทุนที่คุณมีคุณสมบัติ (${eligible.length})`} items={eligible} onOpen={setSelected} favorites={favorites} eligible />
              {notEligible.length > 0 && <Group title={`เกรดเฉลี่ยยังไม่ถึงเกณฑ์ (${notEligible.length})`} items={notEligible} onOpen={setSelected} favorites={favorites} eligible={false} gpa={gpa as number} />}
            </>
          )}
        </>
      )}

      {selected && (
        <Modal
          title={selected.title}
          onClose={() => setSelected(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                ปิด
              </Button>
              <ButtonLink href={applyHref(selected.id)}>สมัครทุนนี้</ButtonLink>
            </>
          }
        >
          <dl className="space-y-3 text-body-md">
            <Row label="ประเภท">{selected.typeLabel}</Row>
            <Row label="วงเงิน">{selected.amountLabel}</Row>
            <Row label="ปิดรับสมัคร">
              {formatDate(selected.deadline, 'long')} ({daysLeftLabel(selected.daysLeft)})
            </Row>
            <Row label="เกรดเฉลี่ยขั้นต่ำ">{selected.minGpa > 0 ? selected.minGpa.toFixed(2) : 'ไม่กำหนด'}</Row>
            <Row label="คุณสมบัติ">{selected.criteria}</Row>
            <Row label="รายละเอียด">
              <span className="whitespace-pre-line">{selected.description}</span>
            </Row>
          </dl>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-label-sm text-on-surface-variant">{label}</dt>
      <dd className="text-on-surface">{children}</dd>
    </div>
  );
}

/** วงแหวนสัดส่วนทุนที่สมัครได้ */
function Gauge({ percent }: { percent: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90" role="img" aria-label={`สมัครได้ ${percent}%`}>
      <circle cx="40" cy="40" r={r} className="fill-none stroke-surface-container" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        className="fill-none stroke-primary-container transition-[stroke-dashoffset] duration-500"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * percent) / 100}
      />
      <text x="40" y="40" className="fill-on-surface font-display text-[16px] font-bold" textAnchor="middle" dominantBaseline="central" transform="rotate(90 40 40)">
        {percent}%
      </text>
    </svg>
  );
}

function Group({
  title,
  items,
  onOpen,
  favorites,
  eligible,
  note,
  gpa,
}: {
  title: string;
  items: Scholarship[];
  onOpen: (item: Scholarship) => void;
  favorites: ReturnType<typeof useFavorites>;
  eligible?: boolean;
  note?: string;
  gpa?: number;
}) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 border-l-4 border-primary-container pl-3 font-display text-headline-md text-on-surface">
        {eligible === true && <Sparkles className="h-5 w-5 text-primary-container" aria-hidden="true" />}
        {title}
      </h2>
      {note && <p className="text-body-md text-on-surface-variant">{note}</p>}
      {items.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">ไม่มีรายการ</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id} className={cx('card-lift fade-slide-up flex items-start gap-3 p-5', eligible === false && 'opacity-80')}>
              {eligible === true && <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-success" aria-label="มีคุณสมบัติ" />}
              {eligible === false && <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-outline" aria-label="ยังไม่ถึงเกณฑ์" />}
              <div className="min-w-0 flex-1">
                <p className="text-label-md text-on-surface">{item.title}</p>
                <p className="text-body-md text-primary-container">{item.amountLabel}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={deadlineTone(item)}>{daysLeftLabel(item.daysLeft)}</StatusBadge>
                  <StatusBadge tone="neutral">GPA ขั้นต่ำ {item.minGpa > 0 ? item.minGpa.toFixed(2) : 'ไม่กำหนด'}</StatusBadge>
                  {eligible === false && gpa !== undefined && <StatusBadge tone="warning">ขาดอีก {(item.minGpa - gpa).toFixed(2)}</StatusBadge>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => onOpen(item)}>
                    ดูรายละเอียด
                  </Button>
                  {eligible !== false && <ButtonLink href={applyHref(item.id)}>สมัครเลย</ButtonLink>}
                </div>
              </div>
              <FavoriteButton active={favorites.has(item.id)} onToggle={() => favorites.toggle(item.id)} title={item.title} />
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
