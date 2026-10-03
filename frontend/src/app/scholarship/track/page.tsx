'use client';

import { Ban, ClipboardList, FileText, GraduationCap, HeartHandshake, Paperclip, Pencil, Printer, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AttachmentPicker, formatBytes, uploadAll } from '@/components/attachment-picker';
import { HistoryList, StatusStepper } from '@/components/request-timeline';
import { digitsOnly } from '@/components/student-fields';
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ChipGroup,
  ConfirmDialog,
  DescriptionList,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  Select,
  SkeletonList,
  StatCard,
  StatusBadge,
  Tag,
  TextArea,
  TextInput,
  useToast,
} from '@/components/ui';
import { api, errorMessage, type Me, type RequestDetail, type RequestSummary } from '@/lib/api';
import { bahtInputToSatang, formatDate, formatDateTime, formatMoney, formatNumber, formatPhone, formatRelative } from '@/lib/format';
import { useSeenUpdates } from '@/lib/local-state';
import { useLookups } from '@/lib/lookups';
import { useAsync } from '@/lib/use-async';
import { useMyRequests } from '@/lib/use-my-requests';

export default function TrackPage() {
  return (
    <AppShell permission="request:read:own">
      {({ me }) => (
        <Suspense fallback={<SkeletonList rows={3} />}>
          <MyRequests me={me} />
        </Suspense>
      )}
    </AppShell>
  );
}

type Filter = 'all' | 'active' | 'final' | 'updated';

