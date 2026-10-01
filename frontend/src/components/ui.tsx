'use client';

import { AlertTriangle, Inbox, Lock, X } from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

/**
 * คอมโพเนนต์กลางตาม ui-design-system.md ข้อ 7 — class คัดลอกจาก csmju-core-hub
 * (app/backoffice/_components/ui.ts, Modal.tsx, Tabs.tsx, StatusBadge.tsx) จนกว่า @csmju2030/design-system จะพร้อม
 */
export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const inputClass =
  'input-field w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-body-md text-on-surface placeholder:text-outline/70';
export const primaryButtonClass =
  'btn-gradient relative flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label-md text-white shadow-md disabled:cursor-not-allowed disabled:opacity-40';
export const secondaryButtonClass =
  'relative flex shrink-0 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-variant/50 disabled:cursor-not-allowed disabled:opacity-40';
export const tonalButtonClass =
  'relative flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-container/10 px-4 py-2.5 text-label-md text-primary-container transition-colors hover:bg-primary-container/20 disabled:cursor-not-allowed disabled:opacity-40';
export const dangerButtonClass =
  'relative flex shrink-0 items-center justify-center gap-2 rounded-lg bg-error px-4 py-2.5 text-label-md text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40';
export const cardClass =
  'overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm';
export const iconButtonClass = 'rounded-lg p-1.5 text-outline transition-colors hover:text-primary-container';
export const linkClass = 'text-label-md text-primary-container hover:underline';

// ------------------------------------------------------------------ Button

type Variant = 'primary' | 'secondary' | 'tonal' | 'danger';
const VARIANT: Record<Variant, string> = {
  primary: primaryButtonClass,
  secondary: secondaryButtonClass,
  tonal: tonalButtonClass,
  danger: dangerButtonClass,
};

export function Button({
  variant = 'primary',
  loading = false,
  disabledReason,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; disabledReason?: string }) {
  const reasonId = useId();
  const showReason = Boolean(disabled && disabledReason);
  return (
    <>
      <button
        {...rest}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-describedby={showReason ? reasonId : undefined}
        title={showReason ? disabledReason : rest.title}
        className={cx(VARIANT[variant], loading && 'btn-loading', 'min-h-11 md:min-h-0', className)}
      >
        <span className="btn-text flex items-center gap-2">{children}</span>
        <span className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      {showReason && (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      )}
    </>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
  external,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={cx(VARIANT[variant], 'min-h-11 md:min-h-0', className)}
    >
      {children}
    </a>
  );
}

// ------------------------------------------------------------------ Layout

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="fade-slide-up flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="mb-2 font-display text-[24px] font-bold leading-[1.3] text-on-surface md:text-headline-lg">{title}</h1>
        {description && <p className="text-body-md text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx(cardClass, className)}>{children}</div>;
}

export function CardHeader({ title, count, actions }: { title: ReactNode; count?: number; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/40 px-6 py-5">
      <h2 className="flex items-center gap-2 font-display text-headline-md text-on-surface">
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-surface-variant px-2.5 py-1 text-label-sm font-normal text-on-surface-variant">{count}</span>
        )}
      </h2>
      {actions}
    </div>
  );
}

/** หัว section ฝั่ง Portal: เส้นซ้าย primary-container + ลิงก์ชิดขวา */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="border-l-4 border-primary-container pl-3 font-display text-headline-md text-on-surface">{children}</h2>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  emphasis,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'fade-slide-up flex h-40 flex-col justify-between rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className={cx('rounded-lg p-2.5', emphasis ? 'bg-btn-gradient text-white' : 'bg-primary-container/10 text-primary-container')}>
          <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>
      <div>
        <p className="font-display text-[36px] font-extrabold leading-[1.2] tabular-nums text-primary-container md:text-display-lg">{value}</p>
        {hint && <p className="mt-1 text-label-sm text-secondary">{hint}</p>}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Badge / Tag

