"use client";

import React, { useState } from 'react';

export default function LoanVolunteerPage() {
  const [activeTab, setActiveTab] = useState('loan'); // 'loan', 'workflow', 'elearning', 'faq'
  const [previewImage, setPreviewImage] = useState(null);

  // ภาพกิจกรรม กยศ. และจิตอาสา ม.แม่โจ้
  const [activityImages] = useState([
    {
      id: 1,
      title: 'กิจกรรมปฐมนิเทศผู้กู้ยืมเงิน กยศ. รายใหม่ ประจำปีการศึกษา 2026',
      date: '10 ส.ค. 2026',
      category: 'ปฐมนิเทศ',
      hours: 'สะสม 3 ชม.',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop',
      description: 'ชี้แจงขั้นตอนการทำสัญญากู้ยืมเงิน และการเปิดใช้งานแอปพลิเคชัน กยศ. Connect'
    },
    {
      id: 2,
      title: 'โครงการจิตอาสา ม.แม่โจ้ พัฒนาสิ่งแวดล้อมและบำเพ็ญประโยชน์',
      date: '24 ส.ค. 2026',
      category: 'จิตอาสา',
      hours: 'สะสม 6 ชม.',
      imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1000&auto=format&fit=crop',
      description: 'ร่วมกันทำความสะอาดและปรับปรุงภูมิทัศน์รอบมหาวิทยาลัยเพื่อสะสมชั่วโมงจิตอาสา'
    },
    {
      id: 3,
      title: 'อบรมเสริมสร้างทักษะทางการเงินและการวางแผนปลดหนี้ (SET Financial)',
      date: '5 ก.ย. 2026',
      category: 'อบรมความรู้',
      hours: 'สะสม 3 ชม.',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop',
      description: 'บรรยายพิเศษเรื่องวินัยทางการเงิน การออมเงิน และสิทธิประโยชน์ของผู้กู้ยืม'
    },
    {
      id: 4,
      title: 'กิจกรรมบริจาคโลหิตร่วมใจ ช่วยเหลือเพื่อนมนุษย์ กองพัฒนานักศึกษา',
      date: '18 ก.ย. 2026',
      category: 'บริจาคโลหิต',
      hours: 'สะสม 6 ชม.',
      imageUrl: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=1000&auto=format&fit=crop',
      description: 'กิจกรรมบริจาคโลหิตเคลื่อนที่ ณ อาคารศูนย์กีฬากาญจนาภิเษก มหาวิทยาลัยแม่โจ้'
    }
  ]);

  // ลำดับขั้นตอนผังกระบวนการกู้ยืมจริง 4 สเต็ป
  const loanSteps = [
    {
      step: '01',
      title: 'ยื่นคำขอกู้ยืมในระบบ DSL',
      sub: 'ระบบออนไลน์ กยศ.',
      icon: 'fa-solid fa-file-signature',
      desc: 'เข้าสู่ระบบ DSL หรือแอป กยศ. Connect เพื่อกรอกข้อมูลผู้กู้ ผู้ค้ำประกัน และอัปโหลดหนังสือรับรองรายได้ (กยศ.102)'
    },
    {
      step: '02',
      title: 'ตรวจสอบสิทธิ์ & สถานศึกษาอนุมัติ',
      sub: 'กองพัฒนานักศึกษา ม.แม่โจ้',
      icon: 'fa-solid fa-user-check',
      desc: 'เจ้าหน้าที่ตรวจสอบคุณสมบัติและเกณฑ์รายได้ พร้อมประกาศรายชื่อผู้มีสิทธิ์กู้ยืมประจำภาคเรียน'
    },
    {
      step: '03',
      title: 'ลงนามสัญญากู้ยืม & บันทึกค่าเล่าเรียน',
      sub: 'ระบบ DSL & ส่งเอกสาร',
      icon: 'fa-solid fa-pen-fancy',
      desc: 'ลงนามสัญญากู้ยืมเงินและแบบยืนยันเบิกเงินกู้ยืมค่าธรรมเนียมการศึกษาตามยอดที่ลงทะเบียนจริง'
    },
    {
      step: '04',
      title: 'โอนเงินค่าครองชีพ & หักลบค่าเล่าเรียน',
      sub: 'ธนาคารกรุงไทย / อิสลาม',
      icon: 'fa-solid fa-money-bill-transfer',
      desc: 'ธนาคารโอนค่าเล่าเรียนเข้ามหาวิทยาลัยโดยตรง และโอนเงินค่าครองชีพเข้าบัญชีผู้กู้ยืมทุกเดือน'
    }
  ];

  // ข้อมูลเอกสารและคู่มือดาวน์โหลดเพิ่มเติม (เชื่อมต่อไฟล์ PDF และหน้าเว็บดาวน์โหลดจริง)
  const workflowInfographics = [
    {
      id: 1,
      title: 'ขั้นตอนการยื่นกู้ยืมเงิน กยศ. และคู่มือการสมัคร',
      category: 'คู่มือ PDF',
      date: 'ม.แม่โจ้ (ฉบับสมบูรณ์)',
      fileUrl: 'https://guide-guidance.mju.ac.th/goverment/20111119104834_guide.guidance/Doc_25690404171030_598167.pdf',
      description: 'เอกสาร PDF แนะนำขั้นตอนการลงทะเบียน ขอรหัสผ่าน และยื่นคำขอกู้ยืมเงินผ่านระบบ DSL'
    },
    {
      id: 2,
      title: 'รายการเอกสารประกอบการยื่นกู้ยืมเงิน (ผู้กู้รายใหม่/เก่า)',
      category: 'รายการเอกสาร',
      date: 'กองพัฒนานักศึกษา',
      fileUrl: 'https://guide-guidance.mju.ac.th/goverment/20111119104834_guide.guidance/Doc_25650305133124_288922.pdf',
      description: 'เช็กลิสต์เอกสารที่ต้องเตรียม เช่น สำเนาบัตร หนังสือรับรองรายได้ และแบบฟอร์มยืนยันข้อมูล'
    },
    {
      id: 3,
      title: 'ศูนย์ดาวน์โหลดแบบฟอร์มทางการ กยศ. (กยศ.101 - 108)',
      category: 'หน้าเว็บดาวน์โหลด',
      date: 'studentloan.or.th',
      fileUrl: 'https://www.studentloan.or.th/th/download',
      description: 'ดาวน์โหลดหนังสือรับรองรายได้ครอบครัว (กยศ.102), หนังสือยินยอมเปิดเผยข้อมูล และสัญญากู้ยืม'
    }
  ];

  // จำลองตัวคำนวณชั่วโมงจิตอาสา
  const [volunteerHours, setVolunteerHours] = useState({ elearning: 0, publicService: 0 });
  const totalHours = Number(volunteerHours.elearning || 0) + Number(volunteerHours.publicService || 0);
  const targetHours = 36;
  const progressPercent = Math.min(Math.round((totalHours / targetHours) * 100), 100);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2f] font-sans flex flex-col justify-between selection:bg-[#004c99] selection:text-white">
      {/* Top Navbar */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-[#e2e8f0] sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#004c99] to-[#00366f] flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-900/20 hover:scale-105 transition-transform">
              MJU
            </a>
            <div>
              <h1 className="font-bold text-base md:text-lg text-[#00366f] leading-tight">ระบบกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)</h1>
              <p className="text-xs text-[#64748b]">มหาวิทยาลัยแม่โจ้ (Student Loan & Volunteer Portal)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="px-4 py-2.5 bg-[#f1f5f9] text-[#00366f] text-xs font-semibold rounded-xl hover:bg-[#e2e8f0] transition flex items-center gap-2 shadow-xs group">
              <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span> กลับหน้าหลัก
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-8 w-full flex-grow">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-[#004c99] via-[#00366f] to-[#0a192f] rounded-3xl p-6 md:p-10 text-white mb-8 shadow-xl shadow-blue-950/10 relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none text-[220px] select-none">
            🎓
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3.5 py-1 bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold rounded-full mb-3 tracking-wide border border-white/20">
              STUDENT LOAN PORTAL (กยศ. แม่โจ้)
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3 tracking-tight font-heading">
              ศูนย์บริการข้อมูลและลิงก์ระบบ กยศ.
            </h2>
            <p className="text-sm md:text-base text-blue-100/90 leading-relaxed font-normal">
              รวบรวมช่องทางเข้าระบบ DSL, อบรม E-Learning สะสมชั่วโมงจิตอาสา, ผังการดำเนินงาน และประกาศกองทุนสำหรับนักศึกษามหาวิทยาลัยแม่โจ้
            </p>
          </div>
        </div>

        {/* Gallery Section: ภาพกิจกรรม กยศ. & จิตอาสา ม.แม่โจ้ */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-black text-[#002f61] flex items-center gap-2">
                <span>📸</span> ภาพกิจกรรม กยศ. และจิตอาสา ม.แม่โจ้
              </h3>
              <p className="text-xs text-slate-500">
                รวมภาพบรรยากาศการจัดกิจกรรม ปฐมนิเทศ และโครงการบำเพ็ญประโยชน์สะสมชั่วโมงจิตอาสา
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 bg-blue-50 text-[#004c99] border border-blue-200/80 rounded-xl text-xs font-bold">
              กิจกรรมล่าสุด 2026
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activityImages.map((act) => (
              <div
                key={act.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#004c99] transition-all flex flex-col justify-between group"
              >
                {/* รูปภาพกิจกรรม */}
                <div className="relative aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={act.imageUrl}
                    alt={act.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                    onClick={() => setPreviewImage(act.imageUrl)}
                  />

                  {/* Badge แสดงชั่วโมงและประเภท */}
                  <div className="absolute top-2 left-2 flex gap-1.5 pointer-events-none">
                    <span className="px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                      {act.category}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-600/90 text-white text-[10px] font-bold rounded-md">
                      {act.hours}
                    </span>
                  </div>

                  {/* ปุ่ม Overlay ขยายรูป */}
                  <button
                    type="button"
                    onClick={() => setPreviewImage(act.imageUrl)}
                    className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                  >
                    🔍 ดูรูปภาพ
                  </button>
                </div>

                {/* รายละเอียดกิจกรรม */}
                <div className="p-3.5 flex flex-col justify-between flex-grow">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      📅 {act.date}
                    </span>
                    <h4 className="font-bold text-xs text-[#002f61] leading-snug line-clamp-2 mb-1 group-hover:text-[#004c99] transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>กองพัฒนานักศึกษา</span>
                    <span className="text-[#004c99]">ม.แม่โจ้</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#e2e8f0] mb-8 gap-4 md:gap-8 overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setActiveTab('loan')}
            className={`pb-4 text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'loan' ? 'border-[#004c99] text-[#004c99]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}
          >
            <span>🔗</span> ลิงก์ระบบสำคัญ & เอกสาร
          </button>
          <button 
            onClick={() => setActiveTab('workflow')}
            className={`pb-4 text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'workflow' ? 'border-[#004c99] text-[#004c99]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}
          >
            <span>📊</span> ผังขั้นตอนการกู้ยืม (Workflow)
          </button>
          <button 
            onClick={() => setActiveTab('elearning')}
            className={`pb-4 text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'elearning' ? 'border-[#004c99] text-[#004c99]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}
          >
            <span>📚</span> E-Learning & คำนวณจิตอาสา
          </button>
          <button 
            onClick={() => setActiveTab('faq')}
            className={`pb-4 text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${activeTab === 'faq' ? 'border-[#004c99] text-[#004c99]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}
          >
            <span>❓</span> คำถามที่พบบ่อย (FAQ)
          </button>
        </div>

        {/* Tab 1: Official Links & Documents */}
        {activeTab === 'loan' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm">
              <div className="mb-6 pb-4 border-b border-[#f1f5f9]">
                <h3 className="font-bold text-lg md:text-xl text-[#00366f]">ระบบสารสนเทศและช่องทางติดต่อหลัก กยศ.</h3>
                <p className="text-xs text-[#64748b] mt-0.5">คลิกเข้าสู่ระบบภายนอก หรือดาวน์โหลดแบบฟอร์มเอกสารที่จำเป็น</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                
                {/* 1. ระบบ DSL */}
                <a 
                  href="https://wsa.dsl.studentloan.or.th/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white hover:border-[#004c99] hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#004c99] text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
                      💻
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-[#00366f] group-hover:text-[#004c99]">ระบบกู้ยืม DSL</h4>
                        <span className="px-1.5 py-0.2 bg-blue-100 text-[#004c99] text-[10px] font-bold rounded">ระบบหลัก</span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-0.5">ยื่นกู้และบันทึกค่าเล่าเรียนออนไลน์</p>
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] text-[#004c99] flex items-center justify-center group-hover:bg-[#004c99] group-hover:text-white transition-all">&rarr;</span>
                </a>

                {/* 2. เว็บไซต์ทางการ กยศ. */}
                <a 
                  href="https://www.studentloan.or.th/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 rounded-2xl border border-[#e2e8f0] bg-[#fafbff] hover:bg-blue-50/50 hover:border-[#004c99] hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#004c99] flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform">
                      🌐
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00366f] group-hover:text-[#004c99]">เว็บไซต์หลัก กยศ.</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">studentloan.or.th</p>
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] text-[#004c99] flex items-center justify-center group-hover:bg-[#004c99] group-hover:text-white transition-all">&rarr;</span>
                </a>

                {/* 3. เพจ กยศ. ม.แม่โจ้ */}
                <a 
                  href="https://www.facebook.com/StudentloanMaejo" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 rounded-2xl border border-[#e2e8f0] bg-[#fafbff] hover:bg-blue-50/50 hover:border-[#004c99] hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#e7f3ff] text-[#1877f2] flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform">
                      f
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00366f] group-hover:text-[#004c99]">งานทุน กยศ. ม.แม่โจ้</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">Facebook ประชาสัมพันธ์</p>
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] text-[#004c99] flex items-center justify-center group-hover:bg-[#004c99] group-hover:text-white transition-all">&rarr;</span>
                </a>

                {/* 4. กองพัฒนานักศึกษา ม.แม่โจ้ */}
                <a 
                  href="https://stu2.mju.ac.th/wtms_index.aspx?&lang=th-TH" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 rounded-2xl border border-[#e2e8f0] bg-[#fafbff] hover:bg-blue-50/50 hover:border-[#004c99] hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform">
                      🏛️
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00366f] group-hover:text-[#004c99]">กองพัฒนานักศึกษา แม่โจ้</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">studentaffairs.mju.ac.th</p>
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] text-[#004c99] flex items-center justify-center group-hover:bg-[#004c99] group-hover:text-white transition-all">&rarr;</span>
                </a>

                {/* 5. คู่มือและแบบฟอร์มรับรองรายได้ กยศ. 102 */}
                <a 
                  href="https://www.studentloan.or.th/th/download" 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-5 rounded-2xl border border-[#e2e8f0] bg-[#fafbff] hover:bg-emerald-50/50 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl shrink-0 group-hover:scale-105 transition-transform">
                      📄
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00366f] group-hover:text-emerald-700">แบบฟอร์มเอกสาร กยศ.</h4>
                      <p className="text-xs text-[#64748b] mt-0.5">หนังสือรับรองรายได้ (กยศ.102)</p>
                    </div>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">&rarr;</span>
                </a>

                {/* 6. แอปพลิเคชัน กยศ. Connect */}
                <div className="p-5 rounded-2xl border border-[#e2e8f0] bg-[#fafbff] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl shrink-0">
                      📱
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#00366f]">แอป กยศ. Connect</h4>
                      <div className="flex gap-2 mt-1">
                        <a href="https://apps.apple.com/th/app/%E0%B8%81%E0%B8%A2%E0%B8%81-connect/id1504543787" target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 font-bold hover:underline">iOS</a>
                        <span className="text-slate-300">•</span>
                        <a href="https://play.google.com/store/apps/details?id=com.ktb.dsl.studentloan" target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 font-bold hover:underline">Android</a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Workflow Diagram & Infographics */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            
            {/* ผังขั้นตอน 4 สเต็ปหลัก (Interactive Flowchart Card) */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm">
              <div className="mb-8 pb-4 border-b border-[#f1f5f9]">
                <span className="inline-block px-3 py-1 bg-blue-50 text-[#004c99] border border-blue-200 rounded-lg text-[11px] font-bold mb-2">
                  LOAN PROCESS WORKFLOW
                </span>
                <h3 className="font-bold text-lg md:text-2xl text-[#00366f]">4 ขั้นตอนหลักการกู้ยืม กยศ. มหาวิทยาลัยแม่โจ้</h3>
                <p className="text-xs text-[#64748b] mt-1">ลำดับกระบวนการสำหรับผู้กู้ยืมรายเก่าและรายใหม่ ตั้งแต่ยื่นแบบคำร้องจนถึงได้รับเงินจัดสรร</p>
              </div>

              {/* Grid 4 ขั้นตอน */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
                {loanSteps.map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-b from-[#f8faff] to-white p-6 rounded-2xl border border-slate-200 relative flex flex-col justify-between hover:border-[#004c99] hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="w-10 h-10 rounded-xl bg-[#004c99] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                          {item.step}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">ขั้นตอนที่ {idx + 1}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#002f61] mb-1 leading-snug">{item.title}</h4>
                      <span className="inline-block text-[11px] text-[#004c99] font-semibold mb-3">{item.sub}</span>
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-600 font-bold">
                      <span>✓ ตรวจสอบผ่านระบบ</span>
                      <i className="fa-solid fa-arrow-right text-slate-300"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ส่วนแสดงเอกสารและคู่มือดาวน์โหลดเพิ่มเติม */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm">
              <div className="mb-6 pb-4 border-b border-[#f1f5f9]">
                <h3 className="font-bold text-lg text-[#00366f]">เอกสารและคู่มือดาวน์โหลดเพิ่มเติม</h3>
                <p className="text-xs text-[#64748b] mt-0.5">คลิกเพื่อเปิดอ่านไฟล์ PDF คู่มือ หรือเข้าสู่หน้าดาวน์โหลดแบบฟอร์มทางการ</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {workflowInfographics.map((info) => (
                  <div key={info.id} className="p-5 rounded-2xl border border-slate-200 bg-[#f8faff] flex flex-col justify-between hover:bg-white hover:border-[#004c99] hover:shadow-md transition-all group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-[#004c99] rounded text-[10px] font-bold">
                          {info.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{info.date}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#002f61] mb-2 leading-snug group-hover:text-[#004c99] transition-colors">
                        {info.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">{info.description}</p>
                    </div>

                    <a
                      href={info.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-[#004c99] hover:bg-[#00366f] text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-xs active:scale-95"
                    >
                      <span>เปิดเอกสาร / ดาวน์โหลด</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: E-Learning & Volunteer Hour Calculator */}
        {activeTab === 'elearning' && (
          <div className="space-y-6">
            
            {/* Hour Progress Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-lg text-[#00366f]">คำนวณและตรวจสอบชั่วโมงจิตอาสา (กยศ.)</h3>
                  <p className="text-xs text-slate-500 mt-1">เกณฑ์ขั้นต่ำตามระเบียบกองทุน: ผู้กู้ยืมต้องสะสมชั่วโมงจิตอาสาไม่น้อยกว่า 36 ชั่วโมง/ปีการศึกษา</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-[#004c99]">{totalHours}</span>
                  <span className="text-xs font-bold text-slate-400">/ 36 ชั่วโมง</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className={progressPercent >= 100 ? 'text-emerald-600' : 'text-[#004c99]'}>
                    {progressPercent >= 100 ? '🎉 สะสมชั่วโมงครบถ้วนแล้ว' : `สะสมไปแล้ว ${progressPercent}%`}
                  </span>
                  <span className="text-slate-400">เป้าหมาย 36 ชม.</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${progressPercent >= 100 ? 'bg-emerald-500' : 'bg-[#004c99]'}`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Input Simulator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-[#00366f] mb-1.5">ชั่วโมงจาก SET e-Learning (สูงสุดไม่เกินเกณฑ์)</label>
                  <input
                    type="number"
                    min="0"
                    max="36"
                    value={volunteerHours.elearning || ''}
                    onChange={(e) => setVolunteerHours({...volunteerHours, elearning: Number(e.target.value)})}
                    placeholder="กรอกจำนวนชั่วโมงอบรมออนไลน์ เช่น 15"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-[#004c99]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#00366f] mb-1.5">ชั่วโมงกิจกรรมบำเพ็ญประโยชน์/จิตอาสาภายนอก</label>
                  <input
                    type="number"
                    min="0"
                    max="36"
                    value={volunteerHours.publicService || ''}
                    onChange={(e) => setVolunteerHours({...volunteerHours, publicService: Number(e.target.value)})}
                    placeholder="กรอกจำนวนชั่วโมงจิตอาสาทั่วไป เช่น 21"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-[#004c99]"
                  />
                </div>
              </div>
            </div>

            {/* Direct Links to SET e-Learning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 md:p-8 rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#004c99] text-white flex items-center justify-center text-xl mb-4 shadow-sm">
                    🎓
                  </div>
                  <h4 className="font-bold text-lg text-[#00366f] mb-2">SET e-Learning สำหรับผู้กู้ยืม กยศ.</h4>
                  <p className="text-xs text-[#64748b] leading-relaxed mb-6">
                    หลักสูตรการเงินออนไลน์ของตลาดหลักทรัพย์แห่งประเทศไทย (SET) เรียนฟรี มีใบประกาศนียบัตรนำไปนับชั่วโมงจิตอาสาได้โดยตรง
                  </p>
                </div>
                <a 
                  href="https://elearning.set.or.th/SETStudentLoan" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3 bg-[#004c99] hover:bg-[#00366f] text-white text-xs font-bold rounded-xl text-center shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบ SET e-Learning</span>
                  <span>&rarr;</span>
                </a>
              </div>

              <div className="p-6 md:p-8 rounded-3xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl mb-4">
                    📋
                  </div>
                  <h4 className="font-bold text-lg text-[#00366f] mb-2">แบบฟอร์มบันทึกจิตอาสา ม.แม่โจ้</h4>
                  <p className="text-xs text-[#64748b] leading-relaxed mb-6">
                    ดาวน์โหลดสมุดหรือแบบฟอร์มรับรองการทำกิจกรรมจิตอาสา เพื่อให้อาจารย์หรือหน่วยงานผู้จัดกิจกรรมลงนามรับรอง
                  </p>
                </div>
                <a 
                  href="https://erp.mju.ac.th/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3 bg-white border border-slate-300 hover:border-[#004c99] text-[#00366f] text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-2"
                >
                  <span>ตรวจสอบแบบฟอร์มจิตอาสา</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: FAQ */}
        {activeTab === 'faq' && (
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e2e8f0] shadow-sm space-y-4">
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-[#00366f]">คำถามที่พบบ่อยเกี่ยวกับการกู้ยืม กยศ.</h3>
              <p className="text-xs text-slate-500">ข้อควรทราบและคำแนะนำเบื้องต้นสำหรับผู้กู้ยืม มหาวิทยาลัยแม่โจ้</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-[#00366f] mb-1">Q: ผู้กู้ยืมรายเก่าต้องลงทะเบียนขอรับการจัดสรรเงินทุกภาคเรียนหรือไม่?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">A: ผู้กู้ยืมจะต้องเข้าไปบันทึกค่าเล่าเรียนและยืนยันแบบเบิกเงินกู้ยืมผ่านระบบ DSL ทุกภาคการศึกษาตามปฏิทินที่มหาวิทยาลัยกำหนด</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-[#00366f] mb-1">Q: หนังสือรับรองรายได้ครอบครัว (กยศ.102) ใครเป็นผู้ลงนามได้บ้าง?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">A: ข้าราชการประจำหรือข้าราชการบำนาญ, เจ้าหน้าที่รัฐ, ผู้ใหญ่บ้าน, กำนัน หรือสมาชิก อบต./เทศบาล พร้อมแนบสำเนาบัตรประจำตัวเจ้าหน้าที่รัฐของผู้รับรอง</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-[#00366f] mb-1">Q: เงินค่าครองชีพรายเดือนจะโอนเข้าบัญชีช่วงไหน?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">A: เงินค่าครองชีพจะถูกโอนตรงเข้าบัญชีธนาคารกรุงไทยหรืออิสลามของผู้กู้ยืม หลังจากมหาวิทยาลัยยืนยันแบบเบิกเงินเรียบร้อยแล้ว โดยปกติจะโอนทุกๆ วันที่ 5 ของเดือน</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center text-xs transition cursor-pointer z-10"
            >
              ✕
            </button>
            <img 
              src={previewImage} 
              alt="พรีวิวผังงานหรือภาพกิจกรรม" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-6 text-center text-xs text-[#64748b]">
        <p>กองพัฒนานักศึกษา มหาวิทยาลัยแม่โจ้ (Student Loan & E-Learning Portal &copy; 2026)</p>
      </footer>
    </div>
  );
}