'use client';

import { ClipboardCheck, Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { applyHref, ScholarshipCard } from '@/components/scholarship-card';
import { Button, ButtonLink, Card, ChipGroup, EmptyState, ErrorState, PageHeader, Select, SkeletonList, TextInput } from '@/components/ui';
import { errorMessage, fetchAll, type Me, type Scholarship } from '@/lib/api';
import { useFavorites } from '@/lib/local-state';
import { useAsync } from '@/lib/use-async';
import { appliedByScholarship, useMyRequests } from '@/lib/use-my-requests';

export default function ScholarshipListPage() {
  return (
    <AppShell permission="scholarship:read">
      {({ me }) => (
        <Suspense fallback={<SkeletonList rows={3} />}>
          <ScholarshipList me={me} />
        </Suspense>
      )}
    </AppShell>
  );
}

type SortKey = 'deadline' | 'amount' | 'title' | 'popular';
type Filter = 'all' | 'open' | 'closing' | 'saved' | 'applied';

function ScholarshipList({ me }: { me: Me }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data: items, error: loadError, reload } = useAsync(() => fetchAll<Scholarship>('/api/v1/scholarships'), []);
  const requests = useMyRequests(me);
  const favorites = useFavorites(me.id);
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<SortKey>('deadline');
  const [filter, setFilter] = useState<Filter>(params.get('q') ? 'all' : 'open');
  const [expanded, setExpanded] = useState<string | null>(null);

  // ค้นหาจากแถบด้านบนขณะอยู่หน้านี้ → ใช้คำค้นใหม่ (ปรับ state ระหว่าง render ตามแนวทาง React)
  const qParam = params.get('q') ?? '';
  const [lastQ, setLastQ] = useState(qParam);
  if (qParam !== lastQ) {
    setLastQ(qParam);
    setQuery(qParam);
    setFilter('all');
  }

  // ลิงก์เดิม ?apply=<id> (เช่นจากหน้าตรวจสอบสิทธิ์รุ่นก่อน) → ไปหน้าใบสมัครแบบขั้นตอน
  const legacyApply = params.get('apply');
  useEffect(() => {
    if (legacyApply) router.replace(applyHref(legacyApply));
  }, [legacyApply, router]);

  const applied = useMemo(() => appliedByScholarship(requests.data), [requests.data]);

  const types = useMemo(() => {
    const map = new Map<string, string>();
    (items ?? []).forEach((item) => map.set(item.typeCode, item.typeLabel));
    return [...map.entries()];
  }, [items]);

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      open: list.filter((item) => !item.isExpired).length,
      closing: list.filter((item) => item.isClosingSoon).length,
      saved: list.filter((item) => favorites.ids.includes(item.id)).length,
      applied: list.filter((item) => applied.has(item.id)).length,
    };
  }, [items, favorites.ids, applied]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? [])
      .filter((item) => {
        if (filter === 'open') return !item.isExpired;
        if (filter === 'closing') return item.isClosingSoon;
        if (filter === 'saved') return favorites.ids.includes(item.id);
        if (filter === 'applied') return applied.has(item.id);
        return true;
      })
      .filter((item) => !type || item.typeCode === type)
      .filter((item) => !q || `${item.title} ${item.criteria} ${item.typeLabel} ${item.description}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'amount') return b.amountMaxSatang - a.amountMaxSatang;
        if (sort === 'title') return a.title.localeCompare(b.title, 'th');
        if (sort === 'popular') return b.applicationCount - a.applicationCount;
        // ทุนที่ปิดแล้วไปท้ายสุด
        if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
        return a.deadline.localeCompare(b.deadline);
      });
  }, [items, query, type, sort, filter, favorites.ids, applied]);

  const clearFilters = () => {
    setQuery('');
    setType('');
    setFilter('all');
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="ทุนการศึกษาที่เปิดรับสมัคร"
        description="กดดาวเพื่อบันทึกทุนที่สนใจ ดูรายละเอียด แล้วยื่นใบสมัครออนไลน์ได้ทันที"
        actions={
          <ButtonLink href="/scholarship/check" variant="secondary">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> ตรวจสอบสิทธิ์จากเกรดเฉลี่ย
          </ButtonLink>
        }
      />

      {loadError ? (
        <ErrorState message={errorMessage(loadError)} onRetry={reload} />
      ) : !items ? (
        <SkeletonList rows={3} />
      ) : (
        <>
          <Card className="fade-slide-up stagger-1 space-y-4 p-4 md:p-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_200px]">
              <label className="relative block">
                <span className="sr-only">ค้นหาทุน</span>
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-outline" aria-hidden="true" />
                <TextInput type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อทุน ประเภท หรือคุณสมบัติ" className="pl-9" />
              </label>
              <Select aria-label="ตัวกรองประเภททุน" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">ทุกประเภททุน</option>
                {types.map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </Select>
              <Select aria-label="เรียงลำดับ" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="deadline">ใกล้ปิดรับก่อน</option>
                <option value="amount">วงเงินสูงสุด</option>
                <option value="popular">ผู้สมัครมากที่สุด</option>
                <option value="title">ชื่อทุน ก–ฮ</option>
              </Select>
            </div>
            <ChipGroup<Filter>
              label="ตัวกรองทุน"
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'ทั้งหมด', count: counts.all },
                { id: 'open', label: 'เปิดรับอยู่', count: counts.open },
                { id: 'closing', label: 'ใกล้ปิดรับ', count: counts.closing },
                { id: 'saved', label: 'บันทึกไว้', count: counts.saved },
                { id: 'applied', label: 'สมัครแล้ว', count: counts.applied },
              ]}
            />
          </Card>

          {items.length === 0 ? (
            <EmptyState
              title="ยังไม่มีประกาศทุน"
              description="เมื่อเจ้าหน้าที่ประกาศทุนใหม่ รายการจะแสดงที่หน้านี้"
              action={
                <ButtonLink href="/welfare/form" variant="secondary">
                  ขอความช่วยเหลือฉุกเฉินแทน
                </ButtonLink>
              }
            />
          ) : visible.length === 0 ? (
            <EmptyState
              title={filter === 'saved' ? 'ยังไม่มีทุนที่บันทึกไว้' : 'ไม่พบทุนตามเงื่อนไข'}
              description={filter === 'saved' ? 'กดไอคอนดาวบนการ์ดทุนเพื่อบันทึกไว้ดูภายหลัง' : 'ลองเปลี่ยนคำค้นหา ประเภท หรือตัวกรอง'}
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  ล้างตัวกรอง
                </Button>
              }
            />
          ) : (
            <>
              <p className="text-body-md text-on-surface-variant" aria-live="polite">
                แสดง {visible.length} จาก {items.length} ทุน
              </p>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {visible.map((item) => (
                  <ScholarshipCard
                    key={item.id}
                    item={item}
                    favorite={favorites.has(item.id)}
                    onToggleFavorite={() => favorites.toggle(item.id)}
                    expanded={expanded === item.id}
                    onToggleExpand={() => setExpanded(expanded === item.id ? null : item.id)}
                    appliedStatus={applied.get(item.id) ?? null}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
