"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const [currentRole, setCurrentRole] = useState('student');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // ฟังก์ชันทางลับเข้าแอดมิน (ดับเบิลคลิกที่โลโก้ MJU)
  const handleSecretAdminTrigger = () => {
    setShowAuthModal(true);
    setPassword('');
    setAuthError('');
  };

  // ฟังก์ชันตรวจสอบรหัสผ่านแอดมิน
  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '310') {
      setCurrentRole('admin');
      setShowAuthModal(false);
      router.push('/scholarship/admin'); 
    } else {
      setAuthError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const scrollToModules = () => {
    const el = document.getElementById('modulesGrid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      
      {/* Header Section */}
      <header className="bg-white border-b border-[#d8e4f1] sticky top-0 z-40 shadow-sm flex items-center justify-between px-4 md:px-10 h-20">
        
        {/* โลโก้ / ชื่อระบบ (ฝั่งซ้าย) -> ซ่อนทางเข้าหลังบ้านไว้ที่โลโก้ MJU (Double Click) */}
        <div className="flex items-center gap-3">
          <div 
            onDoubleClick={handleSecretAdminTrigger}
            title="พื้นที่สำหรับผู้ดูแลระบบ (Double Click)"
            className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#004c99] to-[#0066cc] rounded-xl flex items-center justify-center text-white font-extrabold text-base tracking-tighter shadow-md cursor-pointer hover:shadow-lg transition-all active:scale-95"
          >
            MJU
          </div>
          <div className="hidden sm:block">
            <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#00366f] leading-tight text-lg">
              ระบบทุนการศึกษา & กยศ.
            </h1>
            <p className="text-[10px] text-[#54606a] uppercase tracking-wider font-semibold">
              Scholarship & Welfare
            </p>
          </div>
        </div>

        {/* ส่วนแสดงสถานะผู้ใช้งาน (ฝั่งขวา) -> ดับเบิ้ลคลิกเพื่อไปหน้าตรวจสอบสถานะ */}
        <div 
          onDoubleClick={() => window.location.href = '/scholarship/student'}
          title="ดับเบิ้ลคลิกเพื่อไปหน้าตรวจสอบสถานะคำร้อง"
          className="flex items-center gap-4 cursor-pointer select-none group/profile"
        >
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-[#00366f] group-hover/profile:text-[#004c99] transition-colors">นักศึกษาทั่วไป</span>
            <span className="text-[10px] text-green-600 font-semibold">● Online</span>
          </div>
          <div className="relative w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-b from-white to-[#eff4ff] border border-[#cce0ff] shadow-[0_2px_10px_-2px_rgba(0,76,153,0.15)] group-hover/profile:shadow-[0_6px_15px_-2px_rgba(0,76,153,0.25)] group-hover/profile:border-[#80b3ff] transition-all duration-300 shrink-0">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-5 h-5 text-[#004c99] opacity-40 transform transition-all duration-300 group-hover/profile:scale-110 group-hover/profile:opacity-75" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 flex w-3.5 h-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full w-3.5 h-3.5 border-2 border-white bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-10 py-10 w-full flex-grow">
        
        {/* Hero Banner Section */}
        <div className="bg-gradient-to-r from-[#e6eeff] to-[#f8f9ff] rounded-3xl p-8 md:p-12 border border-[#d8e4f1] mb-10 shadow-[0px_4px_20px_rgba(0,76,153,0.08)] relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none text-[#004c99] text-[280px] font-bold leading-none">
            🎓
          </div>
          <div className="max-w-2xl relative z-10">
            <span className="inline-block px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#d8e4f1] text-[#00366f] text-xs font-bold rounded-lg mb-4 uppercase tracking-wider shadow-sm">
              กองพัฒนานักศึกษา มหาวิทยาลัยแม่โจ้
            </span>
            <h2 className="text-3xl md:text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#00366f] mb-4 leading-tight">
              ระบบบริหารจัดการทุนการศึกษา กยศ. และการช่วยเหลือนักศึกษา
            </h2>
            <p className="text-[#424751] text-base md:text-lg mb-8 leading-relaxed">
              ศูนย์กลางสารสนเทศเพื่อการบริหารจัดการทุนการศึกษา กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) ระบบสะสมชั่วโมงกิจกรรมจิตอาสาออนไลน์ และระบบคัดกรองความช่วยเหลือผู้ประสบปัญหาทางการเงิน มหาวิทยาลัยแม่โจ้
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={scrollToModules}
                className="px-6 py-3 bg-gradient-to-r from-[#004c99] to-[#0066cc] text-white font-medium rounded-xl text-sm shadow-[0_4px_12px_-2px_rgba(0,76,153,0.4)] hover:shadow-[0_6px_16px_-2px_rgba(0,76,153,0.5)] transform active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                🧭 เริ่มต้นใช้งานระบบ
              </button>
              <a 
                href="https://erp.mju.ac.th" 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-3 bg-white text-[#004c99] font-medium rounded-xl text-sm border border-[#d8e4f1] hover:bg-[#eff4ff] transform active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              >
                🔗 ระบบสารสนเทศนักศึกษา (ERP)
              </a>
            </div>
          </div>
        </div>

        {/* Modules Grid Section */}
        <div id="modulesGrid" className="mb-12 scroll-mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-[#d8e4f1]/60 pb-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#004c99] to-[#0066cc] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold bg-gradient-to-r from-[#00366f] to-[#0066cc] bg-clip-text text-transparent">
                  บริการสำหรับนักศึกษา
                </h3>
                <p className="text-xs text-[#54606a] font-medium mt-0.5">
                  ศูนย์รวมระบบสารสนเทศและบริการออนไลน์ มหาวิทยาลัยแม่โจ้
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-4 py-2 bg-white border border-[#cce0ff] text-[#004c99] rounded-2xl shadow-sm flex items-center gap-2.5 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              โหมดการใช้งาน: มุมมองนักศึกษา
            </span>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
          {/* Module 1: Scholarship -> ชี้ไปที่โฟลเดอร์ welfare/dashboard */}
<a 
  href="/welfare/dashboard"
  className="relative bg-white p-6 rounded-2xl border border-[#d8e4f1] shadow-[0px_4px_20px_rgba(0,76,153,0.04)] hover:shadow-[0px_12px_32px_rgba(0,76,153,0.15)] hover:-translate-y-1.5 hover:border-[#004c99] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
>
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004c99] to-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <div>
    <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#004c99] flex items-center justify-center mb-5 group-hover:bg-[#004c99] group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 shadow-sm transform group-hover:scale-105">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    
    <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#00366f] mb-2 group-hover:text-[#004c99] transition-colors">
        สมัครทุนการศึกษา
    </h4>
    <p className="text-sm text-[#54606a] mb-4 line-clamp-3">
      ดูรายการทุนทั้งหมดที่เปิดรับสมัครและกดส่งใบสมัครได้ทันที
    </p>
  </div>

  <div className="flex items-center text-xs font-bold text-[#004c99] gap-1 group-hover:translate-x-2 transition-transform duration-300">
    <span>ไปที่หน้าแดชบอร์ดทุน</span> <span className="text-lg leading-none">&rarr;</span>
  </div>
</a>

            {/* Module 2: Loan & Volunteer */}
            <a 
              href="/loan-volunteer"
              className="relative bg-white p-6 rounded-2xl border border-[#d8e4f1] shadow-[0px_4px_20px_rgba(0,76,153,0.04)] hover:shadow-[0px_12px_32px_rgba(0,76,153,0.15)] hover:-translate-y-1.5 hover:border-[#004c99] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004c99] to-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#004c99] flex items-center justify-center mb-5 group-hover:bg-[#004c99] group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 shadow-sm transform group-hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                
                <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#00366f] mb-2 group-hover:text-[#004c99] transition-colors">
                    กยศ. & จิตอาสา
                </h4>
                <p className="text-sm text-[#54606a] mb-4 line-clamp-3">
                  ข้อมูล กยศ. ระบบ E-Learning บทเรียนออนไลน์ 
                </p>
              </div>

              <div className="flex items-center text-xs font-bold text-[#004c99] gap-1 group-hover:translate-x-2 transition-transform duration-300">
                <span>เข้าสู่ระบบ กยศ.</span> <span className="text-lg leading-none">&rarr;</span>
              </div>
            </a>

            {/* Module 3: ERP Link */}
            <a 
              href="https://erp.mju.ac.th" 
              target="_blank" 
              rel="noreferrer"
              className="relative bg-white p-6 rounded-2xl border border-[#d8e4f1] shadow-[0px_4px_20px_rgba(0,76,153,0.04)] hover:shadow-[0px_12px_32px_rgba(0,76,153,0.15)] hover:-translate-y-1.5 hover:border-[#004c99] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004c99] to-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#004c99] flex items-center justify-center mb-5 group-hover:bg-[#004c99] group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 shadow-sm transform group-hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                
                <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#00366f] mb-2 group-hover:text-[#004c99] transition-colors">
                    ระบบสารสนเทศ (ERP)
                </h4>
                <p className="text-sm text-[#54606a] mb-4 line-clamp-3">
                  เช็คชั่วโมงกิจกรรมจิตอาสา
                </p>
              </div>

              <div className="flex items-center text-xs font-bold text-[#004c99] gap-1 group-hover:translate-x-2 transition-transform duration-300">
                <span>เปิดระบบ ERP แม่โจ้</span> <span className="text-lg leading-none">&rarr;</span>
              </div>
            </a>

            {/* Module 4: Welfare & Help */}
            <a 
              href="/welfare/form"
              className="relative bg-white p-6 rounded-2xl border border-[#d8e4f1] shadow-[0px_4px_20px_rgba(0,76,153,0.04)] hover:shadow-[0px_12px_32px_rgba(0,76,153,0.15)] hover:-translate-y-1.5 hover:border-[#004c99] transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#004c99] to-[#0066cc] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#eff4ff] text-[#004c99] flex items-center justify-center mb-5 group-hover:bg-[#004c99] group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300 shadow-sm transform group-hover:scale-105">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                
                <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-lg text-[#00366f] mb-2 group-hover:text-[#004c99] transition-colors">
                  4. ยื่นขอความช่วยเหลือ
                </h4>
                <p className="text-sm text-[#54606a] mb-4 line-clamp-3">
                  ยื่นคำร้องขอความช่วยเหลือเร่งด่วน หรือติดตามสถานะคำร้องกรณีประสบปัญหาทางการเงิน
                </p>
              </div>

              <div className="flex items-center text-xs font-bold text-[#004c99] gap-1 group-hover:translate-x-2 transition-transform duration-300">
                <span>ไปที่หน้าฟอร์มคำร้อง</span> <span className="text-lg leading-none">&rarr;</span>
              </div>
            </a>

          </div>
        </div>

        {/* Announcement Banner */}
        <div className="relative bg-gradient-to-r from-white via-[#f8fbff] to-[#eff4ff] rounded-2xl p-6 md:p-7 border border-[#d8e4f1] shadow-[0px_4px_25px_rgba(0,76,153,0.07)] hover:shadow-[0px_8px_30px_rgba(0,76,153,0.12)] transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-[#004c99] to-[#0066cc]"></div>
          <div className="flex items-center gap-4 w-full pl-2">
            <div className="relative w-13 h-13 min-w-[52px] h-13 rounded-2xl bg-[#eff4ff] flex items-center justify-center text-[#004c99] text-2xl shadow-sm border border-[#cce0ff] group-hover:scale-105 transition-transform">
              📢
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#004c99]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#004c99] text-white rounded-md uppercase tracking-wider">
                  Update
                </span>
                <h5 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base text-[#00366f]">
                  ข่าวประชาสัมพันธ์ทุนการศึกษา
                </h5>
              </div>
              <p className="text-sm text-[#54606a] mt-1">
                เปิดรับสมัครทุนการศึกษาประจำปีการศึกษา พร้อมประกาศและกำหนดการสำคัญทั้งหมด
              </p>
            </div>
          </div>
          <a 
            href="https://guide-guidance.mju.ac.th/wtms_index.aspx?&lang=th-TH" 
            target="_blank" 
            rel="noreferrer"
            className="px-6 py-3 bg-[#004c99] text-white text-xs font-bold rounded-xl hover:bg-[#00366f] hover:shadow-md active:scale-95 transition-all shrink-0 w-full md:w-auto text-center cursor-pointer shadow-sm flex items-center justify-center gap-2 group/btn"
          >
            <span>อ่านประกาศทั้งหมด</span> 
          </a>
        </div>

      </main>

      {/* Admin Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-[0px_25px_60px_rgba(0,0,0,0.25)] transform scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#004c99] to-[#0066cc]"></div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-[#eff4ff] to-[#d8e4f1] rounded-2xl flex items-center justify-center text-[#004c99] mb-5 mx-auto shadow-sm border border-[#cce0ff]">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-xl text-center text-[#00366f] mb-1">
              ยืนยันสิทธิ์ผู้ดูแลระบบ
            </h4>
            <p className="text-xs text-center text-[#54606a] mb-6">
              กรุณาป้อนรหัสผ่านเพื่อเข้าสู่ระบบ
            </p>
            
            <form onSubmit={handleLoginAdmin}>
              <div className="mb-5">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••" 
                  className={`w-full px-4 py-3.5 rounded-xl border ${
                    authError 
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/50' 
                      : 'border-[#d8e4f1] focus:border-[#004c99] focus:ring-4 focus:ring-[#004c99]/15 bg-[#f8f9ff]'
                  } focus:outline-none transition-all text-sm text-center tracking-[0.5em] font-bold text-[#00366f] placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400`}
                  autoFocus
                />
                {authError && (
                  <p className="text-rose-500 text-xs font-semibold mt-2 text-center">{authError}</p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="w-1/2 py-3 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-3 bg-gradient-to-r from-[#004c99] to-[#0066cc] text-white text-xs font-bold rounded-xl shadow-[0_4px_12px_rgba(0,76,153,0.3)] hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#d8e4f1] py-8 mt-auto text-center text-xs text-[#54606a]">
        <div className="max-w-[1280px] mx-auto px-4">
          <p className="font-medium text-[#00366f] mb-1">กองพัฒนานักศึกษา มหาวิทยาลัยแม่โจ้ (Maejo University)</p>
          <p>MIS Project - Scholarship & Welfare System</p>
          <p className="mt-4 opacity-70">Designed with Tailwind CSS &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}