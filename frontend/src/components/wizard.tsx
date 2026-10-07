'use client';

import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from './ui';

/** แถบขั้นตอนของฟอร์มหลายขั้น — คลิกย้อนกลับไปขั้นที่ผ่านมาแล้วได้ */
export function WizardSteps({ steps, current, onJump }: { steps: string[]; current: number; onJump: (index: number) => void }) {
  return (
    <ol className="fade-slide-up flex flex-wrap items-center gap-2" aria-label="ขั้นตอนการกรอก">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={!done}
              onClick={() => onJump(index)}
              aria-current={active ? 'step' : undefined}
              className={cx(
                'flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-label-md transition-colors',
                active && 'bg-primary-container text-white shadow-md',
                done && 'bg-primary-container/10 text-primary-container hover:bg-primary-container/20',
                !active && !done && 'bg-surface-container text-on-surface-variant',
              )}
            >
              <span
                className={cx(
                  'flex h-7 w-7 items-center justify-center rounded-full text-label-sm',
                  active ? 'bg-white/20' : done ? 'bg-primary-container text-white' : 'bg-surface-container-lowest',
                )}
                aria-hidden="true"
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </span>
              {label}
              <span className="sr-only">{done ? '(เสร็จแล้ว)' : active ? '(ขั้นปัจจุบัน)' : ''}</span>
            </button>
            {index < steps.length - 1 && <span className={cx('h-0.5 w-6', done ? 'bg-primary-container' : 'bg-outline-variant')} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

/** กล่องสรุปก่อนยืนยัน */
export function ReviewSection({ title, onEdit, rows }: { title: string; onEdit: () => void; rows: Array<[string, ReactNode]> }) {
  return (
    <section className="rounded-xl border border-outline-variant/40 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-label-md text-primary-container">{title}</h3>
        <button type="button" onClick={onEdit} className="text-label-md text-primary-container hover:underline">
          แก้ไข
        </button>
      </div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-label-sm text-on-surface-variant">{label}</dt>
            <dd className="mt-0.5 whitespace-pre-line break-words text-body-md text-on-surface">{value || '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
