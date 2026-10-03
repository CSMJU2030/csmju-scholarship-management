import type { Metadata } from 'next';
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

// ui-design-system.md ข้อ 4.1 — โหลดผ่าน next/font เท่านั้น น้ำหนักตามตาราง
const jakarta = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const notoSansThai = Noto_Sans_Thai({
  variable: '--font-noto-thai',
  subsets: ['latin', 'thai'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { default: 'ทุนการศึกษาและสวัสดิการ | CSMJU', template: '%s | ทุนการศึกษาและสวัสดิการ CSMJU' },
  description: 'ระบบทุนการศึกษาและสวัสดิการนักศึกษา สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="th" className={`${jakarta.variable} ${notoSansThai.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-on-surface">{children}</body>
    </html>
  );
}
