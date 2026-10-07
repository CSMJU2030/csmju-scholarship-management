'use client';

import { ArrowUpRight, BadgeCheck, FileSignature, Landmark, Laptop, PenLine, Smartphone, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, cx, Field, SectionTitle, Tabs, TextInput } from '@/components/ui';

type Tab = 'links' | 'workflow' | 'volunteer';

const LINKS = [
  { href: 'https://wsa.dsl.studentloan.or.th/', title: 'ระบบกู้ยืม DSL', desc: 'ยื่นกู้และบันทึกค่าเล่าเรียนออนไลน์', icon: Laptop },
  { href: 'https://www.studentloan.or.th/', title: 'เว็บไซต์หลัก กยศ.', desc: 'studentloan.or.th', icon: Landmark },
  { href: 'https://www.facebook.com/StudentloanMaejo', title: 'งานทุน กยศ. ม.แม่โจ้', desc: 'เพจประชาสัมพันธ์', icon: BadgeCheck },
  { href: 'https://stu2.mju.ac.th/wtms_index.aspx?&lang=th-TH', title: 'กองพัฒนานักศึกษา ม.แม่โจ้', desc: 'ข่าวสารและบริการนักศึกษา', icon: UserCheck },
  { href: 'https://www.studentloan.or.th/th/download', title: 'แบบฟอร์มเอกสาร กยศ.', desc: 'หนังสือรับรองรายได้ (กยศ.102) และแบบฟอร์มอื่น', icon: FileSignature },
  { href: 'https://play.google.com/store/apps/details?id=com.ktb.dsl.studentloan', title: 'แอป กยศ. Connect', desc: 'ดาวน์โหลดบน Android (มีบน iOS ด้วย)', icon: Smartphone },
];

const STEPS = [
  { title: 'ยื่นคำขอกู้ยืมในระบบ DSL', sub: 'ระบบออนไลน์ กยศ.', desc: 'กรอกข้อมูลผู้กู้ ผู้ค้ำประกัน และอัปโหลดหนังสือรับรองรายได้ (กยศ.102)', icon: FileSignature },
  { title: 'ตรวจสอบสิทธิ์และสถานศึกษาอนุมัติ', sub: 'กองพัฒนานักศึกษา ม.แม่โจ้', desc: 'เจ้าหน้าที่ตรวจสอบคุณสมบัติและเกณฑ์รายได้ แล้วประกาศรายชื่อผู้มีสิทธิ์กู้ยืม', icon: UserCheck },
  { title: 'ลงนามสัญญาและบันทึกค่าเล่าเรียน', sub: 'ระบบ DSL', desc: 'ลงนามสัญญากู้ยืมและแบบยืนยันเบิกเงินกู้ตามยอดที่ลงทะเบียนจริง', icon: PenLine },
  { title: 'รับเงินค่าครองชีพ', sub: 'ธนาคารที่กองทุนกำหนด', desc: 'ค่าเล่าเรียนโอนเข้ามหาวิทยาลัยโดยตรง ค่าครองชีพโอนเข้าบัญชีผู้กู้ทุกเดือน', icon: Landmark },
];

const DOCUMENTS = [
  { title: 'ขั้นตอนการยื่นกู้ยืมเงิน กยศ. และคู่มือการสมัคร', source: 'ม.แม่โจ้', href: 'https://guide-guidance.mju.ac.th/goverment/20111119104834_guide.guidance/Doc_25690404171030_598167.pdf' },
  { title: 'รายการเอกสารประกอบการยื่นกู้ยืมเงิน (ผู้กู้รายใหม่/รายเก่า)', source: 'กองพัฒนานักศึกษา', href: 'https://guide-guidance.mju.ac.th/goverment/20111119104834_guide.guidance/Doc_25650305133124_288922.pdf' },
  { title: 'ศูนย์ดาวน์โหลดแบบฟอร์มทางการ กยศ.', source: 'studentloan.or.th', href: 'https://www.studentloan.or.th/th/download' },
];

const TARGET_HOURS = 36;

export default function LoanVolunteerPage() {
  return (
    <AppShell requireLogin={false} title="กยศ. และจิตอาสา" description="รวมช่องทางเข้าระบบ DSL ขั้นตอนการกู้ยืม เอกสารที่ต้องใช้ และเครื่องมือคำนวณชั่วโมงจิตอาสาสำหรับผู้กู้ยืม กยศ.">
      {() => <Content />}
    </AppShell>
  );
}

