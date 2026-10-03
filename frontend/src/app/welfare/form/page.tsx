'use client';

import { ArrowLeft, ArrowRight, Building2, CircleHelp, HeartPulse, House, Laptop, PhoneCall, ShieldAlert, Wallet } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { AttachmentPicker, uploadAll } from '@/components/attachment-picker';
import { ApplicantFields, digitsOnly, initialApplicant, validateApplicant, type ApplicantForm } from '@/components/student-fields';
import { SubmittedCard } from '@/components/submitted-card';
import { ReviewSection, WizardSteps } from '@/components/wizard';
import { Alert, Button, ButtonLink, Card, Checkbox, cx, ErrorState, Field, PageHeader, Select, SkeletonList, TextArea, TextInput, TONE_STYLES } from '@/components/ui';
import { api, ApiError, errorMessage, type Me, type RequestDetail } from '@/lib/api';
import { bahtInputToSatang, formatMoney, formatPhone } from '@/lib/format';
import { useLookups } from '@/lib/lookups';

export default function WelfareFormPage() {
  return <AppShell permission="request:create:own" guardUnsaved>{({ me }) => <WelfareForm me={me} />}</AppShell>;
}

const STEPS = ['ข้อมูลผู้ยื่น', 'ความเดือดร้อน', 'การรับเงินและหลักฐาน', 'ตรวจสอบและยืนยัน'];

const ISSUE_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  'LIVING-COST': Wallet,
  'FAMILY-CRISIS': House,
  MEDICAL: HeartPulse,
  EQUIPMENT: Laptop,
  HOUSING: Building2,
};

interface WelfareFields {
  issueCode: string;
  urgencyCode: string;
  amountBaht: string;
  reason: string;
  payoutCode: string;
  payoutAccount: string;
  acceptTerms: boolean;
}

const EMPTY: WelfareFields = { issueCode: '', urgencyCode: '', amountBaht: '', reason: '', payoutCode: '', payoutAccount: '', acceptTerms: false };
const initialWelfare = (me: Me): WelfareFields => ({ ...EMPTY, payoutCode: me.lastApplication?.payoutCode ?? '', payoutAccount: me.lastApplication?.payoutAccount ?? '' });

