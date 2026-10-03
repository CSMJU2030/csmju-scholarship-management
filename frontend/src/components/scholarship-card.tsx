'use client';

import { CalendarClock, ChevronDown, GraduationCap, Star, Users } from 'lucide-react';
import type { Scholarship } from '@/lib/api';
import { daysLeftLabel, formatDate, formatNumber } from '@/lib/format';
import { Button, ButtonLink, cardClass, cx, ProgressBar, StatusBadge, Tag } from './ui';

export function deadlineTone(item: Scholarship) {
  return item.isExpired ? 'neutral' : item.isClosingSoon ? 'warning' : 'success';
}

export const applyHref = (id: string) => `/welfare/dashboard/apply?scholarshipId=${encodeURIComponent(id)}`;

export function FavoriteButton({ active, onToggle, title }: { active: boolean; onToggle: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? `เลิกบันทึกทุน ${title}` : `บันทึกทุน ${title}`}
      title={active ? 'เลิกบันทึก' : 'บันทึกไว้ดูภายหลัง'}
      className={cx(
        'rounded-full p-2 transition-colors',
        active ? 'bg-amber-100 text-amber-500 hover:bg-amber-200' : 'text-outline hover:bg-surface-variant/60 hover:text-amber-500',
      )}
    >
      <Star className="h-5 w-5" fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
    </button>
  );
}

/** การ์ดประกาศทุน — บันทึก (ดาว) · ขยายรายละเอียด · ความคืบหน้าจำนวนผู้สมัครเทียบโควตา · สถานะ "สมัครแล้ว" */
export function ScholarshipCard({
  item,
  favorite,
  onToggleFavorite,
  expanded,
  onToggleExpand,
  appliedStatus,
  className,
}: {
  item: Scholarship;
  favorite: boolean;
  onToggleFavorite: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  appliedStatus?: { label: string; tone: string; trackingNo: string } | null;
  className?: string;
}) {
  const quotaPercent = item.quota > 0 ? Math.round((item.applicationCount / item.quota) * 100) : 0;
  return (
    <article className={cx(cardClass, 'card-lift fade-slide-up flex flex-col p-6', className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tag emphasis>{item.typeLabel}</Tag>
          <StatusBadge tone={deadlineTone(item)}>{daysLeftLabel(item.daysLeft)}</StatusBadge>
          {appliedStatus && <StatusBadge tone={appliedStatus.tone}>สมัครแล้ว · {appliedStatus.label}</StatusBadge>}
        </div>
        <FavoriteButton active={favorite} onToggle={onToggleFavorite} title={item.title} />
      </div>
      <h3 className="font-display text-headline-md leading-snug text-on-surface">{item.title}</h3>
      <p className="mt-1 font-display text-headline-md font-extrabold text-primary-container">{item.amountLabel}</p>

      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-body-md text-on-surface-variant">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">ปิดรับ</dt>
          <dd>ปิดรับ {formatDate(item.deadline)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">เกรดเฉลี่ยขั้นต่ำ</dt>
          <dd>GPA {item.minGpa > 0 ? `≥ ${item.minGpa.toFixed(2)}` : 'ไม่กำหนด'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          <dt className="sr-only">จำนวนทุน</dt>
          <dd>{item.quota > 0 ? `${formatNumber(item.quota)} ทุน` : 'ไม่จำกัดจำนวน'}</dd>
        </div>
      </dl>

      {item.quota > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-label-sm text-on-surface-variant">
            <span>ผู้สมัครแล้ว {formatNumber(item.applicationCount)} คน</span>
            <span className="tabular-nums">{quotaPercent}% ของจำนวนทุน</span>
          </div>
          <ProgressBar value={quotaPercent} label={`ผู้สมัคร ${item.applicationCount} จาก ${item.quota} ทุน`} />
        </div>
      )}

      <p className="mt-4 text-body-md text-on-surface-variant">
        <span className="text-label-md text-on-surface">คุณสมบัติ: </span>
        {item.criteria}
      </p>
      {expanded && <p className="fade-slide-up mt-3 whitespace-pre-line rounded-lg bg-surface p-4 text-body-md text-on-surface-variant">{item.description}</p>}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-label-md text-primary-container hover:underline"
          aria-expanded={expanded}
          onClick={onToggleExpand}
        >
          {expanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียด'}
          <ChevronDown className={cx('h-4 w-4 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
        </button>
        {appliedStatus ? (
          <ButtonLink href={`/scholarship/track?tn=${encodeURIComponent(appliedStatus.trackingNo)}`} variant="secondary">
            ดูสถานะใบสมัคร
          </ButtonLink>
        ) : item.isExpired ? (
          <Button disabled disabledReason="ทุนนี้ปิดรับสมัครแล้ว">
            ปิดรับสมัครแล้ว
          </Button>
        ) : (
          <ButtonLink href={applyHref(item.id)}>สมัครทุนนี้</ButtonLink>
        )}
      </div>
    </article>
  );
}
