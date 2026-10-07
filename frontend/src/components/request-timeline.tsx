'use client';

import { Check, X } from 'lucide-react';
import type { RequestDetail, RequestSummary } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { cx, StatusBadge } from './ui';

/** ลำดับขั้นของคำร้อง (ตรงกับ request-statuses ใน backend) */
const FLOW = [
  { code: 'PENDING_ADVISOR', label: 'ยื่นคำร้อง', hint: 'อาจารย์ที่ปรึกษาตรวจสอบ' },
  { code: 'UNDER_REVIEW', label: 'คณะกรรมการพิจารณา', hint: 'ตรวจคุณสมบัติและหลักฐาน' },
  { code: 'PRE_APPROVED', label: 'อนุมัติขั้นต้น', hint: 'รอเบิกจ่าย' },
  { code: 'APPROVED', label: 'อนุมัติ', hint: 'โอนเงินตามช่องทางที่แจ้ง' },
] as const;

const TERMINAL: Record<string, string> = { REJECTED: 'ไม่ผ่านการพิจารณา', CANCELLED: 'ยกเลิกคำร้อง' };

type History = RequestDetail['history'];

interface Step {
  code: string;
  label: string;
  hint: string;
  state: 'done' | 'current' | 'upcoming' | 'stopped';
  at?: string;
}

/** คำนวณขั้นของไทม์ไลน์จากสถานะปัจจุบัน (+ ประวัติถ้ามี เพื่อรู้ว่าหยุดที่ขั้นไหน) */
export function buildSteps(statusCode: string, history: History = [], createdAt?: string): Step[] {
  const reachedAt = new Map<string, string>();
  for (const entry of history) if (!reachedAt.has(entry.toStatusCode)) reachedAt.set(entry.toStatusCode, entry.createdAt);
  if (createdAt && !reachedAt.has('PENDING_ADVISOR')) reachedAt.set('PENDING_ADVISOR', createdAt);

  const terminal = TERMINAL[statusCode];
  let currentIndex = FLOW.findIndex((step) => step.code === statusCode);
  if (terminal) {
    // หยุดหลังขั้นสุดท้ายที่เคยไปถึง (ดูจากประวัติ) — ขั้นถัดไปแสดงเป็นจุดหยุดสีแดง
    const reached = FLOW.map((step, index) => (reachedAt.has(step.code) ? index : -1)).filter((i) => i >= 0);
    const last = reached.length ? Math.max(...reached) : 0;
    const done = FLOW.slice(0, last + 1).map((step): Step => ({ ...step, state: 'done', at: reachedAt.get(step.code) }));
    return [...done, { code: statusCode, label: terminal, hint: '', state: 'stopped', at: reachedAt.get(statusCode) }];
  }
  if (currentIndex < 0) currentIndex = 0;
  return FLOW.map((step, index): Step => ({
    ...step,
    state: statusCode === 'APPROVED' || index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
    at: reachedAt.get(step.code),
  }));
}

/** ไทม์ไลน์แนวนอน · compact = จุดเล็กสำหรับการ์ดรายการ */
export function StatusStepper({
  item,
  history,
  compact,
}: {
  item: Pick<RequestSummary, 'statusCode' | 'createdAt' | 'statusLabel'>;
  history?: History;
  compact?: boolean;
}) {
  const steps = buildSteps(item.statusCode, history, item.createdAt);
  return (
    <ol className="flex w-full items-start" aria-label={`ความคืบหน้าคำร้อง: ${item.statusLabel}`}>
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const dot =
          step.state === 'done'
            ? 'bg-primary-container text-white border-primary-container'
            : step.state === 'current'
              ? 'bg-surface-container-lowest text-primary-container border-primary-container ring-4 ring-primary-container/15'
              : step.state === 'stopped'
                ? 'bg-error text-white border-error'
                : 'bg-surface-container-lowest text-outline border-outline-variant';
        const line = step.state === 'done' && steps[index + 1]?.state !== 'upcoming' ? 'bg-primary-container' : 'bg-outline-variant/60';
        return (
          <li key={`${step.code}-${index}`} className="relative flex flex-1 flex-col items-center text-center" aria-current={step.state === 'current' ? 'step' : undefined}>
            {!last && <span className={cx('absolute top-[13px] left-1/2 h-0.5 w-full', compact && 'top-[9px]', line)} aria-hidden="true" />}
            <span
              className={cx(
                'relative z-[1] flex items-center justify-center rounded-full border-2 text-label-sm',
                compact ? 'h-5 w-5' : 'h-7 w-7',
                dot,
                step.state === 'current' && 'pulse-dot',
              )}
              aria-hidden="true"
            >
              {step.state === 'done' ? (
                <Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={3} />
              ) : step.state === 'stopped' ? (
                <X className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={3} />
              ) : compact ? null : (
                index + 1
              )}
            </span>
            <span className={cx('mt-2 px-1', compact ? 'text-caption' : 'text-label-sm', step.state === 'upcoming' ? 'text-outline' : step.state === 'stopped' ? 'text-error' : 'text-on-surface')}>
              {step.label}
            </span>
            {!compact && (
              <span className="mt-0.5 px-1 text-caption text-secondary">{step.at ? formatDate(step.at) : step.state === 'current' ? 'กำลังดำเนินการ' : step.hint}</span>
            )}
            <span className="sr-only">
              {step.state === 'done' ? 'เสร็จแล้ว' : step.state === 'current' ? 'ขั้นปัจจุบัน' : step.state === 'stopped' ? 'สิ้นสุด' : 'ยังไม่ถึง'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** ประวัติสถานะแนวตั้ง (ล่าสุดอยู่บน) */
export function HistoryList({ history }: { history: History }) {
  const items = [...history].reverse();
  return (
    <ol className="relative space-y-5 border-l-2 border-outline-variant/50 pl-6">
      {items.map((entry, index) => (
        <li key={entry.id} className="relative">
          <span
            className={cx(
              'absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-surface-container-lowest',
              index === 0 ? 'bg-primary-container ring-4 ring-primary-container/15' : 'bg-outline-variant',
            )}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={entry.toStatusTone}>{entry.toStatusLabel}</StatusBadge>
            <span className="text-caption text-secondary">{formatDateTime(entry.createdAt)}</span>
            <span className="text-caption text-secondary">
              · {entry.changedByRole === 'STUDENT' ? 'ผู้ยื่น' : entry.changedByRole === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
            </span>
          </div>
          {entry.note && <p className="mt-1 whitespace-pre-line text-body-md text-on-surface-variant">{entry.note}</p>}
        </li>
      ))}
    </ol>
  );
}
