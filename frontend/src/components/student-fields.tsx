'use client';

import { BadgeCheck, TriangleAlert } from 'lucide-react';
import type { Me } from '@/lib/api';

import { Alert, Field, TextInput } from './ui';

export const digitsOnly = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

/** ข้อมูลที่ผู้ยื่นกรอกเอง — ชื่อ รหัส คณะ สาขา มาจากพอร์ทัล (standards 1.7.0 ไม่ให้ระบบย่อยเก็บเอง) */
export interface ApplicantForm {
  contactPhone: string;
}

export function initialApplicant(me: Me): ApplicantForm {
  return { contactPhone: me.lastApplication?.contactPhone ?? '' };
}

export function validateApplicant(value: ApplicantForm): Partial<Record<keyof ApplicantForm, string>> {
  return /^\d{10}$/.test(value.contactPhone) ? {} : { contactPhone: 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก' };
}

/** การ์ดตัวตนจากพอร์ทัล CSMJU2030 (แสดงอย่างเดียว แก้ที่ระบบนี้ไม่ได้) */
export function IdentityCard({ me }: { me: Me }) {
  const person = me.person;
  if (!person) {
    return (
      <Alert tone="warning">
        <span className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {me.personStatus === 'unavailable'
            ? 'ดึงข้อมูลนักศึกษาจากพอร์ทัล CSMJU2030 ไม่ได้ชั่วคราว ยังยื่นคำร้องได้ เจ้าหน้าที่จะเห็นข้อมูลของคุณเมื่อพอร์ทัลกลับมาใช้งาน'
            : 'บัญชีนี้ยังไม่ผูกกับข้อมูลนักศึกษาในพอร์ทัล CSMJU2030 เจ้าหน้าที่จะไม่เห็นชื่อและรหัสนักศึกษาของคุณ — แนะนำให้เข้าสู่ระบบพอร์ทัลด้วย MJU SSO'}
        </span>
      </Alert>
    );
  }
  const rows: Array<[string, string]> = [
    ['ชื่อ-นามสกุล', person.fullNameTh],
    ['รหัสนักศึกษา', person.personCode],
    ['คณะ', person.facultyName ?? '-'],
    ['สาขาวิชา', person.departmentName ?? '-'],
    ['หลักสูตร', person.curriculumName ?? '-'],
    ['ปีที่เข้าศึกษา', person.entryYear ? String(person.entryYear) : '-'],
  ];
  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface p-5">
      <p className="mb-4 flex items-center gap-2 text-label-md text-primary-container">
        <BadgeCheck className="h-4 w-4" aria-hidden="true" /> ข้อมูลจากพอร์ทัล CSMJU2030
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-label-sm text-on-surface-variant">{label}</dt>
            <dd className="text-body-md text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-label-sm font-normal text-on-surface-variant">ข้อมูลไม่ถูกต้อง? แจ้งแก้ไขที่พอร์ทัล CSMJU2030 หรือเจ้าหน้าที่สาขา</p>
    </div>
  );
}

/** ส่วนข้อมูลผู้ยื่นในฟอร์ม: การ์ดตัวตน + เบอร์ติดต่อกลับ */
export function ApplicantFields({
  me,
  value,
  onChange,
  errors,
}: {
  me: Me;
  value: ApplicantForm;
  onChange: (next: ApplicantForm) => void;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <div className="space-y-5">
      <IdentityCard me={me} />
      <Field label="เบอร์โทรศัพท์ติดต่อกลับ" required htmlFor="contactPhone" error={errors.contactPhone} hint="ตัวเลข 10 หลัก ไม่ต้องใส่ขีด · ใช้เฉพาะคำร้องนี้">
        <TextInput
          id="contactPhone"
          inputMode="tel"
          autoComplete="tel"
          value={value.contactPhone}
          invalid={Boolean(errors.contactPhone)}
          onChange={(event) => onChange({ ...value, contactPhone: digitsOnly(event.target.value, 10) })}
        />
      </Field>
    </div>
  );
}

/** ชื่อที่ใช้แสดง: ชื่อจากพอร์ทัล → รหัส → ส่วนหน้าอีเมล */
export function displayName(me: Me) {
  return me.person?.fullNameTh ?? me.person?.personCode ?? me.email.split('@')[0];
}

