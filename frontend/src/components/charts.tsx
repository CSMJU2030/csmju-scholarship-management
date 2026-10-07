'use client';

import { Table2, BarChart3 } from 'lucide-react';
import { useId, useState } from 'react';
import { formatNumber } from '@/lib/format';
import { cx } from './ui';

/**
 * กราฟวาดด้วย SVG เอง (ยังไม่มี chart library ใน whitelist ของมาตรฐาน)
 * — สีตามลำดับ --color-chart-1..6 (ui-design-system.md ข้อ 3.8) · มี legend · tooltip · ตัวเลขกำกับ
 *   ลายเส้นทแยงบนชุดข้อมูลที่ 2 สำหรับตาบอดสี/พิมพ์ขาวดำ · สลับเป็นตารางได้
 */
const FILL = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5', 'fill-chart-6'];
const BG = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6'];

export interface Series {
  name: string;
  values: number[];
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((m) => value / m <= 4) ?? 10 * pow;
  return Math.ceil(value / step) * step;
}

function ViewToggle({ table, onChange }: { table: boolean; onChange: (table: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!table)}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-label-sm text-primary-container transition-colors hover:bg-primary-container/10"
      aria-pressed={table}
    >
      {table ? <BarChart3 className="h-4 w-4" aria-hidden="true" /> : <Table2 className="h-4 w-4" aria-hidden="true" />}
      {table ? 'ดูเป็นกราฟ' : 'ดูเป็นตาราง'}
    </button>
  );
}

export function Legend({ names }: { names: string[] }) {
  return (
    <ul className="flex flex-wrap gap-4" aria-label="คำอธิบายสี">
      {names.map((name, index) => (
        <li key={name} className="flex items-center gap-2 text-label-sm text-on-surface-variant">
          <span className={cx('h-3 w-3 rounded-sm', BG[index % BG.length], index === 1 && 'legend-hatch')} aria-hidden="true" />
          {name}
        </li>
      ))}
    </ul>
  );
}

