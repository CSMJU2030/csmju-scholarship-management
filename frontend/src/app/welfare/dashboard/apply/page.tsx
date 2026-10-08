'use client';

import { ArrowLeft, ArrowRight, CalendarClock, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AttachmentPicker, uploadAll } from '@/components/attachment-picker';
import { deadlineTone } from '@/components/scholarship-card';
import { ApplicantFields, digitsOnly, initialApplicant, validateApplicant, type ApplicantForm } from '@/components/student-fields';
import { SubmittedCard } from '@/components/submitted-card';
import { ReviewSection, WizardSteps } from '@/components/wizard';
import { Alert, Button, ButtonLink, Card, Checkbox, EmptyState, ErrorState, Field, PageHeader, Select, SkeletonList, StatusBadge, TextArea, TextInput } from '@/components/ui';
import { api, ApiError, errorMessage, type Me, type RequestDetail, type Scholarship } from '@/lib/api';
import { bahtInputToSatang, daysLeftLabel, formatDate, formatMoney, formatNumber, formatPhone } from '@/lib/format';
import { useLookups } from '@/lib/lookups';
import { useAsync } from '@/lib/use-async';
import { appliedByScholarship, useMyRequests } from '@/lib/use-my-requests';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STEPS = ['ข้อมูลผู้สมัคร', 'ข้อมูลครอบครัว', 'การขอรับทุน', 'ตรวจสอบและยืนยัน'];

export default function ApplyPage() {
  return (
    <AppShell permission="request:create:own" guardUnsaved>
      {({ me }) => (
        <Suspense fallback={<SkeletonList rows={2} />}>
          <ApplyLoader me={me} />
        </Suspense>
      )}
    </AppShell>
  );
}

function ApplyLoader({ me }: { me: Me }) {
  const id = useSearchParams().get('scholarshipId') ?? '';
  const valid = UUID.test(id);
  const { data, error, reload } = useAsync(() => (valid ? api.get<Scholarship>(`/api/v1/scholarships/${id}`) : Promise.resolve(null)), [id, valid]);
  const requests = useMyRequests(me);

  if (!valid || (error instanceof ApiError && error.code === 'NOT_FOUND')) {
    return (
      <EmptyState
        title="ไม่พบประกาศทุนนี้"
        description="ลิงก์อาจไม่ถูกต้องหรือทุนถูกปิดประกาศแล้ว เลือกทุนใหม่จากรายการทุนที่เปิดรับ"
        action={<ButtonLink href="/welfare/dashboard">ไปหน้ารายการทุน</ButtonLink>}
      />
    );
  }
  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />;
  if (!data || !requests.data) return <SkeletonList rows={2} />;

  const applied = appliedByScholarship(requests.data).get(data.id);
  if (applied) {
    return (
      <EmptyState
        title="คุณสมัครทุนนี้แล้ว"
        description={`ใบสมัคร ${applied.trackingNo} อยู่ในสถานะ “${applied.label}” — หากต้องการแก้ไขข้อมูล ทำได้ที่หน้าติดตามคำร้องระหว่างรออาจารย์ที่ปรึกษาตรวจสอบ`}
        action={<ButtonLink href={`/scholarship/track?tn=${encodeURIComponent(applied.trackingNo)}`}>ดูใบสมัคร</ButtonLink>}
      />
    );
  }
  if (data.isExpired) {
    return <EmptyState title="ทุนนี้ปิดรับสมัครแล้ว" description={`ปิดรับเมื่อ ${formatDate(data.deadline, 'long')}`} action={<ButtonLink href="/welfare/dashboard">ดูทุนอื่นที่เปิดรับ</ButtonLink>} />;
  }
  return <ApplyWizard me={me} scholarship={data} />;
}

interface ApplyForm {
  nationalId: string;
  gpa: string;
  age: string;
  nationality: string;
  amountBaht: string;
  reason: string;
  familyIncomeBaht: string;
  familyStatusCode: string;
  familyExpenses: string;
  payoutCode: string;
  payoutAccount: string;
  confirm: boolean;
}

