"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';

export default function StudentDashboardPage() {
  const [scholarships, setScholarships] = useState([
    {
      id: 1,
      title: 'ทุนสนับสนุนการศึกษา ภาควิชาวิทยาการคอมพิวเตอร์ (ประจำปี 2/2026)',
      type: 'ทุนภายในภาควิชา',
      amount: '5,000 บาท / ภาคเรียน',
      deadline: '2026-09-30',
      criteria: 'นักศึกษา CS ทุกชั้นปี, เกรดเฉลี่ยสะสมไม่ต่ำกว่า 2.50',
      description: 'ทุนการศึกษาสำหรับนักศึกษาสาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ ที่มีความประพฤติดีและต้องการทุนสนับสนุนการเรียน'
    },
    {
      id: 2,
      title: 'ทุนศิษย์เก่า CS แม่โจ้ร่วมใจช่วยเหลือภัยทางการเงิน',
      type: 'ทุนช่วยเหลือฉุกเฉิน',
      amount: '3,000 - 8,000 บาท (ตามความจำเป็น)',
      deadline: '2026-08-15',
      criteria: 'ประสบปัญหาขาดแคลนทุนทรัพย์กะทันหัน / ค่าใช้จ่ายฉุกเฉิน',
      description: 'กองทุนช่วยเหลือเร่งด่วนจากเครือข่ายศิษย์เก่าสาขาวิทยาการคอมพิวเตอร์ เพื่อบรรเทาความเดือดร้อนเบื้องต้น'
    }
  ]);

  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  
  // ค้นหาและตัวกรอง
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('deadline');
  
  const [favorites, setFavorites] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [existingApplications, setExistingApplications] = useState([]);

  // ข้อมูลฟอร์ม (เริ่มต้นเป็นค่าว่าง)
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    year: '',
    nationalId: '',
    phone: '',
    gpa: '',
    age: '',
    nationality: 'ไทย',
    familyIncome: '',
    familyStatus: '',
    familyExpenses: '',
    incomeEvidence: '',
    reason: '',
    amountNeeded: ''
  });

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    try {
      const savedScholarships = localStorage.getItem('cs_scholarships');
      if (savedScholarships) {
        const parsed = JSON.parse(savedScholarships);
        if (Array.isArray(parsed) && parsed.length > 0) setScholarships(parsed);
      }

      const savedFavorites = localStorage.getItem('cs_scholarship_favorites');
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));

      const requests = JSON.parse(localStorage.getItem('welfare_requests') || '[]');
      setExistingApplications(requests);
    } catch (e) {
      console.error("Error loading localStorage data", e);
    }
  }, []);

  // ปิด Modal ด้วยปุ่ม Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem('cs_scholarship_favorites', JSON.stringify(next));
      return next;
    });
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const parseAmount = useCallback((amountStr) => {
    if (!amountStr) return 0;
    const match = String(amountStr).replace(/,/g, '').match(/\d+/g);
    return match ? Math.max(...match.map(Number)) : 0;
  }, []);

  // ตรวจสอบว่าเคยสมัครทุนนี้หรือยัง
  const hasApplied = useCallback((scholarshipTitle, studentId) => {
    if (!studentId) return false;
    return existingApplications.some(
      req => req.studentId === studentId && (req.requestType?.includes(scholarshipTitle) || req.title?.includes(scholarshipTitle))
    );
  }, [existingApplications]);

  const handleOpenApply = (item) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (item.deadline) {
      const deadlineDate = new Date(item.deadline);
      if (!isNaN(deadlineDate.getTime()) && today > deadlineDate) {
        alert('❌ ขออภัย ทุนการศึกษานี้ปิดรับสมัครแล้ว เนื่องจากครบกำหนดเวลา');
        return;
      }
    }

    if (hasApplied(item.title, formData.studentId)) {
      alert('ℹ️ คุณได้ยื่นใบสมัครสำหรับทุนนี้ไปเรียบร้อยแล้ว สามารถติดตามผลได้ที่หน้า "ติดตามสถานะ"');
      return;
    }

    setSelectedScholarship(item);
    setFormData(prev => ({
      ...prev,
      amountNeeded: ''
    }));
    setModalStep(1);
    setSuccessMsg(false);
    setIsModalOpen(true);
  };

  // --- Handlers สำหรับป้องกันบั๊กพิมพ์ข้อมูลผิดประเภท ---
  
  // เฉพาะตัวเลข
  const handleNumericChange = (field, maxLen) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // เฉพาะตัวอักษรและช่องว่าง (ไทย-อังกฤษ)
  const handleTextChange = (field, maxLen) => (e) => {
    const val = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '').slice(0, maxLen);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // เฉพาะ GPA (ตัวเลขและจุดทศนิยม 0.00 - 4.00)
  const handleGpaChange = (e) => {
    let val = e.target.value.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts[1]) val = parts[0] + '.' + parts[1].slice(0, 2);
    
    if (Number(val) > 4.0) {
      val = '4.00';
    }
    setFormData(prev => ({ ...prev, gpa: val }));
  };

  // ตรวจสอบข้อมูลสเต็ป 1
  const validateStep1 = () => {
    if (formData.studentId.length !== 10) {
      alert('❌ กรุณากรอกรหัสนักศึกษาให้ครบ 10 หลัก (เฉพาะตัวเลข)');
      return false;
    }
    if (!formData.fullName.trim()) {
      alert('❌ กรุณากรอกชื่อ-นามสกุล (เฉพาะตัวอักษร)');
      return false;
    }
    if (!formData.year) {
      alert('❌ กรุณาเลือกชั้นปี');
      return false;
    }
    if (formData.nationalId.length !== 13) {
      alert('❌ กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก (เฉพาะตัวเลข)');
      return false;
    }
    if (formData.phone.length !== 10) {
      alert('❌ กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (เฉพาะตัวเลข)');
      return false;
    }
    if (!formData.gpa || isNaN(Number(formData.gpa)) || Number(formData.gpa) < 0 || Number(formData.gpa) > 4.0) {
      alert('❌ กรุณากรอกเกรดเฉลี่ย (GPA) ที่ถูกต้องระหว่าง 0.00 ถึง 4.00');
      return false;
    }
    if (!formData.age || Number(formData.age) < 15 || Number(formData.age) > 99) {
      alert('❌ กรุณากรอกอายุให้ถูกต้อง (ระหว่าง 15 - 99 ปี)');
      return false;
    }
    return true;
  };

  // ตรวจสอบข้อมูลสเต็ป 2
  const validateStep2 = () => {
    const maxAmount = parseAmount(selectedScholarship?.amount);
    const needed = Number(formData.amountNeeded);

    if (!formData.amountNeeded || needed <= 0) {
      alert('❌ กรุณาระบุจำนวนเงินที่ขอรับ (เป็นตัวเลขมากกว่า 0)');
      return false;
    }
    if (maxAmount > 0 && needed > maxAmount) {
      alert(`❌ จำนวนเงินที่ขอรับต้องไม่เกิน ${maxAmount.toLocaleString()} บาท`);
      return false;
    }
    if (!formData.reason.trim()) {
      alert('❌ กรุณาระบุเหตุผลและความจำเป็นในการขอรับทุน');
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!validateStep1() || !validateStep2()) return;

    if (!formData.familyIncome || Number(formData.familyIncome) < 0) {
      alert('❌ กรุณาระบุรายได้ครอบครัวเป็นตัวเลข');
      return;
    }
    if (!formData.familyStatus) {
      alert('❌ กรุณาเลือกสถานภาพครอบครัว');
      return;
    }

    setIsSubmitting(true);

    const trackingNo = `MJU-SCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApplication = {
      id: Date.now(),
      trackingNo: trackingNo,
      studentId: formData.studentId.trim(),
      name: formData.fullName.trim(),
      year: formData.year,
      nationalId: formData.nationalId.trim(),
      phone: formData.phone.trim(),
      gpa: formData.gpa.trim(),
      age: formData.age.trim(),
      nationality: formData.nationality.trim(),
      familyIncome: `${Number(formData.familyIncome).toLocaleString()} บาท/ปี`,
      familyStatus: formData.familyStatus,
      familyExpenses: formData.familyExpenses.trim(),
      incomeEvidence: formData.incomeEvidence || 'ไม่มีเอกสารแนบ',
      faculty: 'สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์',
      requestType: `สมัครทุน: ${selectedScholarship.title}`,
      amountRequested: `${Number(formData.amountNeeded).toLocaleString()} บาท`,
      reason: formData.reason.trim(),
      status: 'รออาจารย์ที่ปรึกษาตรวจสอบ',
      advisor: 'อาจารย์ที่ปรึกษาประจำชั้นปี',
      source: 'scholarship',
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const updatedRequests = [newApplication, ...existingApplications];
    localStorage.setItem('welfare_requests', JSON.stringify(updatedRequests));
    setExistingApplications(updatedRequests);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg(true);
      setTimeout(() => {
        setIsModalOpen(false);
        window.location.href = '/scholarship/student';
      }, 1200);
    }, 600);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const scholarshipTypes = useMemo(() => {
    return ['ทั้งหมด', ...new Set(scholarships.map((s) => s.type))];
  }, [scholarships]);

  const enriched = useMemo(() => {
    return scholarships.map((item) => {
      const deadlineDate = item.deadline ? new Date(item.deadline) : null;
      const isExpired = deadlineDate && !isNaN(deadlineDate.getTime()) && today > deadlineDate;
      const daysLeft = deadlineDate && !isNaN(deadlineDate.getTime())
        ? Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24))
        : null;
      return { ...item, deadlineDate, isExpired, daysLeft };
    });
  }, [scholarships, today]);

  const openCount = enriched.filter((s) => !s.isExpired).length;
  const closingSoonCount = enriched.filter((s) => !s.isExpired && s.daysLeft !== null && s.daysLeft <= 7).length;
  const expiredCount = enriched.length - openCount;

  const visibleScholarships = useMemo(() => {
    return enriched
      .filter((s) => typeFilter === 'ทั้งหมด' || s.type === typeFilter)
      .filter((s) => (s.title + s.description).toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((s) => {
        if (statusFilter === 'เปิดรับ') return !s.isExpired;
        if (statusFilter === 'ใกล้ปิดรับ') return !s.isExpired && s.daysLeft !== null && s.daysLeft <= 7;
        if (statusFilter === 'บันทึกไว้') return favorites.includes(s.id);
        return true;
      })
      .sort((a, b) => {
        if (a.isExpired !== b.isExpired) return a.isExpired ? 1 : -1;
        if (sortBy === 'amount') return parseAmount(b.amount) - parseAmount(a.amount);
        if (a.deadlineDate && b.deadlineDate) return a.deadlineDate - b.deadlineDate;
        return 0;
      });
  }, [enriched, typeFilter, searchTerm, statusFilter, favorites, sortBy, parseAmount]);

  const myApplicationsCount = useMemo(() => {
    if (!formData.studentId) return existingApplications.length;
    return existingApplications.filter((r) => r.studentId === formData.studentId).length;
  }, [existingApplications, formData.studentId]);

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[#1a2332] font-sans flex flex-col justify-between selection:bg-[#004c99] selection:text-white">
      
      {/* Top Navbar */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00366f] to-[#0066cc] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md">
              MJU
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-[#002f61] leading-tight">ระบบทุนการศึกษาภาควิชา</h1>
              <p className="text-[11px] text-slate-500 font-medium">สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="/scholarship/student"
              className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00366f] to-[#004c99] text-white text-xs font-bold rounded-xl hover:shadow-md active:scale-95 transition-all shadow-xs"
            >
              <i className="fa-solid fa-clock-rotate-left"></i>
              <span>ติดตามสถานะ</span>
              {myApplicationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-[#00366f] rounded-full text-[10px] font-black">
                  {myApplicationsCount}
                </span>
              )}
            </a>
            <a 
              href="/" 
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow">
        
        {/* Banner Section */}
        <section className="bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 rounded-3xl p-6 md:p-10 border border-blue-100/80 mb-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-full text-[#004c99] text-xs font-bold mb-4 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              CS Scholarship Portal ประจำปี 2026
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-[#002f61] mb-3 tracking-tight">
              ค้นหาและสมัครทุนการศึกษา
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              สวัสดิการและโอกาสทางการศึกษาสำหรับนักศึกษาสาขาวิทยาการคอมพิวเตอร์ ตรวจสอบเงื่อนไข ยื่นใบสมัครออนไลน์ และติดตามผลได้ครบจบในที่เดียว
            </p>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6 max-w-lg">
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                <span className="block text-2xl font-black text-[#002f61]">{openCount}</span>
                <span className="block text-[11px] font-bold text-slate-500 mt-0.5">เปิดรับสมัคร</span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                <span className="block text-2xl font-black text-amber-600">{closingSoonCount}</span>
                <span className="block text-[11px] font-bold text-slate-500 mt-0.5">ใกล้ปิดรับ (&le;7 วัน)</span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                <span className="block text-2xl font-black text-slate-400">{expiredCount}</span>
                <span className="block text-[11px] font-bold text-slate-500 mt-0.5">ปิดรับแล้ว</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Toolbar */}
        <section className="mb-6 space-y-3.5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อทุน, ประเภท หรือคุณสมบัติ..."
                className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-[#004c99] focus:ring-4 focus:ring-blue-100 font-medium transition-all shadow-2xs"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                aria-label="กรองประเภททุน"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 text-xs md:text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-[#004c99] font-bold text-[#002f61] shadow-2xs cursor-pointer"
              >
                {scholarshipTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <select
                aria-label="เรียงลำดับรายการทุน"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 text-xs md:text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-[#004c99] font-bold text-[#002f61] shadow-2xs cursor-pointer"
              >
                <option value="deadline">วันปิดรับ (ใกล้สุดก่อน)</option>
                <option value="amount">มูลค่าทุน (มากไปน้อย)</option>
              </select>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap gap-2">
              {['ทั้งหมด', 'เปิดรับ', 'ใกล้ปิดรับ', 'บันทึกไว้'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    statusFilter === s
                      ? 'bg-[#00366f] border-[#00366f] text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s === 'บันทึกไว้' ? `★ ${s}` : s}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500">
              พบ <strong className="text-[#004c99]">{visibleScholarships.length}</strong> ทุนที่ตรงเงื่อนไข
            </p>
          </div>
        </section>

        {/* Scholarships Grid */}
        {visibleScholarships.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-14 h-14 bg-blue-50 text-[#004c99] rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl">
              <i className="fa-solid fa-filter-circle-xmark"></i>
            </div>
            <h3 className="font-bold text-[#002f61] text-base mb-1">ไม่พบทุนการศึกษาตามเงื่อนไขที่เลือก</h3>
            <p className="text-xs text-slate-500">ลองล้างตัวกรองหรือใช้คำค้นหาใหม่อีกครั้ง</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleScholarships.map((item) => {
              const { isExpired, daysLeft } = item;
              const isUrgent = !isExpired && daysLeft !== null && daysLeft <= 7;
              const isFav = favorites.includes(item.id);
              const isExpanded = expandedIds.includes(item.id);
              const applied = hasApplied(item.title, formData.studentId);

              return (
                <div
                  key={item.id}
                  className={`relative rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between group overflow-hidden ${
                    isExpired
                      ? 'bg-slate-50/80 border-slate-200 opacity-75'
                      : 'bg-white border-slate-200 hover:border-[#004c99] hover:shadow-lg shadow-xs hover:-translate-y-1'
                  }`}
                >
                  {/* Top Color Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isExpired ? 'bg-slate-300' : isUrgent ? 'bg-amber-400' : 'bg-[#004c99]'
                  }`}></div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    aria-label={isFav ? "ยกเลิกบันทึกทุน" : "บันทึกทุนนี้"}
                    className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all cursor-pointer ${
                      isFav ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:text-amber-400'
                    }`}
                  >
                    ★
                  </button>

                  <div>
                    {/* Header Chips */}
                    <div className="flex items-center gap-2 mb-3 pr-8">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#004c99] border border-blue-200/80 rounded-xl text-[11px] font-bold truncate">
                        {item.type}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                          ปิดรับสมัคร
                        </span>
                      ) : isUrgent ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg animate-pulse">
                          เหลือ {daysLeft} วัน
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                          ปิดรับ {item.deadline}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base md:text-lg text-[#002f61] mb-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className={`text-xs text-slate-500 leading-relaxed mb-1 ${isExpanded ? '' : 'line-clamp-3'}`}>
                      {item.description}
                    </p>
                    {item.description.length > 90 && (
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="text-[11px] font-bold text-[#004c99] hover:underline mb-3 cursor-pointer"
                      >
                        {isExpanded ? 'ย่อข้อความ ▲' : 'อ่านเพิ่มเติม ▼'}
                      </button>
                    )}

                    {/* Criteria Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 my-4 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">คุณสมบัติผู้สมัคร</span>
                      <p className="text-xs font-semibold text-emerald-800 leading-tight">{item.criteria}</p>
                    </div>
                  </div>

                  {/* Card Bottom */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">วงเงินสนับสนุน</span>
                      <strong className="text-sm font-extrabold text-[#004c99]">{item.amount}</strong>
                    </div>

                    {isExpired ? (
                      <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed">
                        หมดเขตรับ
                      </button>
                    ) : applied ? (
                      <span className="px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <i className="fa-solid fa-check text-[11px]"></i> ยื่นแล้ว
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenApply(item)}
                        className="px-4 py-2 bg-[#004c99] text-white text-xs font-bold rounded-xl hover:bg-[#00366f] transition-all active:scale-95 shadow-xs cursor-pointer"
                      >
                        สมัครทุนนี้ &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold">สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
        <p className="text-[11px] text-slate-400 mt-1">Student Welfare Portal &copy; 2026</p>
      </footer>

      {/* Accessible Step Modal Form */}
      {isModalOpen && selectedScholarship && (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-title"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div>
                <h3 id="modal-title" className="font-extrabold text-base text-[#002f61]">ยื่นใบสมัครขอรับทุนการศึกษา</h3>
                <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">{selectedScholarship.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Wizard Indicator */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400">
              <span className={modalStep >= 1 ? 'text-[#004c99]' : ''}>1. ประวัตินักศึกษา</span>
              <span>&rarr;</span>
              <span className={modalStep >= 2 ? 'text-[#004c99]' : ''}>2. ความจำเป็น</span>
              <span>&rarr;</span>
              <span className={modalStep >= 3 ? 'text-[#004c99]' : ''}>3. ข้อมูลครอบครัว</span>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
              
              {/* STEP 1: Personal Info */}
              {modalStep === 1 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="studentIdInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        รหัสนักศึกษา <span className="text-rose-500">*</span> (10 หลัก)
                      </label>
                      <input
                        id="studentIdInput"
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.studentId}
                        onChange={handleNumericChange('studentId', 10)}
                        placeholder="เฉพาะตัวเลข 10 หลัก"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="yearSelect" className="block text-xs font-bold text-[#002f61] mb-1">
                        ชั้นปี <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="yearSelect"
                        required
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      >
                        <option value="" disabled>-- เลือกชั้นปี --</option>
                        <option value="ชั้นปีที่ 1 (CS)">ปี 1</option>
                        <option value="ชั้นปีที่ 2 (CS)">ปี 2</option>
                        <option value="ชั้นปีที่ 3 (CS)">ปี 3</option>
                        <option value="ชั้นปีที่ 4 (CS)">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="fullNameInput" className="block text-xs font-bold text-[#002f61] mb-1">
                      ชื่อ - นามสกุล <span className="text-rose-500">*</span> (เฉพาะตัวอักษร)
                    </label>
                    <input
                      id="fullNameInput"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleTextChange('fullName', 80)}
                      placeholder="กรอกชื่อและนามสกุลจริง"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="nationalIdInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        เลขบัตรประชาชน <span className="text-rose-500">*</span> (13 หลัก)
                      </label>
                      <input
                        id="nationalIdInput"
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={13}
                        value={formData.nationalId}
                        onChange={handleNumericChange('nationalId', 13)}
                        placeholder="เฉพาะตัวเลข 13 หลัก"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="phoneInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        เบอร์โทรศัพท์มือถือ <span className="text-rose-500">*</span> (10 หลัก)
                      </label>
                      <input
                        id="phoneInput"
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.phone}
                        onChange={handleNumericChange('phone', 10)}
                        placeholder="เฉพาะตัวเลข 10 หลัก"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor="gpaInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        เกรดเฉลี่ย (GPA) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="gpaInput"
                        type="text"
                        required
                        inputMode="decimal"
                        maxLength={4}
                        value={formData.gpa}
                        onChange={handleGpaChange}
                        placeholder="เช่น 3.25"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="ageInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        อายุ (ปี) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="ageInput"
                        type="text"
                        required
                        inputMode="numeric"
                        maxLength={2}
                        value={formData.age}
                        onChange={handleNumericChange('age', 2)}
                        placeholder="เช่น 20"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="nationalityInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        สัญชาติ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="nationalityInput"
                        type="text"
                        required
                        value={formData.nationality}
                        onChange={handleTextChange('nationality', 30)}
                        placeholder="เฉพาะตัวอักษร"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Request Detail */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-[#004c99] block mb-0.5">วงเงินสูงสุดตามประกาศ:</span>
                    <strong className="text-sm font-extrabold text-[#002f61]">{selectedScholarship.amount}</strong>
                  </div>

                  <div>
                    <label htmlFor="amountNeededInput" className="block text-xs font-bold text-[#002f61] mb-1">
                      ระบุจำนวนเงินที่ขอรับ (บาท) <span className="text-rose-500">*</span> (เฉพาะตัวเลข)
                    </label>
                    <input
                      id="amountNeededInput"
                      type="text"
                      required
                      inputMode="numeric"
                      value={formData.amountNeeded}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const max = parseAmount(selectedScholarship?.amount);
                        if (max > 0 && Number(digits) > max) {
                          setFormData(prev => ({ ...prev, amountNeeded: String(max) }));
                        } else {
                          setFormData(prev => ({ ...prev, amountNeeded: digits }));
                        }
                      }}
                      placeholder={`ตัวเลขไม่เกิน ${parseAmount(selectedScholarship?.amount).toLocaleString()}`}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                    />
                  </div>

                  <div>
                    <label htmlFor="reasonTextarea" className="block text-xs font-bold text-[#002f61] mb-1">
                      เหตุผลและความจำเป็นในการขอรับทุน <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="reasonTextarea"
                      rows="4"
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="อธิบายสถานะทางการเงินและเหตุผลความจำเป็นอย่างกระชับ..."
                      className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-medium resize-none"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* STEP 3: Family Status & Documents */}
              {modalStep === 3 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="familyIncomeInput" className="block text-xs font-bold text-[#002f61] mb-1">
                        รายได้ครอบครัว / ปี (บาท) <span className="text-rose-500">*</span> (เฉพาะตัวเลข)
                      </label>
                      <input
                        id="familyIncomeInput"
                        type="text"
                        required
                        inputMode="numeric"
                        value={formData.familyIncome}
                        onChange={handleNumericChange('familyIncome', 9)}
                        placeholder="เช่น 120000"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="familyStatusSelect" className="block text-xs font-bold text-[#002f61] mb-1">
                        สถานภาพครอบครัว <span className="text-rose-500">*</span>
                      </label>
                      <select
                        id="familyStatusSelect"
                        required
                        value={formData.familyStatus}
                        onChange={(e) => setFormData(prev => ({ ...prev, familyStatus: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-semibold"
                      >
                        <option value="" disabled>-- เลือกสถานภาพ --</option>
                        <option value="บิดามารดาอยู่ด้วยกัน">บิดามารดาอยู่ด้วยกัน</option>
                        <option value="บิดามารดาแยกทางกัน/หย่าร้าง">บิดามารดาแยกทางกัน/หย่าร้าง</option>
                        <option value="บิดาหรือมารดาเสียชีวิต">บิดาหรือมารดาเสียชีวิต</option>
                        <option value="อยู่ในความดูแลของผู้ปกครองอื่น">อยู่ในความดูแลของผู้ปกครองอื่น</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="expensesTextarea" className="block text-xs font-bold text-[#002f61] mb-1">
                      ภาระหนี้สินหรือค่าใช้จ่ายพิเศษ (ถ้ามี)
                    </label>
                    <textarea
                      id="expensesTextarea"
                      rows="2"
                      value={formData.familyExpenses}
                      onChange={(e) => setFormData(prev => ({ ...prev, familyExpenses: e.target.value }))}
                      placeholder="เช่น มีภาระค่ารักษาพยาบาล หรือน้องกำลังศึกษา 2 คน..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#004c99] font-medium resize-none"
                    ></textarea>
                  </div>

                  {/* Document upload preview */}
                  <div>
                    <label htmlFor="incomeEvidenceFile" className="block text-xs font-bold text-[#002f61] mb-1">
                      แนบไฟล์รับรองรายได้ / หนังสือรับรอง (ถ้ามี)
                    </label>
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                      <span className="text-xs text-slate-500 truncate">
                        {formData.incomeEvidence || 'ยังไม่ได้แนบไฟล์เอกสาร'}
                      </span>
                      <label htmlFor="incomeEvidenceFile" className="px-3 py-1 bg-white border border-slate-200 text-[#004c99] text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-100">
                        เลือกไฟล์
                      </label>
                      <input
                        id="incomeEvidenceFile"
                        type="file"
                        className="hidden"
                        onChange={(e) => setFormData(prev => ({ ...prev, incomeEvidence: e.target.files[0]?.name || '' }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center">
                  ✅ ส่งใบสมัครสำเร็จ! กำลังนำท่านไปยังหน้าติดตามผล...
                </div>
              )}

              {/* Modal Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {modalStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setModalStep(prev => prev - 1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    &larr; ย้อนกลับ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
                  >
                    ยกเลิก
                  </button>
                )}

                {modalStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (modalStep === 1 && !validateStep1()) return;
                      if (modalStep === 2 && !validateStep2()) return;
                      setModalStep(prev => prev + 1);
                    }}
                    className="px-5 py-2 bg-[#004c99] hover:bg-[#00366f] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                  >
                    ถัดไป &rarr;
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || successMsg}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันส่งใบสมัคร'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}