export const TONE_STYLES: Record<string, { badge: string; dot: string }> = {
  success: { badge: 'bg-success/10 text-emerald-700', dot: 'bg-success' },
  info: { badge: 'bg-primary-container/10 text-primary-container', dot: 'bg-primary-container' },
  warning: { badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  error: { badge: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  danger: { badge: 'bg-error-container text-on-error-container', dot: 'bg-error' },
  neutral: { badge: 'bg-surface-variant text-on-surface-variant', dot: 'bg-outline' },
};

export function StatusBadge({ tone, children }: { tone?: string | null; children: ReactNode }) {
  const style = TONE_STYLES[tone ?? 'neutral'] ?? TONE_STYLES.neutral;
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-label-sm', style.badge)}>
      <span className={cx('h-2 w-2 rounded-full', style.dot)} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Tag({ children, emphasis }: { children: ReactNode; emphasis?: boolean }) {
  return (
    <span
      className={cx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-label-sm',
        emphasis ? 'bg-primary-container/10 text-primary-container' : 'bg-surface-variant text-on-surface-variant',
      )}
    >
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ Tabs

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: TabItem<T>[]; active: T; onChange: (id: T) => void }) {
  return (
    <div role="tablist" className="fade-slide-up stagger-1 flex gap-1 overflow-x-auto border-b border-outline-variant/40">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cx(
              '-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-label-md transition-colors',
              selected ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cx(
                  'rounded-full px-2 py-0.5 text-label-sm',
                  selected ? 'bg-primary-container/10 text-primary-container' : 'bg-surface-variant text-on-surface-variant',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** ตัวเลือกแบบชิป (ตัวกรอง) */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.id)}
            className={cx(
              'min-h-9 rounded-full border px-3 py-1.5 text-label-md transition-colors',
              selected
                ? 'border-primary-container bg-primary-container text-white'
                : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary-container hover:text-primary-container',
            )}
          >
            {option.label}
            {option.count !== undefined && <span className="ml-1.5 tabular-nums opacity-80">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ States (ข้อ 9)

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-surface-container', className)} aria-hidden="true" />;
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="space-y-4" role="status" aria-label="กำลังโหลดข้อมูล">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={cx(cardClass, 'space-y-3 p-6')}>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
      {slow && <p className="text-center text-body-md text-on-surface-variant">กำลังโหลดข้อมูล...</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className={cx(cardClass, 'fade-slide-up flex flex-col items-center px-6 py-12 text-center')}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-outline">
        <Inbox className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h3 className="text-label-md text-on-surface">{title}</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={cx(cardClass, 'flex flex-col items-center px-6 py-12 text-center')}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-container text-on-error-container">
        <AlertTriangle className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <p className="max-w-md text-body-md text-on-surface">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          ลองอีกครั้ง
        </Button>
      )}
    </div>
  );
}

export function ForbiddenState({ message }: { message?: string }) {
  return (
    <div className={cx(cardClass, 'flex flex-col items-center px-6 py-12 text-center')}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-outline">
        <Lock className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <h3 className="text-label-md text-on-surface">ไม่มีสิทธิ์เข้าถึง</h3>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
        {message ?? 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบย่อยนี้'}
      </p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        กลับหน้าหลัก
      </ButtonLink>
    </div>
  );
}

export function Alert({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info' | 'warning'; children: ReactNode }) {
  const style = {
    error: 'bg-error-container text-on-error-container',
    success: 'bg-sso-container text-sso',
    warning: 'bg-amber-100 text-amber-800',
    info: 'bg-primary-container/10 text-primary-container',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('fade-slide-up rounded-lg px-4 py-3 text-body-md', style)}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ Form fields (ข้อ 7.2.1)

export function Field({
  label,
  required,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-label-md text-on-surface">
        {label}
        {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-label-sm font-normal text-on-surface-variant">{hint}</p>}
      {error && (
        <p className="text-label-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({ invalid, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input {...props} aria-invalid={invalid || undefined} className={cx(inputClass, invalid && 'input-error shake-anim', className)} />;
}

export function Select({ invalid, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return <select {...props} aria-invalid={invalid || undefined} className={cx(inputClass, invalid && 'input-error shake-anim', className)} />;
}

export function TextArea({ invalid, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={cx(inputClass, 'min-h-28', invalid && 'input-error shake-anim', className)}
    />
  );
}

export function Checkbox({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label htmlFor={id} className="custom-checkbox flex cursor-pointer items-start gap-3 text-body-md text-on-surface">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 shrink-0" />
      <span>{children}</span>
    </label>
  );
}

// ------------------------------------------------------------------ Modal / Drawer

/** Esc ปิดเฉพาะหน้าต่างบนสุด (เช่น กล่องยืนยันที่เปิดซ้อนบน drawer) */
const overlayStack: symbol[] = [];
function useEscape(onClose: () => void) {
  const latest = useRef(onClose);
  useEffect(() => {
    latest.current = onClose;
  });
  useEffect(() => {
    const id = Symbol('overlay');
    overlayStack.push(id);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && overlayStack[overlayStack.length - 1] === id) latest.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      overlayStack.splice(overlayStack.indexOf(id), 1);
    };
  }, []);
}

/** Modal มาตรฐาน max-w-md (ข้อ 8.3) — ใช้กับการยืนยัน/ฟอร์มสั้น */
export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const titleId = useId();
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fade-slide-up relative w-full max-w-md rounded-xl bg-surface-container-lowest p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-headline-md text-on-surface">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-variant/50 hover:text-on-surface">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-body-md text-on-surface-variant">{message}</div>
      {children}
    </Modal>
  );
}

/** Drawer ด้านขวา (ข้อ 7.1 Feedback) — ใช้กับรายละเอียดยาว ๆ แทน modal ขนาดใหญ่ */
export function Drawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  useEscape(onClose);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="drawer-in relative flex h-dvh w-full max-w-2xl flex-col bg-surface-container-lowest shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant/40 px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-headline-md text-on-surface">
              {title}
            </h2>
            {subtitle && <div className="mt-1 text-body-md text-on-surface-variant">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-variant/50 hover:text-on-surface">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/40 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function DescriptionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-label-sm text-on-surface-variant">{label}</dt>
          <dd className="mt-1 text-body-md text-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Pagination({ page, totalPages, total, onChange }: { page: number; totalPages: number; total: number; onChange: (page: number) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 px-6 py-4 text-body-md text-on-surface-variant">
      <span className="tabular-nums">
        ทั้งหมด {total.toLocaleString('th-TH')} รายการ · หน้า {page}/{Math.max(totalPages, 1)}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ก่อนหน้า
        </Button>
        <Button variant="secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          ถัดไป
        </Button>
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
      <div className="h-full rounded-full bg-primary-container transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ------------------------------------------------------------------ Toast

interface ToastItem {
  id: number;
  tone: 'success' | 'error' | 'info';
  message: string;
}
const ToastContext = createContext<(message: string, tone?: ToastItem['tone']) => void>(() => undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastItem['tone'] = 'success') => {
    const id = Date.now() + Math.random();
    setItems((list) => [...list, { id, tone, message }]);
    window.setTimeout(() => setItems((list) => list.filter((item) => item.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 md:px-0" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            className={cx(
              'toast-in pointer-events-auto rounded-lg px-4 py-3 text-body-md shadow-xl',
              item.tone === 'success' && 'bg-sso-container text-sso',
              item.tone === 'error' && 'bg-error-container text-on-error-container',
              item.tone === 'info' && 'bg-surface-container-lowest text-on-surface',
            )}
          >
            {item.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