function ApplyWizard({ me, scholarship }: { me: Me; scholarship: Scholarship }) {
  const { lookups } = useLookups(['family-statuses', 'payout-methods']);
  const [step, setStep] = useState(0);
  const [applicant, setApplicant] = useState<ApplicantForm>(() => initialApplicant(me));
  const [form, setForm] = useState<ApplyForm>({
    nationalId: '',
    gpa: me.lastApplication?.gpa?.toFixed(2) ?? '',
    age: me.lastApplication?.age ? String(me.lastApplication.age) : '',
    nationality: me.lastApplication?.nationality ?? 'ไทย',
    amountBaht: String(scholarship.amountMaxSatang / 100),
    reason: '',
    familyIncomeBaht: '',
    familyStatusCode: '',
    familyExpenses: '',
    payoutCode: me.lastApplication?.payoutCode ?? '',
    payoutAccount: me.lastApplication?.payoutAccount ?? '',
    confirm: false,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ detail: RequestDetail; failed: string[] } | null>(null);

  const set = (key: keyof ApplyForm, transform?: (v: string) => string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: transform ? transform(event.target.value) : event.target.value });

  const label = (key: 'family-statuses' | 'payout-methods', code: string) => lookups[key]?.find((item) => item.code === code)?.label ?? code;

  function validateStep(index: number): Record<string, string> {
    const next: Record<string, string> = {};
    if (index === 0) {
      Object.assign(next, validateApplicant(applicant));
      const gpa = Number(form.gpa);
      if (!/^\d{13}$/.test(form.nationalId)) next.nationalId = 'กรุณากรอกเลขบัตรประชาชน 13 หลัก';
      if (!form.gpa || Number.isNaN(gpa) || gpa < 0 || gpa > 4) next.gpa = 'เกรดเฉลี่ยต้องอยู่ระหว่าง 0.00 ถึง 4.00';
      else if (scholarship.minGpa > 0 && gpa < scholarship.minGpa) next.gpa = `ทุนนี้กำหนดเกรดเฉลี่ยไม่ต่ำกว่า ${scholarship.minGpa.toFixed(2)}`;
      const age = Number(form.age);
      if (!Number.isInteger(age) || age < 15 || age > 99) next.age = 'กรุณากรอกอายุ 15–99 ปี';
    }
    if (index === 1) {
      if (!form.familyIncomeBaht) next.familyIncomeBaht = 'กรุณาระบุรายได้ครอบครัวต่อปี';
      if (!form.familyStatusCode) next.familyStatusCode = 'กรุณาเลือกสถานภาพครอบครัว';
    }
    if (index === 2) {
      const amount = bahtInputToSatang(form.amountBaht);
      if (amount < 100) next.amountBaht = 'กรุณาระบุจำนวนเงินที่ขอรับ';
      else if (amount > scholarship.amountMaxSatang) next.amountBaht = `ต้องไม่เกิน ${formatMoney(scholarship.amountMaxSatang)}`;
      if (form.reason.trim().length < 20) next.reason = 'กรุณาอธิบายเหตุผลอย่างน้อย 20 ตัวอักษร';
      if (!form.payoutCode) next.payoutCode = 'กรุณาเลือกช่องทางรับเงิน';
      if (!/^[0-9-]{6,20}$/.test(form.payoutAccount)) next.payoutAccount = 'กรุณากรอกเลขบัญชีหรือพร้อมเพย์ 6–20 หลัก';
    }
    if (index === 3 && !form.confirm) next.confirm = 'กรุณารับรองความถูกต้องของข้อมูลก่อนส่งใบสมัคร';
    return next;
  }

  function goNext() {
    const found = validateStep(step);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit() {
    // ตรวจทุกขั้นอีกครั้งก่อนส่ง — ถ้าขั้นไหนผิด พากลับไปขั้นนั้น
    for (let index = 0; index < STEPS.length; index += 1) {
      const found = validateStep(index);
      if (Object.keys(found).length) {
        setErrors(found);
        setStep(index);
        return;
      }
    }
    setBusy(true);
    setSubmitError('');
    try {
      const detail = await api.post<RequestDetail>('/api/v1/requests', {
        kind: 'SCHOLARSHIP',
        scholarshipId: scholarship.id,
        contactPhone: applicant.contactPhone,
        nationalId: form.nationalId,
        gpa: Math.round(Number(form.gpa) * 100) / 100,
        age: Number(form.age),
        nationality: form.nationality.trim() || undefined,
        amountRequestedSatang: bahtInputToSatang(form.amountBaht),
        reason: form.reason.trim(),
        familyIncomeSatang: bahtInputToSatang(form.familyIncomeBaht),
        familyStatusCode: form.familyStatusCode,
        familyExpenses: form.familyExpenses.trim() || undefined,
        payoutCode: form.payoutCode,
        payoutAccount: form.payoutAccount,
      });
      const failed = files.length ? await uploadAll(detail.id, files) : [];
      setDone({ detail, failed });
      window.scrollTo({ top: 0 });
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        setSubmitError('เซสชันหมดอายุ ข้อมูลที่กรอกยังอยู่ กรุณาเปิดพอร์ทัล CSMJU2030 ในแท็บใหม่เพื่อเข้าสู่ระบบ แล้วกลับมากดส่งอีกครั้ง');
      } else setSubmitError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  if (done) return <SubmittedCard detail={done.detail} failed={done.failed} title="ส่งใบสมัครทุนเรียบร้อย" />;

  return (
    <div className="space-y-8">
      <PageHeader title="ยื่นใบสมัครทุนการศึกษา" description="กรอกข้อมูล 4 ขั้นตอน ใช้เวลาประมาณ 5 นาที ข้อมูลโปรไฟล์จะถูกจำไว้ให้ครั้งถัดไป" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <WizardSteps steps={STEPS} current={step} onJump={setStep} />
          {submitError && <Alert>{submitError}</Alert>}
          <Card key={step} className="fade-slide-up space-y-6 p-6 md:p-8">
            <h2 className="font-display text-headline-md text-on-surface">
              <span className="text-primary-container">ขั้นที่ {step + 1}</span> · {STEPS[step]}
            </h2>

            {step === 0 && (
              <>
                <ApplicantFields me={me} value={applicant} onChange={setApplicant} errors={errors} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="เลขบัตรประชาชน" required htmlFor="nationalId" error={errors.nationalId} hint="13 หลัก ใช้ตรวจสอบสิทธิ์เท่านั้น">
                    <TextInput id="nationalId" inputMode="numeric" value={form.nationalId} onChange={set('nationalId', (v) => digitsOnly(v, 13))} autoComplete="off" invalid={Boolean(errors.nationalId)} />
                  </Field>
                  <Field
                    label="เกรดเฉลี่ยสะสม (GPAX)"
                    required
                    htmlFor="gpa"
                    error={errors.gpa}
                    hint={scholarship.minGpa > 0 ? `ทุนนี้กำหนดขั้นต่ำ ${scholarship.minGpa.toFixed(2)}` : 'ทุนนี้ไม่กำหนดเกรดขั้นต่ำ'}
                  >
                    <TextInput id="gpa" inputMode="decimal" value={form.gpa} onChange={set('gpa', (v) => v.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="เช่น 3.25" invalid={Boolean(errors.gpa)} />
                  </Field>
                  <Field label="อายุ (ปี)" required htmlFor="age" error={errors.age}>
                    <TextInput id="age" inputMode="numeric" value={form.age} onChange={set('age', (v) => digitsOnly(v, 2))} invalid={Boolean(errors.age)} />
                  </Field>
                  <Field label="สัญชาติ" htmlFor="nationality">
                    <TextInput id="nationality" value={form.nationality} onChange={set('nationality')} maxLength={30} />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="รายได้ครอบครัวต่อปี (บาท)" required htmlFor="familyIncomeBaht" error={errors.familyIncomeBaht} hint={form.familyIncomeBaht ? `≈ ${formatMoney(Math.round(bahtInputToSatang(form.familyIncomeBaht) / 12))} ต่อเดือน` : undefined}>
                    <TextInput id="familyIncomeBaht" inputMode="numeric" value={form.familyIncomeBaht} onChange={set('familyIncomeBaht', (v) => digitsOnly(v, 9))} placeholder="เช่น 120000" invalid={Boolean(errors.familyIncomeBaht)} />
                  </Field>
                  <Field label="สถานภาพครอบครัว" required htmlFor="familyStatusCode" error={errors.familyStatusCode}>
                    <Select id="familyStatusCode" value={form.familyStatusCode} onChange={set('familyStatusCode')} invalid={Boolean(errors.familyStatusCode)}>
                      <option value="">เลือกสถานภาพ</option>
                      {(lookups['family-statuses'] ?? []).map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="ภาระค่าใช้จ่าย / หนี้สินของครอบครัว" htmlFor="familyExpenses" hint={`${form.familyExpenses.length}/1000 ตัวอักษร`}>
                  <TextArea id="familyExpenses" value={form.familyExpenses} onChange={set('familyExpenses')} maxLength={1000} placeholder="เช่น ค่าเช่าบ้าน ค่ารักษาพยาบาลผู้ปกครอง จำนวนพี่น้องที่กำลังศึกษา" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="จำนวนเงินที่ขอรับ (บาท)" required htmlFor="amountBaht" error={errors.amountBaht} hint={`ไม่เกิน ${formatMoney(scholarship.amountMaxSatang)}`}>
                  <TextInput id="amountBaht" inputMode="numeric" value={form.amountBaht} onChange={set('amountBaht', (v) => digitsOnly(v, 7))} invalid={Boolean(errors.amountBaht)} />
                </Field>
                <Field label="เหตุผลและความจำเป็น" required htmlFor="reason" error={errors.reason} hint={`${form.reason.trim().length}/2000 ตัวอักษร (อย่างน้อย 20)`}>
                  <TextArea id="reason" value={form.reason} onChange={set('reason')} maxLength={2000} className="min-h-36" invalid={Boolean(errors.reason)} />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="ช่องทางรับเงิน" required htmlFor="payoutCode" error={errors.payoutCode}>
                    <Select id="payoutCode" value={form.payoutCode} onChange={set('payoutCode')} invalid={Boolean(errors.payoutCode)}>
                      <option value="">เลือกช่องทาง</option>
                      {(lookups['payout-methods'] ?? []).map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="เลขบัญชี / พร้อมเพย์" required htmlFor="payoutAccount" error={errors.payoutAccount}>
                    <TextInput id="payoutAccount" inputMode="numeric" value={form.payoutAccount} onChange={set('payoutAccount', (v) => v.replace(/[^\d-]/g, '').slice(0, 20))} invalid={Boolean(errors.payoutAccount)} />
                  </Field>
                </div>
                <AttachmentPicker files={files} onChange={setFiles} error={fileError} onError={setFileError} label="หลักฐานประกอบ เช่น ใบแสดงผลการเรียน หนังสือรับรองรายได้ (ถ้ามี)" />
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <ReviewSection
                  title="ข้อมูลผู้สมัคร"
                  onEdit={() => setStep(0)}
                  rows={[
                    ['ชื่อ-นามสกุล', me.person?.fullNameTh ?? '-'],
                    ['รหัสนักศึกษา', me.person?.personCode ?? '-'],
                    ['เบอร์โทรศัพท์', formatPhone(applicant.contactPhone)],
                    ['สาขาวิชา', me.person?.departmentName ?? '-'],
                    ['เลขบัตรประชาชน', form.nationalId ? `${form.nationalId.slice(0, 1)}-XXXX-XXXXX-${form.nationalId.slice(10, 12)}-${form.nationalId.slice(12)}` : ''],
                    ['GPAX / อายุ', `${form.gpa} / ${form.age} ปี`],
                  ]}
                />
                <ReviewSection
                  title="ข้อมูลครอบครัว"
                  onEdit={() => setStep(1)}
                  rows={[
                    ['รายได้ครอบครัวต่อปี', formatMoney(bahtInputToSatang(form.familyIncomeBaht))],
                    ['สถานภาพครอบครัว', label('family-statuses', form.familyStatusCode)],
                    ['ภาระค่าใช้จ่าย', form.familyExpenses],
                  ]}
                />
                <ReviewSection
                  title="การขอรับทุน"
                  onEdit={() => setStep(2)}
                  rows={[
                    ['จำนวนเงินที่ขอรับ', formatMoney(bahtInputToSatang(form.amountBaht))],
                    ['ช่องทางรับเงิน', `${label('payout-methods', form.payoutCode)} ${form.payoutAccount}`],
                    ['เหตุผล', form.reason],
                    ['ไฟล์แนบ', files.length ? files.map((file) => file.name).join('\n') : 'ไม่มี'],
                  ]}
                />
                <div className="space-y-2">
                  <Checkbox id="confirm" checked={form.confirm} onChange={(checked) => setForm({ ...form, confirm: checked })}>
                    ข้าพเจ้าขอรับรองว่าข้อมูลและหลักฐานที่ยื่นเป็นความจริงทุกประการ หากตรวจพบว่าเป็นเท็จ ยินยอมให้ยกเลิกสิทธิ์การรับทุน
                  </Checkbox>
                  {errors.confirm && (
                    <p className="text-label-sm text-error" role="alert">
                      {errors.confirm}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-6">
              {step > 0 ? (
                <Button variant="secondary" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" /> ย้อนกลับ
                </Button>
              ) : (
                <ButtonLink href="/welfare/dashboard" variant="secondary">
                  ยกเลิก
                </ButtonLink>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={goNext}>
                  ถัดไป <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={submit} loading={busy}>
                  ส่งใบสมัคร
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* sticky ทั้งคอลัมน์ — การ์ดทุนกับการ์ดข้อมูลส่วนตัวเลื่อนตามไปด้วยกัน ไม่ทับกัน */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="fade-slide-up stagger-1 overflow-hidden">
            <div className="brand-gradient p-6 text-white">
              <p className="text-label-sm text-white/70">ทุนที่สมัคร</p>
              <h2 className="mt-1 font-display text-headline-md leading-snug">{scholarship.title}</h2>
              <p className="mt-2 font-display text-headline-md font-extrabold">{scholarship.amountLabel}</p>
            </div>
            <dl className="space-y-3 p-6 text-body-md">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">ปิดรับ</dt>
                <dd>
                  ปิดรับ {formatDate(scholarship.deadline, 'long')} <StatusBadge tone={deadlineTone(scholarship)}>{daysLeftLabel(scholarship.daysLeft)}</StatusBadge>
                </dd>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">เกรดขั้นต่ำ</dt>
                <dd>GPA ขั้นต่ำ {scholarship.minGpa > 0 ? scholarship.minGpa.toFixed(2) : 'ไม่กำหนด'}</dd>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Users className="h-4 w-4" aria-hidden="true" />
                <dt className="sr-only">จำนวนทุน</dt>
                <dd>
                  {scholarship.quota > 0 ? `${formatNumber(scholarship.quota)} ทุน` : 'ไม่จำกัดจำนวน'} · ผู้สมัคร {formatNumber(scholarship.applicationCount)} คน
                </dd>
              </div>
              <div className="border-t border-outline-variant/40 pt-3">
                <dt className="text-label-sm text-on-surface-variant">คุณสมบัติ</dt>
                <dd className="mt-1 text-on-surface">{scholarship.criteria}</dd>
              </div>
            </dl>
          </Card>
          <Card className="fade-slide-up stagger-2 flex gap-3 p-5">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary-container" aria-hidden="true" />
            <p className="text-body-md text-on-surface-variant">ข้อมูลส่วนตัวใช้เพื่อพิจารณาทุนเท่านั้น เลขบัตรประชาชนแสดงเฉพาะเจ้าหน้าที่ผู้พิจารณา</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