/** กราฟแท่งแนวตั้งแบบกลุ่ม (เช่น จำนวนคำร้องรายเดือน แยกประเภท) */
export function GroupedColumnChart({ labels, series, title, unit = 'รายการ' }: { labels: string[]; series: Series[]; title: string; unit?: string }) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const patternId = useId().replace(/:/g, '');
  const W = 640;
  const H = 240;
  const pad = { top: 16, right: 8, bottom: 32, left: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const groupW = innerW / Math.max(labels.length, 1);
  const barGap = 2;
  const barW = Math.min(28, (groupW * 0.6 - barGap * (series.length - 1)) / series.length);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t));
  const total = series.reduce((sum, s) => sum + s.values.reduce((a, b) => a + b, 0), 0);

  return (
    <figure className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Legend names={series.map((s) => s.name)} />
        <ViewToggle table={table} onChange={setTable} />
      </div>
      {table ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-body-md">
            <caption className="sr-only">{title}</caption>
            <thead className="text-label-sm text-on-surface-variant">
              <tr>
                <th className="py-2 pr-4 font-semibold">เดือน</th>
                {series.map((s) => (
                  <th key={s.name} className="py-2 pr-4 text-right font-semibold">
                    {s.name}
                  </th>
                ))}
                <th className="py-2 text-right font-semibold">รวม</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={label} className="border-t border-outline-variant/40">
                  <td className="py-2 pr-4">{label}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-2 pr-4 text-right tabular-nums">
                      {formatNumber(s.values[i] ?? 0)}
                    </td>
                  ))}
                  <td className="py-2 text-right tabular-nums">{formatNumber(series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : total === 0 ? (
        <p className="flex h-48 items-center justify-center rounded-lg bg-surface text-body-md text-on-surface-variant">ยังไม่มีคำร้องในช่วง 6 เดือนนี้</p>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${title} — ดูตัวเลขได้จากปุ่มดูเป็นตาราง`}>
            <defs>
              <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" className="stroke-white/40" strokeWidth="2" />
              </pattern>
            </defs>
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={pad.left} x2={W - pad.right} y1={y(tick)} y2={y(tick)} className="stroke-outline-variant/50" strokeDasharray={tick === 0 ? undefined : '3 4'} />
                <text x={pad.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="central" className="fill-secondary text-[11px]">
                  {tick}
                </text>
              </g>
            ))}
            {labels.map((label, i) => {
              const gx = pad.left + groupW * i;
              const clusterW = barW * series.length + barGap * (series.length - 1);
              const start = gx + (groupW - clusterW) / 2;
              return (
                <g key={label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  {/* พื้นที่ hover ใหญ่กว่าแท่ง */}
                  <rect x={gx} y={pad.top} width={groupW} height={innerH} className={cx('fill-primary-container', hover === i ? 'opacity-[0.06]' : 'opacity-0')} />
                  {series.map((s, si) => {
                    const v = s.values[i] ?? 0;
                    const x = start + si * (barW + barGap);
                    const h = Math.max(v > 0 ? 2 : 0, (v / max) * innerH);
                    const r = Math.min(4, barW / 2, h);
                    // มุมโค้ง 4px เฉพาะด้านบน (ปลายข้อมูล) ติดฐานด้านล่าง
                    const path = h
                      ? `M${x},${y(0)} v${-(h - r)} q0,${-r} ${r},${-r} h${barW - 2 * r} q${r},0 ${r},${r} v${h - r} z`
                      : '';
                    return (
                      <g key={s.name}>
                        {path && <path d={path} className={cx(FILL[si % FILL.length], 'grow-y')} style={{ animationDelay: `${i * 60}ms` }} />}
                        {path && si === 1 && <path d={path} fill={`url(#${patternId})`} className="grow-y" style={{ animationDelay: `${i * 60}ms` }} />}
                        {v > 0 && (
                          <text x={x + barW / 2} y={y(v) - 6} textAnchor="middle" className="fill-on-surface-variant text-[11px] font-semibold">
                            {v}
                          </text>
                        )}
                      </g>
                    );
                  })}
                  <text x={gx + groupW / 2} y={H - 10} textAnchor="middle" className={cx('text-[12px]', hover === i ? 'fill-on-surface font-semibold' : 'fill-secondary')}>
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute top-2 z-10 min-w-40 -translate-x-1/2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 shadow-lg"
              style={{ left: `${((pad.left + groupW * (hover + 0.5)) / W) * 100}%` }}
              role="status"
            >
              <p className="mb-1 text-label-sm text-on-surface">{labels[hover]}</p>
              {series.map((s, si) => (
                <p key={s.name} className="flex items-center justify-between gap-4 text-label-sm font-normal text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className={cx('h-2.5 w-2.5 rounded-sm', BG[si])} aria-hidden="true" />
                    {s.name}
                  </span>
                  <span className="tabular-nums text-on-surface">
                    {formatNumber(s.values[hover] ?? 0)} {unit}
                  </span>
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** แท่งแนวนอนแบบรายการ — เรียงจากมากไปน้อย ป้ายชื่ออยู่ด้านบนแท่ง ตัวเลขชิดขวา */
export function HorizontalBars({
  items,
  color = 0,
  emptyText = 'ยังไม่มีข้อมูล',
  renderLabel,
}: {
  items: Array<{ key: string; label: string; value: number; tone?: string }>;
  color?: number;
  emptyText?: string;
  renderLabel?: (item: { key: string; label: string; value: number; tone?: string }) => React.ReactNode;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(1, ...items.map((item) => item.value));
  if (total === 0) return <p className="rounded-lg bg-surface p-6 text-center text-body-md text-on-surface-variant">{emptyText}</p>;
  return (
    <ul className="space-y-4">
      {items.map((item, index) => {
        const percent = Math.round((item.value / total) * 100);
        return (
          <li key={item.key} className="group" title={`${item.label}: ${formatNumber(item.value)} (${percent}%)`}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-body-md text-on-surface">{renderLabel ? renderLabel(item) : item.label}</span>
              <span className="shrink-0 text-label-md tabular-nums text-on-surface">
                {formatNumber(item.value)} <span className="font-normal text-secondary">· {percent}%</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
              <div
                className={cx('grow-x h-full rounded-full transition-opacity group-hover:opacity-80', BG[color % BG.length])}
                style={{ width: `${(item.value / max) * 100}%`, animationDelay: `${index * 60}ms` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** โดนัทสัดส่วน 2 ค่า (เช่น ยอดอนุมัติเทียบยอดที่ขอ) */
export function RatioRing({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" role="img" aria-label={`${label} ${percent}%`}>
      <circle cx="50" cy="50" r={r} className="fill-none stroke-surface-container" strokeWidth="10" />
      <circle
        cx="50"
        cy="50"
        r={r}
        className="fill-none stroke-chart-3 transition-[stroke-dashoffset] duration-700"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * percent) / 100}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="47" textAnchor="middle" dominantBaseline="central" className="fill-on-surface font-display text-[20px] font-bold">
        {percent}%
      </text>
      <text x="50" y="66" textAnchor="middle" className="fill-secondary text-[9px]">
        {label}
      </text>
    </svg>
  );
}
