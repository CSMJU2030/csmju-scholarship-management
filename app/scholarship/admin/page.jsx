"use client";

import React, { useState, useEffect, useMemo } from 'react';

export default function CS_ScholarshipAdminPage() {
  // แท็บหลัก: 'welfare' (ขอความช่วยเหลือ), 'scholarship_apps' (สมัครทุน), 'scholarships_manage' (จัดการประกาศทุน)
  const [activeTab, setActiveTab] = useState('welfare');

  // 1. ประกาศทุนการศึกษาของภาควิชา
  const [scholarships, setScholarships] = useState([
    {
      id: 1,
      title: 'ทุนสนับสนุนการศึกษา ภาควิชาวิทยาการคอมพิวเตอร์ (ประจำปี 2/2026)',
      type: '🎓 ทุนภายในภาควิชา (เรียนดี / กิจกรรมเด่น)',
      amount: '5,000 บาท',
      deadline: '2026-09-30',
      criteria: 'นักศึกษา CS ทุกชั้นปี, เกรดเฉลี่ยสะสมไม่ต่ำกว่า 2.50',
      description: 'ทุนการศึกษาสำหรับนักศึกษาสาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ ที่มีความประพฤติดีและต้องการทุนสนับสนุนการเรียน'
    },
    {
      id: 2,
      title: 'ทุนศิษย์เก่า CS แม่โจ้ร่วมใจช่วยเหลือภัยทางการเงิน',
      type: '🚨 ทุนช่วยเหลือฉุกเฉิน (ภัยพิบัติ / วิกฤตกะทันหัน)',
      amount: '5,000 บาท',
      deadline: '2026-10-15',
      criteria: 'ประสบปัญหาขาดแคลนทุนทรัพย์กะทันหัน / ค่าใช้จ่ายฉุกเฉิน',
      description: 'กองทุนช่วยเหลือเร่งด่วนจากเครือข่ายศิษย์เก่าสาขาวิทยาการคอมพิวเตอร์ เพื่อบรรเทาความเดือดร้อนเบื้องต้น'
    }
  ]);

  // 2. คำร้องทั้งหมดที่ส่งมาจากทั้ง 2 ฟอร์ม
  const [allRequests, setAllRequests] = useState([
    { 
      id: 101, 
      trackingNo: 'MJU-EMG-2026-1001',
      studentId: '6704101310', 
      name: 'กุริญา ทาเทร์', 
      year: 'ชั้นปีที่ 2', 
      faculty: 'สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์',
      phone: '089-123-4567',
      requestType: 'ปัญหาภาระค่าครองชีพและค่าใช้จ่ายฉุกเฉิน', 
      urgency: 'ด่วน (Urgent)',
      amountRequested: '4,500 บาท', 
      payoutMethod: 'พร้อมเพย์: 6704101310',
      reason: 'ขาดแคลนค่าใช้จ่ายในการเดินทางและค่าอุปกรณ์การเรียนชั่วคราว', 
      attachment: 'ใบเสร็จค่าเดินทาง.pdf',
      status: 'รออาจารย์ที่ปรึกษาตรวจสอบ', 
      date: '2 ก.ย. 2026',
      source: 'welfare' // แยกประเภทเป็น ขอความช่วยเหลือ
    },
    { 
      id: 102, 
      trackingNo: 'MJU-SCH-2026-2002',
      studentId: '6704101234', 
      name: 'นายอาทิตย์ มหาวิทยาลัยแม่โจ้', 
      year: 'ชั้นปีที่ 3', 
      faculty: 'สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์',
      phone: '081-987-6543',
      requestType: 'สมัครทุน: ทุนสนับสนุนการศึกษา ภาควิชาวิทยาการคอมพิวเตอร์ (ประจำปี 2/2026)', 
      urgency: 'ปกติ (Normal)',
      amountRequested: '5,000 บาท', 
      payoutMethod: 'พร้อมเพย์ (เลขบัตร ปชช.)',
      reason: 'มีผลการเรียนเฉลี่ยสะสม 3.45 และร่วมกิจกรรมสโมสรนักศึกษาต่อเนื่อง', 
      attachment: 'Transcript_Term1.pdf',
      status: 'ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)', 
      date: '1 ก.ย. 2026',
      source: 'scholarship' // แยกประเภทเป็น ขอทุนการศึกษา
    }
  ]);

  // ตัวกรองและค้นหา
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [selectedCase, setSelectedCase] = useState(null);

  // Modal เพิ่ม/แก้ไข ทุน
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [scholarshipForm, setScholarshipForm] = useState({
    title: '',
    type: '🎓 ทุนภายในภาควิชา (เรียนดี / กิจกรรมเด่น)',
    amount: '',
    deadline: '',
    criteria: '',
    description: ''
  });

  // โหลดข้อมูลจาก LocalStorage
  useEffect(() => {
    try {
      const savedScholarships = localStorage.getItem('cs_scholarships');
      if (savedScholarships) {
        const parsed = JSON.parse(savedScholarships);
        if (Array.isArray(parsed) && parsed.length > 0) setScholarships(parsed);
      }

      const savedRequests = JSON.parse(localStorage.getItem('welfare_requests') || '[]');
      if (Array.isArray(savedRequests) && savedRequests.length > 0) {
        setAllRequests(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = savedRequests
            .filter(item => !existingIds.has(item.id))
            .map(item => ({
              ...item,
              // จัดหมวดหมู่อัตโนมัติ: ถ้าชื่อขึ้นต้นด้วย "สมัครทุน" ให้เข้าหมวดทุน นอกนั้นถือเป็นเคสช่วยเหลือความเดือดร้อน
              source: item.source || (String(item.requestType || '').includes('สมัครทุน') ? 'scholarship' : 'welfare')
            }));
          return [...newItems, ...prev];
        });
      }
    } catch (e) {
      console.error("Failed to load requests", e);
    }
  }, []);

  // ฟังก์ชันแยกข้อมูลระหว่าง "ขอความช่วยเหลือ" กับ "สมัครทุน"
  const welfareList = useMemo(() => {
    return allRequests.filter(item => item.source === 'welfare' || !String(item.requestType || '').includes('สมัครทุน'));
  }, [allRequests]);

  const scholarshipAppList = useMemo(() => {
    return allRequests.filter(item => item.source === 'scholarship' || String(item.requestType || '').includes('สมัครทุน'));
  }, [allRequests]);

  // อัปเดตสถานะ
  const handleStatusChange = (appId, newStatus) => {
    setAllRequests(prev => {
      const updated = prev.map(app => (app.id === appId ? { ...app, status: newStatus } : app));
      localStorage.setItem('welfare_requests', JSON.stringify(updated));
      return updated;
    });

    if (selectedCase && selectedCase.id === appId) {
      setSelectedCase(prev => ({ ...prev, status: newStatus }));
    }
  };

  // ลบประกาศทุน
  const handleDeleteScholarship = (id) => {
    if (confirm('คุณต้องการลบประกาศทุนนี้ใช่หรือไม่?')) {
      const updated = scholarships.filter(s => s.id !== id);
      setScholarships(updated);
      localStorage.setItem('cs_scholarships', JSON.stringify(updated));
    }
  };

  // บันทึกทุน
  const handleScholarshipSubmit = (e) => {
    e.preventDefault();
    const formattedAmount = `${Number(scholarshipForm.amount).toLocaleString('th-TH')} บาท`;
    const payload = { ...scholarshipForm, amount: formattedAmount };

    let updated;
    if (editingScholarship) {
      updated = scholarships.map(item => item.id === editingScholarship.id ? { ...payload, id: item.id } : item);
    } else {
      updated = [{ ...payload, id: Date.now() }, ...scholarships];
    }

    setScholarships(updated);
    localStorage.setItem('cs_scholarships', JSON.stringify(updated));
    setIsScholarshipModalOpen(false);
  };

  // กรองข้อมูลรายการตามคำค้นหาและสถานะ
  const filterList = (list) => {
    return list.filter(app => {
      const matchSearch = (
        (app.name || '') + 
        (app.studentId || '') + 
        (app.trackingNo || '') + 
        (app.requestType || '')
      ).toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ทั้งหมด' 
        ? true 
        : statusFilter === 'รอดำเนินการ' 
        ? app.status.includes('รอ') 
        : statusFilter === 'อนุมัติแล้ว' 
        ? app.status.includes('อนุมัติ') 
        : app.status.includes('ไม่ผ่าน');

      return matchSearch && matchStatus;
    });
  };

  const displayedWelfare = useMemo(() => filterList(welfareList), [welfareList, searchQuery, statusFilter]);
  const displayedScholarshipApps = useMemo(() => filterList(scholarshipAppList), [scholarshipAppList, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[#1a2332] font-sans flex flex-col justify-between selection:bg-[#004c99] selection:text-white">
      
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-[#00366f] to-[#0066cc] rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md">
              MJU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base md:text-lg text-[#002f61] leading-tight">ระบบสารสนเทศผู้ดูแลระบบ (CS Admin)</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-[#004c99] rounded-md">ADMIN PORTAL</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a 
              href="/" 
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-white via-blue-50/40 to-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 mb-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 text-[#004c99] text-xs font-bold rounded-full mb-3 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ระบบแยกประเภทคำร้อง: ขอความช่วยเหลือ vs สมัครทุนการศึกษา
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#002f61] mb-2 tracking-tight">
              ศูนย์จัดการทุนการศึกษา & บรรเทาความเดือดร้อน
            </h2>
            <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
              แยกแยะการคัดกรองระหว่างเคสฉุกเฉินเร่งด่วน กับการพิจารณาใบสมัครทุนการศึกษาประจำภาคเรียนของสาขา CS
            </p>
          </div>

          <button 
            onClick={() => {
              setEditingScholarship(null);
              setScholarshipForm({
                title: '',
                type: '🎓 ทุนภายในภาควิชา (เรียนดี / กิจกรรมเด่น)',
                amount: '',
                deadline: '',
                criteria: '',
                description: ''
              });
              setIsScholarshipModalOpen(true);
            }}
            className="px-6 py-3.5 bg-gradient-to-r from-[#00366f] to-[#004c99] hover:brightness-110 text-white text-xs font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
            <span>สร้างประกาศทุนใหม่</span>
          </button>
        </section>

        {/* Workspace Tab Switcher (แยกการทำงาน 3 ส่วนชัดเจน) */}
        <div className="flex border-b border-slate-200 mb-6 gap-2 md:gap-6 overflow-x-auto">
          
          {/* แท็บที่ 1: ขอความช่วยเหลือ */}
          <button
            onClick={() => { setActiveTab('welfare'); setStatusFilter('ทั้งหมด'); }}
            className={`pb-3.5 px-2 text-xs md:text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'welfare'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-hand-holding-heart text-rose-500"></i>
            <span>คำร้องขอความช่วยเหลือฉุกเฉิน</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'welfare' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {welfareList.length}
            </span>
          </button>

          {/* แท็บที่ 2: ขอทุนการศึกษา */}
          <button
            onClick={() => { setActiveTab('scholarship_apps'); setStatusFilter('ทั้งหมด'); }}
            className={`pb-3.5 px-2 text-xs md:text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'scholarship_apps'
                ? 'border-[#004c99] text-[#004c99]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-graduation-cap text-[#004c99]"></i>
            <span>ใบสมัครขอรับทุนการศึกษา</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'scholarship_apps' ? 'bg-blue-100 text-[#004c99]' : 'bg-slate-100 text-slate-500'
            }`}>
              {scholarshipAppList.length}
            </span>
          </button>

          {/* แท็บที่ 3: จัดการประกาศทุน */}
          <button
            onClick={() => setActiveTab('scholarships_manage')}
            className={`pb-3.5 px-2 text-xs md:text-sm font-bold transition border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'scholarships_manage'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <i className="fa-solid fa-bullhorn text-indigo-600"></i>
            <span>จัดการประกาศทุนภาควิชา</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'scholarships_manage' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {scholarships.length}
            </span>
          </button>
        </div>

        {/* Filter Toolbar (ใช้ร่วมกันสำหรับแท็บตาราง) */}
        {(activeTab === 'welfare' || activeTab === 'scholarship_apps') && (
          <div className="p-4 mb-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="relative w-full md:w-80">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสนักศึกษา, รหัสคำร้อง..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">กรองสถานะ:</span>
              {['ทั้งหมด', 'รอดำเนินการ', 'อนุมัติแล้ว', 'ไม่ผ่านเกณฑ์'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#002f61] text-white shadow-2xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- แท็บที่ 1: คำร้องขอความช่วยเหลือฉุกเฉิน ---------------- */}
        {activeTab === 'welfare' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold text-rose-900">รายการคำร้องขอความช่วยเหลือฉุกเฉิน (สวัสดิการเร่งด่วน)</span>
              </div>
              <span className="text-xs font-bold text-rose-700">พบ {displayedWelfare.length} รายการ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">ผู้ยื่นคำร้อง</th>
                    <th className="py-3.5 px-4">ประเภทความเดือดร้อน / ความเร่งด่วน</th>
                    <th className="py-3.5 px-4">วงเงินขอรับ</th>
                    <th className="py-3.5 px-4">เหตุผลความจำเป็น</th>
                    <th className="py-3.5 px-4">สถานะการพิจารณา</th>
                    <th className="py-3.5 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedWelfare.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                        ไม่มีคำร้องขอความช่วยเหลือฉุกเฉินในขณะนี้
                      </td>
                    </tr>
                  ) : (
                    displayedWelfare.map((app) => (
                      <tr key={app.id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-extrabold text-sm text-[#002f61]">{app.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {app.studentId} • <span className="font-bold text-slate-700">{app.year}</span>
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{app.trackingNo}</span>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{app.requestType}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.urgency?.includes('วิกฤต') 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : app.urgency?.includes('ด่วน')
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {app.urgency || 'เร่งด่วน'}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-black text-rose-600 text-sm whitespace-nowrap">
                          {app.amountRequested}
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <p className="line-clamp-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                            {app.reason}
                          </p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-[#002f61] focus:outline-none focus:border-[#004c99] cursor-pointer shadow-2xs"
                          >
                            <option value="รออาจารย์ที่ปรึกษาตรวจสอบ">รออาจารย์ที่ปรึกษาตรวจสอบ</option>
                            <option value="ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)">ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)</option>
                            <option value="อนุมัติความช่วยเหลือเรียบร้อยแล้ว">อนุมัติความช่วยเหลือเรียบร้อยแล้ว</option>
                            <option value="ไม่ผ่านเกณฑ์การพิจารณา">ไม่ผ่านเกณฑ์การพิจารณา</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCase(app)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white rounded-xl font-bold transition cursor-pointer"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---------------- แท็บที่ 2: ใบสมัครขอรับทุนการศึกษา ---------------- */}
        {activeTab === 'scholarship_apps' && (
          <section className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#004c99]"></span>
                <span className="text-xs font-bold text-[#002f61]">รายการใบสมัครขอรับทุนการศึกษาประจำภาคเรียน</span>
              </div>
              <span className="text-xs font-bold text-[#004c99]">พบ {displayedScholarshipApps.length} รายการ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">นักศึกษาผู้สมัคร</th>
                    <th className="py-3.5 px-4">โครงการทุนการศึกษาที่สมัคร</th>
                    <th className="py-3.5 px-4">วงเงินทุน</th>
                    <th className="py-3.5 px-4">เหตุผลและคุณสมบัติ</th>
                    <th className="py-3.5 px-4">สถานะการพิจารณา</th>
                    <th className="py-3.5 px-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedScholarshipApps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                        ยังไม่มีใบสมัครทุนการศึกษาในขณะนี้
                      </td>
                    </tr>
                  ) : (
                    displayedScholarshipApps.map((app) => (
                      <tr key={app.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-extrabold text-sm text-[#002f61]">{app.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {app.studentId} • <span className="font-bold text-[#004c99]">{app.year}</span>
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{app.trackingNo}</span>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-bold text-[#002f61] line-clamp-1">{app.requestType}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{app.date}</p>
                        </td>

                        <td className="py-4 px-4 font-black text-emerald-700 text-sm whitespace-nowrap">
                          {app.amountRequested}
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <p className="line-clamp-2 text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                            {app.reason}
                          </p>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-[#002f61] focus:outline-none focus:border-[#004c99] cursor-pointer shadow-2xs"
                          >
                            <option value="รออาจารย์ที่ปรึกษาตรวจสอบ">รออาจารย์ที่ปรึกษาตรวจสอบ</option>
                            <option value="ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)">ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)</option>
                            <option value="อนุมัติความช่วยเหลือเรียบร้อยแล้ว">อนุมัติการให้ทุนเรียบร้อยแล้ว</option>
                            <option value="ไม่ผ่านเกณฑ์การพิจารณา">ไม่ผ่านเกณฑ์การพิจารณา</option>
                          </select>
                        </td>

                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCase(app)}
                            className="px-3 py-1.5 bg-blue-50 text-[#004c99] hover:bg-[#004c99] hover:text-white rounded-xl font-bold transition cursor-pointer"
                          >
                            ดูใบสมัคร
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ---------------- แท็บที่ 3: จัดการประกาศทุนภาควิชา ---------------- */}
        {activeTab === 'scholarships_manage' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scholarships.map((s) => (
                <div 
                  key={s.id} 
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-[#004c99] transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#004c99] font-bold rounded-lg text-[11px]">
                        {s.type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        ปิดรับ: {s.deadline}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-[#002f61] mb-2">{s.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-2">{s.description}</p>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">เกณฑ์คุณสมบัติ:</span>
                        <span className="font-bold text-emerald-800">{s.criteria}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200/50">
                        <span className="text-slate-400 font-medium">มูลค่าสนับสนุน:</span>
                        <span className="font-black text-[#004c99]">{s.amount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingScholarship(s);
                        setScholarshipForm({
                          ...s,
                          amount: String(s.amount || '').replace(/[^0-9]/g, '')
                        });
                        setIsScholarshipModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#004c99] text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <i className="fa-solid fa-pen-to-square mr-1"></i> แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteScholarship(s.id)}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <i className="fa-solid fa-trash mr-1"></i> ลบประกาศ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedCase.source === 'welfare' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-[#004c99]'
              }`}>
                {selectedCase.source === 'welfare' ? 'เคสขอความช่วยเหลือ' : 'ใบสมัครขอทุน'}
              </span>
              <span className="text-xs text-slate-400 font-mono font-medium">{selectedCase.trackingNo}</span>
            </div>

            <h3 className="text-xl font-black text-[#002f61] mb-1">{selectedCase.name}</h3>
            <p className="text-xs text-slate-500 mb-6">
              รหัสนักศึกษา: <strong>{selectedCase.studentId}</strong> • {selectedCase.year} • {selectedCase.faculty}
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block mb-1">หัวข้อคำร้อง / โครงการ:</span>
                <p className="font-extrabold text-sm text-[#002f61]">{selectedCase.requestType}</p>
                <p className="text-xs text-emerald-700 font-black mt-1">วงเงินที่ขอรับ: {selectedCase.amountRequested}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 font-bold block mb-1">รายละเอียดและความจำเป็น:</span>
                <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  "{selectedCase.reason}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-0.5">เบอร์โทรศัพท์ติดต่อ:</span>
                  <span className="font-bold text-slate-800">{selectedCase.phone || '-'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-bold block mb-0.5">บัญชีรับเงิน:</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedCase.payoutMethod || 'พร้อมเพย์'}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-600">ปรับสถานะผลการพิจารณา:</span>
                <select
                  value={selectedCase.status}
                  onChange={(e) => handleStatusChange(selectedCase.id, e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-xs text-[#002f61] cursor-pointer"
                >
                  <option value="รออาจารย์ที่ปรึกษาตรวจสอบ">รออาจารย์ที่ปรึกษาตรวจสอบ</option>
                  <option value="ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)">ผ่านการอนุมัติขั้นต้น (รอเบิกจ่าย)</option>
                  <option value="อนุมัติความช่วยเหลือเรียบร้อยแล้ว">อนุมัติเรียบร้อยแล้ว</option>
                  <option value="ไม่ผ่านเกณฑ์การพิจารณา">ไม่ผ่านเกณฑ์การพิจารณา</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCase(null)}
                className="px-5 py-2.5 bg-[#004c99] text-white text-xs font-bold rounded-xl hover:bg-[#00366f] transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal เพิ่ม / แก้ไข ทุน */}
      {isScholarshipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setIsScholarshipModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs transition cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-[#002f61] mb-1">
              {editingScholarship ? 'แก้ไขประกาศทุนการศึกษา' : 'เพิ่มประกาศทุนใหม่'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">กรอกรายละเอียดเพื่อประกาศให้นักศึกษาสาขา CS ยื่นสมัคร</p>

            <form onSubmit={handleScholarshipSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ชื่อโครงการทุน</label>
                <input
                  type="text"
                  required
                  value={scholarshipForm.title}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, title: e.target.value })}
                  placeholder="เช่น ทุนสนับสนุนการศึกษาภาควิชา ประจำปีการศึกษา 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-[#004c99]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ประเภททุน</label>
                  <select
                    value={scholarshipForm.type}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 cursor-pointer focus:bg-white focus:outline-none"
                  >
                    <option value="🎓 ทุนภายในภาควิชา (เรียนดี / กิจกรรมเด่น)">🎓 ทุนภายในภาควิชา</option>
                    <option value="🚨 ทุนช่วยเหลือฉุกเฉิน (ภัยพิบัติ / วิกฤตกะทันหัน)">🚨 ทุนช่วยเหลือฉุกเฉิน</option>
                    <option value="🤝 ทุนศิษย์เก่า CS (เครือข่ายพี่สู่น้อง)">🤝 ทุนศิษย์เก่า CS</option>
                    <option value="💰 ทุนสนับสนุนค่าครองชีพ">💰 ทุนสนับสนุนค่าครองชีพ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">วงเงินต่อทุน (บาท)</label>
                  <input
                    type="number"
                    required
                    value={scholarshipForm.amount}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, amount: e.target.value })}
                    placeholder="เช่น 5000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-[#004c99]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">วันปิดรับสมัคร</label>
                  <input
                    type="date"
                    required
                    value={scholarshipForm.deadline}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, deadline: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-[#004c99]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">เงื่อนไขเบื้องต้น</label>
                  <input
                    type="text"
                    required
                    value={scholarshipForm.criteria}
                    onChange={(e) => setScholarshipForm({ ...scholarshipForm, criteria: e.target.value })}
                    placeholder="เช่น นศ. CS ทุกชั้นปี, GPAX >= 2.50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-[#004c99]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">คำอธิบายรายละเอียด</label>
                <textarea
                  rows="3"
                  required
                  value={scholarshipForm.description}
                  onChange={(e) => setScholarshipForm({ ...scholarshipForm, description: e.target.value })}
                  placeholder="ระบุวัตถุประสงค์และคุณสมบัติเพิ่มเติม..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:border-[#004c99] resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScholarshipModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#004c99] hover:bg-[#00366f] text-white font-bold rounded-xl transition shadow-xs"
                >
                  {editingScholarship ? 'บันทึกการแก้ไข' : 'เผยแพร่ประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold">สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
        <p className="text-[11px] text-slate-400 mt-1">CS Scholarship Management System &copy; 2026</p>
      </footer>
    </div>
  );
}