function WelfareForm({ me }: { me: Me }) {
  const { lookups, error: lookupError, ready } = useLookups(['issue-types', 'urgency-levels', 'payout-methods']);
  const [step, setStep] = useState(0);
  const [applicant, setApplicant] = useState<ApplicantForm>(() => initialApplicant(me));
  const [form, setForm] = useState<WelfareFields>(() => initialWelfare(me));
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ detail: RequestDetail; failed: string[] } | null>(null);

  if (lookupError) return <ErrorState message={errorMessage(lookupError)} onRetry={() => window.location.reload()} />;
  if (!ready) return <SkeletonList rows={2} />;
  if (done) return <SubmittedCard detail={done.detail} failed={done.failed} title="ส่งคำร้องขอความช่วยเหลือเรียบร้อย" />;

  const set = (key: keyof WelfareFields, transform?: (v: string) => string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: transform ? transform(event.target.value) : event.target.value });
  const lookupLabel = (key: 'issue-types' | 'urgency-levels' | 'payout-methods', code: string) => lookups[key]?.find((item) => item.code === code)?.label ?? code;

  function validateStep(index: number) {
    const next: Record<string, string> = {};
    if (index === 0) Object.assign(next, validateApplicant(applicant));
    if (index === 1) {
      if (!form.issueCode) next.issueCode = 'กรุณาเลือกประเภทความเดือดร้อน';
      if (!form.urgencyCode) next.urgencyCode = 'กรุณาเลือกระดับความเร่งด่วน';
      if (form.reason.trim().length < 20) next.reason = 'กรุณาอธิบายสถานการณ์อย่างน้อย 20 ตัวอักษร';
      if (bahtInputToSatang(form.amountBaht) < 100) next.amountBaht = 'กรุณาระบุจำนวนเงินที่ขอรับ';
    }
    if (index === 2) {
      if (!form.payoutCode) next.payoutCode = 'กรุณาเลือกช่องทางรับเงิน';
      if (!/^[0-9-]{6,20}$/.test(form.payoutAccount)) next.payoutAccount = 'กรุณากรอกเลขบัญชีหรือพร้อมเพย์ 6–20 หลัก';
    }
    if (index === 3 && !form.acceptTerms) next.acceptTerms = 'กรุณารับรองว่าข้อมูลเป็นความจริงก่อนส่งคำร้อง';
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
        kind: 'WELFARE',
        contactPhone: applicant.contactPhone,
        issueCode: form.issueCode,
        urgencyCode: form.urgencyCode,
        amountRequestedSatang: bahtInputToSatang(form.amountBaht),
        reason: form.reason.trim(),
        payoutCode: form.payoutCode,
        payoutAccount: form.payoutAccount,
        acceptTerms: true,
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

  return (
    <div className="space-y-8">
      <PageHeader title="ขอความช่วยเหลือฉุกเฉิน" description="สำหรับนักศึกษาที่ประสบปัญหาเร่งด่วน อาจารย์ที่ปรึกษาจะตรวจสอบก่อนส่งต่อคณะกรรมการ" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <WizardSteps steps={STEPS} current={step} onJump={setStep} />
          {submitError && <Alert>{submitError}</Alert>}
          <Card key={step} className="fade-slide-up space-y-6 p-6 md:p-8">
            <h2 className="font-display text-headline-md text-on-surface">
              <span className="text-primary-container">ขั้นที่ {step + 1}</span> · {STEPS[step]}
            </h2>

            {step === 0 && <ApplicantFields me={me} value={applicant} onChange={setApplicant} errors={errors} />}

            {step === 1 && (
              <>
                <fieldset className="space-y-3">
                  <legend className="mb-3 text-label-md text-on-surface">
                    ประเภทความเดือดร้อน <span className="text-error" aria-hidden="true">*</span>
                  </legend>
                  <div id="issueCode" tabIndex={-1} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="ประเภทความเดือดร้อน">
                    {(lookups['issue-types'] ?? []).map((item) => {
                      const Icon = ISSUE_ICONS[item.code] ?? CircleHelp;
                      const selected = form.issueCode === item.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setForm({ ...form, issueCode: item.code })}
                          className={cx(
                            'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                            selected ? 'border-primary-container bg-primary-container/10 ring-1 ring-primary-container' : 'border-outline-variant/60 hover:border-primary-container',
                          )}
                        >
                          <span className={cx('rounded-lg p-2', selected ? 'bg-primary-container text-white' : 'bg-primary-container/10 text-primary-container')}>
                            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                          </span>
                          <span className="text-body-md text-on-surface">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.issueCode && (
                    <p className="text-label-sm text-error" role="alert">
                      {errors.issueCode}
                    </p>
                  )}
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="mb-3 text-label-md text-on-surface">
                    ระดับความเร่งด่วน <span className="text-error" aria-hidden="true">*</span>
                  </legend>
                  <div id="urgencyCode" tabIndex={-1} className="flex flex-wrap gap-2" role="radiogroup" aria-label="ระดับความเร่งด่วน">
                    {(lookups['urgency-levels'] ?? []).map((item) => {
                      const selected = form.urgencyCode === item.code;
                      const tone = TONE_STYLES[item.tone ?? 'neutral'] ?? TONE_STYLES.neutral;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setForm({ ...form, urgencyCode: item.code })}
                          className={cx(
                            'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-label-md transition-colors',
                            selected ? cx(tone.badge, 'border-transparent ring-2 ring-primary-container/40') : 'border-outline-variant text-on-surface-variant hover:border-primary-container',
                          )}
                        >
                          <span className={cx('h-2.5 w-2.5 rounded-full', tone.dot)} aria-hidden="true" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  {errors.urgencyCode && (
                    <p className="text-label-sm text-error" role="alert">
                      {errors.urgencyCode}
                    </p>
                  )}
                </fieldset>

                <Field label="อธิบายสถานการณ์" required htmlFor="reason" error={errors.reason} hint={`${form.reason.trim().length}/2000 ตัวอักษร (อย่างน้อย 20)`}>
                  <TextArea id="reason" value={form.reason} onChange={set('reason')} maxLength={2000} className="min-h-36" invalid={Boolean(errors.reason)} placeholder="เล่าเหตุการณ์ ผลกระทบ และสิ่งที่ต้องการให้ช่วยเหลือ" />
                </Field>
                <Field label="จำนวนเงินที่ขอรับ (บาท)" required htmlFor="amountBaht" error={errors.amountBaht}>
                  <TextInput id="amountBaht" inputMode="numeric" value={form.amountBaht} onChange={set('amountBaht', (v) => digitsOnly(v, 7))} invalid={Boolean(errors.amountBaht)} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
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
                <AttachmentPicker files={files} onChange={setFiles} error={fileError} onError={setFileError} label="หลักฐาน เช่น ใบเสร็จค่ารักษา ภาพความเสียหาย (ถ้ามี)" />
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <ReviewSection
                  title="ข้อมูลผู้ยื่น"
                  onEdit={() => setStep(0)}
                  rows={[
                    ['ชื่อ-นามสกุล', me.person?.fullNameTh ?? '-'],
                    ['รหัสนักศึกษา', me.person?.personCode ?? '-'],
                    ['เบอร์โทรศัพท์', formatPhone(applicant.contactPhone)],
                    ['สาขาวิชา', me.person?.departmentName ?? '-'],
                  ]}
                />
                <ReviewSection
                  title="ความเดือดร้อน"
                  onEdit={() => setStep(1)}
                  rows={[
                    ['ประเภท', lookupLabel('issue-types', form.issueCode)],
                    ['ความเร่งด่วน', lookupLabel('urgency-levels', form.urgencyCode)],
                    ['จำนวนเงินที่ขอรับ', formatMoney(bahtInputToSatang(form.amountBaht))],
                    ['รายละเอียด', form.reason],
                  ]}
                />
                <ReviewSection
                  title="การรับเงินและหลักฐาน"
                  onEdit={() => setStep(2)}
                  rows={[
                    ['ช่องทางรับเงิน', `${lookupLabel('payout-methods', form.payoutCode)} ${form.payoutAccount}`],
                    ['ไฟล์แนบ', files.length ? files.map((file) => file.name).join('\n') : 'ไม่มี'],
                  ]}
                />
                <div className="space-y-2">
                  <Checkbox id="acceptTerms" checked={form.acceptTerms} onChange={(checked) => setForm({ ...form, acceptTerms: checked })}>
                    ข้าพเจ้าขอรับรองว่าข้อมูลและหลักฐานที่ยื่นเป็นความจริงทุกประการ
                  </Checkbox>
                  {errors.acceptTerms && (
                    <p className="text-label-sm text-error" role="alert">
                      {errors.acceptTerms}
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
                <ButtonLink href="/" variant="secondary">
                  ยกเลิก
                </ButtonLink>
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={goNext}>
                  ถัดไป <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button onClick={submit} loading={busy}>
                  ส่งคำร้อง
                </Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="fade-slide-up stagger-1 space-y-4 p-6 lg:sticky lg:top-24">
            <span className="inline-flex rounded-lg bg-primary-container/10 p-2.5 text-primary-container">
              <ShieldAlert className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2 className="text-label-md text-on-surface">ก่อนยื่นคำร้อง</h2>
            <ul className="list-disc space-y-2 pl-5 text-body-md text-on-surface-variant">
              <li>อาจารย์ที่ปรึกษาจะตรวจสอบคำร้องก่อนส่งต่อคณะกรรมการ</li>
              <li>แนบหลักฐาน เช่น ใบเสร็จค่ารักษา หรือภาพความเสียหาย จะช่วยให้พิจารณาได้เร็วขึ้น</li>
              <li>แก้ไขหรือยกเลิกได้ที่เมนู “คำร้องของฉัน” ระหว่างรออาจารย์ที่ปรึกษา</li>
            </ul>
            <div className="flex gap-3 rounded-lg bg-error-container p-4 text-on-error-container">
              <PhoneCall className="h-5 w-5 shrink-0" aria-hidden="true" />
              <p className="text-body-md">หากเป็นเหตุฉุกเฉินที่เป็นอันตรายต่อชีวิต โทร 1669 (เจ็บป่วยฉุกเฉิน) หรือ 191 ก่อน</p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