function Content() {
  const [tab, setTab] = useState<Tab>('links');
  const [elearning, setElearning] = useState('');
  const [service, setService] = useState('');
  const total = Number(elearning || 0) + Number(service || 0);
  const percent = Math.min(Math.round((total / TARGET_HOURS) * 100), 100);

  return (
    <div className="space-y-6">
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'links', label: 'ลิงก์ระบบและเอกสาร', count: LINKS.length },
          { id: 'workflow', label: 'ขั้นตอนการกู้ยืม', count: STEPS.length },
          { id: 'volunteer', label: 'ชั่วโมงจิตอาสา' },
        ]}
      />

      {tab === 'links' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="group">
              <Card className="card-lift fade-slide-up flex h-full items-start gap-4 p-6 group-hover:border-primary-container">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                  <link.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label-md text-on-surface">{link.title}</span>
                  <span className="mt-1 block text-body-md text-on-surface-variant">{link.desc}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 text-outline" aria-hidden="true" />
              </Card>
            </a>
          ))}
        </div>
      )}

      {tab === 'workflow' && (
        <div className="space-y-6">
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Card className={cx('fade-slide-up h-full p-6', `stagger-${Math.min(index, 3)}`)}>
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/10 text-primary-container">
                    <step.icon className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <p className="text-label-sm text-secondary">ขั้นตอนที่ {index + 1}</p>
                  <h3 className="mt-1 text-label-md text-on-surface">{step.title}</h3>
                  <p className="text-caption text-on-surface-variant">{step.sub}</p>
                  <p className="mt-3 text-body-md text-on-surface-variant">{step.desc}</p>
                </Card>
              </li>
            ))}
          </ol>
          <section>
            <SectionTitle>เอกสารและคู่มือ</SectionTitle>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {DOCUMENTS.map((doc) => (
                <Card key={doc.href} className="flex flex-col p-6">
                  <p className="text-label-sm text-secondary">{doc.source}</p>
                  <h3 className="mt-1 text-label-md text-on-surface">{doc.title}</h3>
                  <a href={doc.href} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-4 text-label-md text-primary-container hover:underline">
                    เปิดเอกสาร <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'volunteer' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-6">
            <h2 className="font-display text-headline-md text-on-surface">คำนวณชั่วโมงจิตอาสา</h2>
            <p className="text-body-md text-on-surface-variant">ผู้กู้ยืมต้องสะสมชั่วโมงจิตอาสาไม่น้อยกว่า {TARGET_HOURS} ชั่วโมงต่อปีการศึกษา (ตรวจสอบเกณฑ์ล่าสุดกับกองทุนอีกครั้ง)</p>
            <Field label="ชั่วโมงจาก SET e-Learning" htmlFor="elearning">
              <TextInput id="elearning" inputMode="numeric" value={elearning} onChange={(e) => setElearning(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </Field>
            <Field label="ชั่วโมงกิจกรรมบำเพ็ญประโยชน์" htmlFor="service">
              <TextInput id="service" inputMode="numeric" value={service} onChange={(e) => setService(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </Field>
            <div>
              <div className="mb-2 flex justify-between text-body-md">
                <span className={percent >= 100 ? 'font-semibold text-emerald-700' : 'text-on-surface'}>
                  {percent >= 100 ? 'สะสมครบตามเกณฑ์แล้ว' : `สะสมแล้ว ${total} ชั่วโมง (${percent}%)`}
                </span>
                <span className="text-on-surface-variant">เป้าหมาย {TARGET_HOURS} ชั่วโมง</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-container" role="progressbar" aria-label="ความคืบหน้าชั่วโมงจิตอาสา" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
                <div className={cx('h-full rounded-full transition-all duration-500', percent >= 100 ? 'bg-success' : 'bg-primary-container')} style={{ width: `${percent}%` }} />
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <a href="https://elearning.set.or.th/SETStudentLoan" target="_blank" rel="noreferrer" className="group block">
              <Card className="card-lift p-6 group-hover:border-primary-container">
                <h3 className="text-label-md text-on-surface">SET e-Learning สำหรับผู้กู้ยืม กยศ.</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">หลักสูตรการเงินออนไลน์ของตลาดหลักทรัพย์แห่งประเทศไทย เรียนฟรีและนับชั่วโมงได้</p>
              </Card>
            </a>
            <a href="https://erp.mju.ac.th/" target="_blank" rel="noreferrer" className="group block">
              <Card className="card-lift p-6 group-hover:border-primary-container">
                <h3 className="text-label-md text-on-surface">บันทึกกิจกรรมจิตอาสา (ERP แม่โจ้)</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">ตรวจสอบและบันทึกชั่วโมงกิจกรรมในระบบสารสนเทศของมหาวิทยาลัย</p>
              </Card>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
