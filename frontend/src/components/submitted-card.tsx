'use client';

import { CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';
import type { RequestDetail } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { StatusStepper } from './request-timeline';
import { Alert, ButtonLink, Card } from './ui';

/** หน้าจอหลังยื่นคำร้องสำเร็จ: รหัสติดตาม (คัดลอกได้) + ไทม์ไลน์ขั้นถัดไป */
export function SubmittedCard({ detail, failed, title }: { detail: RequestDetail; failed: string[]; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Card className="fade-slide-up mx-auto max-w-2xl">
      <div className="brand-gradient px-8 py-10 text-center text-white">
        <CheckCircle2 className="mx-auto mb-3 h-14 w-14" strokeWidth={1.6} aria-hidden="true" />
        <h2 className="font-display text-headline-lg">{title}</h2>
        <p className="mt-2 text-body-md text-white/80">รหัสติดตามคำร้องของคุณ</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <p className="font-display text-[28px] font-extrabold tracking-wider">{detail.trackingNo}</p>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(detail.trackingNo).then(() => setCopied(true));
            }}
            className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="คัดลอกรหัสติดตาม"
          >
            <Copy className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="h-5 text-label-sm text-white/80" aria-live="polite">
          {copied ? 'คัดลอกแล้ว' : ''}
        </p>
      </div>
      <div className="space-y-6 p-8">
        <p className="text-center text-body-md text-on-surface-variant">
          ขอรับ {formatMoney(detail.amountRequestedSatang)} · สถานะ {detail.statusLabel}
        </p>
        <StatusStepper item={detail} history={detail.history} />
        {failed.length > 0 && <Alert tone="warning">อัปโหลดไฟล์ไม่สำเร็จ: {failed.join(', ')} แนบใหม่ได้ที่หน้าติดตามคำร้อง</Alert>}
        <p className="text-center text-body-md text-on-surface-variant">
          แก้ไขหรือยกเลิกคำร้องได้ระหว่างที่ยังรออาจารย์ที่ปรึกษาตรวจสอบ ระบบจะแจ้งที่กระดิ่งเมื่อสถานะเปลี่ยน
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/scholarship/track?tn=${encodeURIComponent(detail.trackingNo)}`}>ดูสถานะคำร้อง</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            กลับหน้าหลัก
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