function MyRequests({ me }: { me: Me }) {
  const { data: items, error: loadError, reload } = useMyRequests(me);
  const { isUnseen, markSeen } = useSeenUpdates(me.id);
  const tn = useSearchParams().get('tn') ?? '';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [picked, setPicked] = useState<string | null>(null);
  const [dismissedAuto, setDismissedAuto] = useState(false);

  // มาจากลิงก์ ?tn=<รหัสติดตาม> (หน้าส่งคำร้องสำเร็จ / กระดิ่งแจ้งเตือน) → เปิดรายละเอียดให้ทันที
  const autoId = !dismissedAuto && tn ? items?.find((item) => item.trackingNo.toUpperCase() === tn.toUpperCase())?.id : undefined;
  const openId = picked ?? autoId ?? null;
  const setOpenId = (id: string | null) => {
    setPicked(id);
    setDismissedAuto(true);
  };

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      active: list.filter((item) => !item.isFinal).length,
      final: list.filter((item) => item.isFinal).length,
      updated: list.filter(isUnseen).length,
      approved: list.filter((item) => item.statusCode === 'APPROVED').reduce((sum, item) => sum + (item.amountApprovedSatang ?? 0), 0),
    };
  }, [items, isUnseen]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? [])
      .filter((item) => (filter === 'active' ? !item.isFinal : filter === 'final' ? item.isFinal : filter === 'updated' ? isUnseen(item) : true))
      .filter((item) => !q || `${item.trackingNo} ${item.scholarshipTitle ?? ''} ${item.issueLabel ?? ''} ${item.statusLabel}`.toLowerCase().includes(q));
  }, [items, query, filter, isUnseen]);

  const header = (
    <PageHeader
      title="คำร้องของฉัน"
      description="ติดตามความคืบหน้าเป็นไทม์ไลน์ แก้ไขหรือยกเลิกได้ระหว่างรออาจารย์ที่ปรึกษา และพิมพ์ใบยืนยันได้ทุกเมื่อ"
      actions={
        <>
          <ButtonLink href="/welfare/dashboard">
            <GraduationCap className="h-4 w-4" aria-hidden="true" /> สมัครทุน
          </ButtonLink>
          <ButtonLink href="/welfare/form" variant="secondary">
            <HeartHandshake className="h-4 w-4" aria-hidden="true" /> ขอความช่วยเหลือ
          </ButtonLink>
        </>
      }
    />
  );

  if (loadError) return <div className="space-y-8">{header}<ErrorState message={errorMessage(loadError)} onRetry={reload} /></div>;
  if (!items) return <div className="space-y-8">{header}<SkeletonList rows={3} /></div>;

  const tnMissing = Boolean(tn) && !items.some((item) => item.trackingNo.toUpperCase() === tn.toUpperCase());

  return (
    <div className="space-y-8">
      {header}
      {tnMissing && <Alert tone="warning">ไม่พบคำร้องรหัส {tn} ในบัญชีของคุณ ตรวจสอบรหัสติดตามอีกครั้ง</Alert>}
      {items.length === 0 ? (
        <EmptyState
          title="คุณยังไม่มีคำร้อง"
          description="เมื่อยื่นใบสมัครทุนหรือคำร้องขอความช่วยเหลือ รายการจะแสดงที่นี่พร้อมไทม์ไลน์สถานะล่าสุด"
          action={<ButtonLink href="/welfare/dashboard">ดูทุนที่เปิดรับ</ButtonLink>}
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-3" aria-label="สรุปคำร้อง">
            <StatCard label="กำลังดำเนินการ" value={formatNumber(counts.active)} hint={`จากทั้งหมด ${formatNumber(counts.all)} รายการ`} icon={ClipboardList} emphasis />
            <StatCard label="มีอัปเดตใหม่" value={formatNumber(counts.updated)} hint="ตั้งแต่ที่คุณเปิดดูล่าสุด" icon={FileText} className="stagger-1" />
            <StatCard label="ยอดที่ได้รับอนุมัติ" value={formatMoney(counts.approved).replace(' บาท', '')} hint="บาท" icon={GraduationCap} className="stagger-2" />
          </section>

          <Card className="space-y-4 p-4 md:p-6">
            <label className="relative block max-w-md">
              <span className="sr-only">ค้นหาคำร้อง</span>
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-outline" aria-hidden="true" />
              <TextInput type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหารหัสติดตาม ชื่อทุน หรือสถานะ" className="pl-9" />
            </label>
            <ChipGroup<Filter>
              label="ตัวกรองคำร้อง"
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'ทั้งหมด', count: counts.all },
                { id: 'active', label: 'กำลังดำเนินการ', count: counts.active },
                { id: 'final', label: 'เสร็จสิ้น', count: counts.final },
                { id: 'updated', label: 'อัปเดตใหม่', count: counts.updated },
              ]}
            />
          </Card>

          {visible.length === 0 ? (
            <EmptyState
              title="ไม่พบคำร้องตามเงื่อนไข"
              description="ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setFilter('all');
                  }}
                >
                  ล้างตัวกรอง
                </Button>
              }
            />
          ) : (
            <ul className="space-y-4">
              {visible.map((item, index) => (
                <li key={item.id}>
                  <RequestCard item={item} unseen={isUnseen(item)} onOpen={() => setOpenId(item.id)} className={`stagger-${Math.min(index, 3)}`} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {openId && (
        <RequestDrawer
          id={openId}
          me={me}
          onClose={() => setOpenId(null)}
          onLoaded={(detail) => markSeen([detail])}
          onChanged={reload}
        />
      )}
    </div>
  );
}

function RequestCard({ item, unseen, onOpen, className }: { item: RequestSummary; unseen: boolean; onOpen: () => void; className?: string }) {
  return (
    <Card className={`card-lift fade-slide-up ${className ?? ''}`}>
      <button type="button" onClick={onOpen} className="block w-full space-y-5 p-6 text-left" aria-label={`ดูรายละเอียดคำร้อง ${item.trackingNo}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="font-display text-label-md tracking-wide text-primary-container">{item.trackingNo}</span>
              <Tag emphasis={item.kind === 'SCHOLARSHIP'}>{item.kind === 'SCHOLARSHIP' ? 'ทุนการศึกษา' : 'ช่วยเหลือฉุกเฉิน'}</Tag>
              {unseen && <span className="rounded-full bg-error px-2 py-0.5 text-caption text-white">อัปเดตใหม่</span>}
            </div>
            <p className="truncate text-label-md text-on-surface">{item.scholarshipTitle ?? item.issueLabel}</p>
            <p className="text-body-md text-on-surface-variant">
              ยื่นเมื่อ {formatDate(item.createdAt)} · ขอรับ {formatMoney(item.amountRequestedSatang)}
              {item.amountApprovedSatang !== null && ` · อนุมัติ ${formatMoney(item.amountApprovedSatang)}`}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
            <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>
            <span className="text-caption text-secondary">
              อัปเดต {formatRelative(item.updatedAt)} · <span className="text-primary-container">ดูรายละเอียด ›</span>
            </span>
          </div>
        </div>
        <StatusStepper item={item} compact />
      </button>
    </Card>
  );
}

// ------------------------------------------------------------------ รายละเอียด / แก้ไข / ยกเลิก

function RequestDrawer({
  id,
  me,
  onClose,
  onLoaded,
  onChanged,
}: {
  id: string;
  me: Me;
  onClose: () => void;
  onLoaded: (detail: RequestDetail) => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const { data: detail, error, reload } = useAsync(() => api.get<RequestDetail>(`/api/v1/requests/${id}`), [id]);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [cancelling, setCancelling] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (detail) onLoaded(detail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id, detail?.updatedAt]);

  const isOwner = detail?.coreUserId === me.id;
  const editable = Boolean(
    detail && isOwner && detail.statusCode === 'PENDING_ADVISOR' && me.permissions.includes('request:update:own') && !me.permissions.includes('request:update:any'),
  );
  const canAttach = Boolean(detail && !detail.isFinal && detail.attachments.length < 10 && me.permissions.includes('attachment:create:own'));

  async function upload() {
    if (!detail || files.length === 0) return;
    setUploading(true);
    const failed = await uploadAll(detail.id, files);
    setUploading(false);
    setFiles([]);
    if (failed.length) setFileError(`อัปโหลดไม่สำเร็จ: ${failed.join(', ')}`);
    else toast('แนบไฟล์เรียบร้อย');
    reload();
    onChanged();
  }

  return (
    <Drawer
      title={detail ? `คำร้อง ${detail.trackingNo}` : 'รายละเอียดคำร้อง'}
      subtitle={detail ? (detail.scholarshipTitle ?? detail.issueLabel) : undefined}
      onClose={onClose}
      footer={
        detail && mode === 'view' ? (
          <>
            {editable && (
              <>
                <Button variant="danger" onClick={() => setCancelling(true)}>
                  <Ban className="h-4 w-4" aria-hidden="true" /> ยกเลิกคำร้อง
                </Button>
                <Button variant="secondary" onClick={() => setMode('edit')}>
                  <Pencil className="h-4 w-4" aria-hidden="true" /> แก้ไข
                </Button>
              </>
            )}
            <Button onClick={() => printSlip(detail, me)}>
              <Printer className="h-4 w-4" aria-hidden="true" /> พิมพ์ใบยืนยัน
            </Button>
          </>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : !detail ? (
        <SkeletonList rows={2} />
      ) : mode === 'edit' ? (
        <EditForm
          detail={detail}
          onCancel={() => setMode('view')}
          onSaved={() => {
            setMode('view');
            toast('บันทึกการแก้ไขเรียบร้อย');
            reload();
            onChanged();
          }}
        />
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={detail.statusTone}>{detail.statusLabel}</StatusBadge>
              {detail.urgencyLabel && <StatusBadge tone={detail.urgencyTone}>ความเร่งด่วน: {detail.urgencyLabel}</StatusBadge>}
            </div>
            <div className="rounded-xl bg-surface p-5">
              <StatusStepper item={detail} history={detail.history} />
            </div>
            {editable && (
              <Alert tone="info">คำร้องยังรออาจารย์ที่ปรึกษาตรวจสอบ คุณแก้ไขรายละเอียดหรือยกเลิกคำร้องได้จนกว่าจะเริ่มพิจารณา</Alert>
            )}
            {detail.staffNote && <Alert tone="info">หมายเหตุจากเจ้าหน้าที่: {detail.staffNote}</Alert>}
          </section>

          <DescriptionList
            items={[
              ['เรื่อง', detail.scholarshipTitle ?? detail.issueLabel ?? '-'],
              ['ผู้ยื่น', me.person ? `${me.person.fullNameTh} (${me.person.personCode})` : (detail.applicant.personCode ?? '-')],
              ['เบอร์ติดต่อ', formatPhone(detail.applicant.contactPhone)],
              ['จำนวนเงินที่ขอ', formatMoney(detail.amountRequestedSatang)],
              ['จำนวนเงินที่อนุมัติ', formatMoney(detail.amountApprovedSatang)],
              ['ช่องทางรับเงิน', `${detail.payoutLabel} ${detail.payoutAccount}`],
              ['ยื่นเมื่อ', formatDateTime(detail.createdAt)],
            ]}
          />

          <section>
            <h3 className="mb-2 text-label-md text-on-surface">เหตุผล / รายละเอียด</h3>
            <p className="whitespace-pre-line text-body-md text-on-surface-variant">{detail.reason}</p>
            {detail.familyExpenses && (
              <>
                <h3 className="mb-2 mt-4 text-label-md text-on-surface">ภาระค่าใช้จ่ายของครอบครัว</h3>
                <p className="whitespace-pre-line text-body-md text-on-surface-variant">{detail.familyExpenses}</p>
              </>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-label-md text-on-surface">ไฟล์แนบ ({detail.attachments.length})</h3>
            {detail.attachments.length === 0 ? (
              <p className="text-body-md text-on-surface-variant">ยังไม่มีไฟล์แนบ</p>
            ) : (
              <ul className="space-y-2">
                {detail.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={`/api/v1/attachments/${file.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg border border-outline-variant/40 px-3 py-2 transition-colors hover:border-primary-container"
                    >
                      <Paperclip className="h-4 w-4 text-primary-container" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-body-md text-primary-container">{file.originalName}</span>
                      <span className="text-caption text-secondary">{formatBytes(file.sizeBytes)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {canAttach && (
              <div className="space-y-3 rounded-xl bg-surface p-4">
                <AttachmentPicker files={files} onChange={setFiles} error={fileError} onError={setFileError} label="แนบหลักฐานเพิ่มเติม" max={10 - detail.attachments.length} />
                {files.length > 0 && (
                  <Button variant="tonal" onClick={upload} loading={uploading}>
                    <FileText className="h-4 w-4" aria-hidden="true" /> อัปโหลด {files.length} ไฟล์
                  </Button>
                )}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-4 text-label-md text-on-surface">ประวัติการดำเนินการ</h3>
            <HistoryList history={detail.history} />
          </section>
        </div>
      )}

      {cancelling && detail && (
        <CancelDialog
          detail={detail}
          onClose={() => setCancelling(false)}
          onDone={() => {
            setCancelling(false);
            toast('ยกเลิกคำร้องแล้ว', 'info');
            reload();
            onChanged();
          }}
        />
      )}
    </Drawer>
  );
}

function CancelDialog({ detail, onClose, onDone }: { detail: RequestDetail; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <ConfirmDialog
      title="ยกเลิกคำร้องนี้?"
      message={
        <>
          คำร้อง <strong>{detail.trackingNo}</strong> จะถูกปิดและไม่เข้าสู่การพิจารณา การยกเลิกย้อนกลับไม่ได้
          {detail.kind === 'SCHOLARSHIP' && ' (สมัครทุนนี้ใหม่ได้ภายหลังหากยังไม่ปิดรับ)'}
        </>
      }
      confirmLabel="ยืนยันยกเลิกคำร้อง"
      danger
      loading={busy}
      onClose={onClose}
      onConfirm={async () => {
        setBusy(true);
        setError('');
        try {
          await api.patch(`/api/v1/requests/${detail.id}`, { statusCode: 'CANCELLED', ...(note.trim() ? { changeNote: note.trim() } : {}) });
          onDone();
        } catch (err) {
          setError(errorMessage(err));
          setBusy(false);
        }
      }}
    >
      <div className="mt-4 space-y-3">
        <Field label="เหตุผลที่ยกเลิก (ไม่บังคับ)" htmlFor="cancel-note">
          <TextArea id="cancel-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="min-h-20" />
        </Field>
        {error && <Alert>{error}</Alert>}
      </div>
    </ConfirmDialog>
  );
}

function EditForm({ detail, onCancel, onSaved }: { detail: RequestDetail; onCancel: () => void; onSaved: () => void }) {
  const { lookups } = useLookups(detail.kind === 'WELFARE' ? ['payout-methods', 'urgency-levels'] : ['payout-methods']);
  const [form, setForm] = useState({
    amountBaht: String(Math.round(detail.amountRequestedSatang / 100)),
    reason: detail.reason,
    payoutCode: detail.payoutCode,
    payoutAccount: detail.payoutAccount,
    urgencyCode: detail.urgencyCode ?? '',
    familyExpenses: detail.familyExpenses ?? '',
    changeNote: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form, transform?: (v: string) => string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: transform ? transform(event.target.value) : event.target.value });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const amount = bahtInputToSatang(form.amountBaht);
    if (amount < 100) next.amountBaht = 'กรุณาระบุจำนวนเงินที่ขอรับ';
    if (form.reason.trim().length < 20) next.reason = 'กรุณาอธิบายอย่างน้อย 20 ตัวอักษร';
    if (!/^[0-9-]{6,20}$/.test(form.payoutAccount)) next.payoutAccount = 'กรุณากรอกเลขบัญชีหรือพร้อมเพย์ 6–20 หลัก';
    setErrors(next);
    if (Object.keys(next).length) return;

    // ส่งเฉพาะช่องที่เปลี่ยนจริง
    const body: Record<string, unknown> = {};
    if (amount !== detail.amountRequestedSatang) body.amountRequestedSatang = amount;
    if (form.reason.trim() !== detail.reason) body.reason = form.reason.trim();
    if (form.payoutCode !== detail.payoutCode) body.payoutCode = form.payoutCode;
    if (form.payoutAccount !== detail.payoutAccount) body.payoutAccount = form.payoutAccount;
    if (detail.kind === 'WELFARE' && form.urgencyCode && form.urgencyCode !== detail.urgencyCode) body.urgencyCode = form.urgencyCode;
    if (detail.kind === 'SCHOLARSHIP' && form.familyExpenses.trim() !== (detail.familyExpenses ?? '')) body.familyExpenses = form.familyExpenses.trim();
    if (Object.keys(body).length === 0) {
      setSaveError('ยังไม่มีข้อมูลที่เปลี่ยนแปลง');
      return;
    }
    if (form.changeNote.trim()) body.changeNote = form.changeNote.trim();

    setBusy(true);
    setSaveError('');
    try {
      await api.patch(`/api/v1/requests/${detail.id}`, body);
      onSaved();
    } catch (err) {
      setSaveError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate className="space-y-5">
      <Alert tone="info">แก้ไขได้เฉพาะรายละเอียดการขอรับเงิน ข้อมูลส่วนตัวแก้ไขได้ในการยื่นคำร้องครั้งถัดไป ทุกการแก้ไขจะบันทึกลงประวัติ</Alert>
      {saveError && <Alert>{saveError}</Alert>}
      <Field label="จำนวนเงินที่ขอรับ (บาท)" required htmlFor="edit-amount" error={errors.amountBaht}>
        <TextInput id="edit-amount" inputMode="numeric" value={form.amountBaht} onChange={set('amountBaht', (v) => digitsOnly(v, 7))} invalid={Boolean(errors.amountBaht)} />
      </Field>
      {detail.kind === 'WELFARE' && (
        <Field label="ระดับความเร่งด่วน" htmlFor="edit-urgency">
          <Select id="edit-urgency" value={form.urgencyCode} onChange={set('urgencyCode')}>
            {(lookups['urgency-levels'] ?? []).map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="เหตุผล / รายละเอียด" required htmlFor="edit-reason" error={errors.reason} hint={`${form.reason.trim().length}/2000 ตัวอักษร`}>
        <TextArea id="edit-reason" value={form.reason} onChange={set('reason')} maxLength={2000} className="min-h-36" invalid={Boolean(errors.reason)} />
      </Field>
      {detail.kind === 'SCHOLARSHIP' && (
        <Field label="ภาระค่าใช้จ่ายของครอบครัว" htmlFor="edit-expenses">
          <TextArea id="edit-expenses" value={form.familyExpenses} onChange={set('familyExpenses')} maxLength={1000} />
        </Field>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="ช่องทางรับเงิน" htmlFor="edit-payout">
          <Select id="edit-payout" value={form.payoutCode} onChange={set('payoutCode')}>
            {(lookups['payout-methods'] ?? []).map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="เลขบัญชี / พร้อมเพย์" required htmlFor="edit-account" error={errors.payoutAccount}>
          <TextInput id="edit-account" inputMode="numeric" value={form.payoutAccount} onChange={set('payoutAccount', (v) => v.replace(/[^\d-]/g, '').slice(0, 20))} invalid={Boolean(errors.payoutAccount)} />
        </Field>
      </div>
      <Field label="หมายเหตุการแก้ไข (ไม่บังคับ)" htmlFor="edit-note" hint="เช่น แก้เลขบัญชีที่พิมพ์ผิด">
        <TextInput id="edit-note" value={form.changeNote} onChange={set('changeNote')} maxLength={500} />
      </Field>
      <div className="flex justify-end gap-3 border-t border-outline-variant/40 pt-5">
        <Button variant="secondary" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button type="submit" loading={busy}>
          บันทึกการแก้ไข
        </Button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ ใบยืนยัน (พิมพ์ / บันทึก PDF)

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch);

/** ใบยืนยันการยื่นคำร้อง — เปิดหน้าต่างใหม่แล้วสั่งพิมพ์ (บันทึกเป็น PDF ได้จากหน้าต่างพิมพ์) */
function printSlip(detail: RequestDetail, me: Me) {
  const rows: Array<[string, string]> = [
    ['รหัสติดตาม', detail.trackingNo],
    ['ประเภทคำร้อง', detail.kind === 'SCHOLARSHIP' ? 'ใบสมัครทุนการศึกษา' : 'คำร้องขอความช่วยเหลือฉุกเฉิน'],
    ['เรื่อง', detail.scholarshipTitle ?? detail.issueLabel ?? '-'],
    ['ชื่อ-นามสกุล', me.person?.fullNameTh ?? '-'],
    ['รหัสนักศึกษา', detail.applicant.personCode ?? '-'],
    ['เบอร์โทรศัพท์', formatPhone(detail.applicant.contactPhone)],
    ['จำนวนเงินที่ขอ', formatMoney(detail.amountRequestedSatang)],
    ['จำนวนเงินที่อนุมัติ', formatMoney(detail.amountApprovedSatang)],
    ['สถานะปัจจุบัน', detail.statusLabel],
    ['วันที่ยื่น', formatDateTime(detail.createdAt)],
  ];
  const history = detail.history
    .map((h) => `<tr><td>${escapeHtml(formatDateTime(h.createdAt))}</td><td>${escapeHtml(h.toStatusLabel)}</td><td>${escapeHtml(h.note)}</td></tr>`)
    .join('');
  const html = `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>ใบยืนยันคำร้อง ${escapeHtml(detail.trackingNo)}</title>
<style>
body{font-family:'Sarabun','Noto Sans Thai',sans-serif;color:black;margin:2rem;line-height:1.6}
h1{font-size:1.25rem;margin:0}p.sub{margin:0.25rem 0 1.5rem;color:dimgray;font-size:0.8rem}
table{width:100%;border-collapse:collapse;margin-bottom:1.5rem;font-size:0.875rem}
td,th{border:1px solid silver;padding:0.375rem 0.625rem;text-align:left;vertical-align:top}
th{background:whitesmoke}td.k{width:32%;color:dimgray}
.tn{font-size:1.4rem;font-weight:700;letter-spacing:1px}
footer{font-size:0.75rem;color:gray;margin-top:2rem}
</style></head><body>
<h1>ใบยืนยันการยื่นคำร้อง</h1>
<p class="sub">ระบบทุนการศึกษาและสวัสดิการนักศึกษา สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
<p class="tn">${escapeHtml(detail.trackingNo)}</p>
<table>${rows.map(([k, v]) => `<tr><td class="k">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>
<h2 style="font-size:1rem">ประวัติสถานะ</h2>
<table><tr><th>วันที่</th><th>สถานะ</th><th>หมายเหตุ</th></tr>${history}</table>
<footer>พิมพ์เมื่อ ${escapeHtml(formatDateTime(new Date().toISOString()))} · เอกสารนี้ออกจากระบบอัตโนมัติ</footer>
</body></html>`;
  const win = window.open('', '_blank', 'width=820,height=920');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.setTimeout(() => win.print(), 400);
}
