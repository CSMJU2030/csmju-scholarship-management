"use client";

import React, { useState } from 'react';

export default function WelfareFormPage() {
  const [formData, setFormData] = useState({
    studentId: '',
    fullName: '',
    year: '',
    faculty: '',
    phone: '',
    issueType: 'ปัญหาภาระค่าครองชีพและค่าใช้จ่ายฉุกเฉิน',
    urgencyLevel: 'ปานกลาง (Medium)',
    amountNeeded: '',
    payoutType: 'พร้อมเพย์ (PromptPay)',
    payoutAccount: '',
    description: '',
    attachmentName: '',
    acceptTerms: false
  });

  const [submittedData, setSubmittedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const inputClass = "w-full px-4 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#004c99] focus:ring-4 focus:ring-blue-100 transition-all shadow-2xs font-medium";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1.5";
  const sectionLabelClass = "flex items-center gap-2 text-xs font-black text-[#002f61] uppercase tracking-wider mb-4 pb-2 border-b border-slate-100";

  const urgencyStyles = {
    'ปกติ (Normal)': 'border-slate-200 bg-slate-50 text-slate-700',
    'ปานกลาง (Medium)': 'border-amber-200 bg-amber-50 text-amber-800',
    'ด่วน (Urgent)': 'border-orange-200 bg-orange-50 text-orange-800',
    'วิกฤต (Critical Crisis)': 'border-rose-300 bg-rose-50 text-rose-800 font-bold',
  }[formData.urgencyLevel];

  // ฟังก์ชันกรองเฉพาะตัวเลข
  const handleNumericChange = (field, maxLen) => (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLen);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // ฟังก์ชันกรองเฉพาะตัวอักษรและช่องว่าง (ไทย-อังกฤษ)
  const handleTextChange = (field, maxLen) => (e) => {
    const val = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '').slice(0, maxLen);
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  // ฟังก์ชันกรองเลขบัญชี/พร้อมเพย์ (ตัวเลขและขีด)
  const handleAccountChange = (e) => {
    const val = e.target.value.replace(/[^0-9-]/g, '').slice(0, 20);
    setFormData(prev => ({ ...prev, payoutAccount: val }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, attachmentName: file.name }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation Guard
    if (formData.studentId.length !== 10) {
      alert('❌ กรุณากรอกรหัสนักศึกษาให้ครบ 10 หลัก (เฉพาะตัวเลข)');
      return;
    }

    if (!formData.fullName.trim()) {
      alert('❌ กรุณากรอกชื่อ-นามสกุล (เฉพาะตัวอักษร)');
      return;
    }

    if (!formData.faculty.trim()) {
      alert('❌ กรุณากรอกคณะ/สาขาวิชา (เฉพาะตัวอักษร)');
      return;
    }

    if (formData.phone.length !== 10) {
      alert('❌ กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก (เฉพาะตัวเลข)');
      return;
    }

    if (!formData.amountNeeded || Number(formData.amountNeeded) <= 0) {
      alert('❌ กรุณาระบุจำนวนเงินที่ต้องการขอรับ (เป็นตัวเลขมากกว่า 0)');
      return;
    }

    if (!formData.payoutAccount.trim()) {
      alert('❌ กรุณาระบุหมายเลขบัญชีหรือเบอร์พร้อมเพย์');
      return;
    }

    if (!formData.acceptTerms) {
      alert('❌ กรุณากดยอมรับการรับรองข้อมูลเพื่อความถูกต้องของคำร้อง');
      return;
    }

    setIsSubmitting(true);

    // สร้างรหัสติดตามคำร้องอัตโนมัติ
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const trackingNo = `MJU-EMG-2026-${randomCode}`;

    // สร้างก้อนข้อมูลที่ส่งเข้าสู่ระบบของแอดมิน
    const newRequest = {
      id: Date.now(),
      trackingNo: trackingNo,
      studentId: formData.studentId.trim(),
      name: formData.fullName.trim(),
      year: formData.year || 'ไม่ระบุชั้นปี',
      faculty: formData.faculty.trim(),
      phone: formData.phone.trim(),
      requestType: formData.issueType,
      urgency: formData.urgencyLevel,
      amountRequested: `${Number(formData.amountNeeded || 0).toLocaleString()} บาท`,
      payoutMethod: `${formData.payoutType}: ${formData.payoutAccount.trim()}`,
      reason: formData.description.trim(),
      attachment: formData.attachmentName || 'ไม่มีเอกสารแนบ',
      status: 'รออาจารย์ที่ปรึกษาตรวจสอบ',
      advisor: 'อาจารย์ที่ปรึกษาและคณะกรรมการสวัสดิการ',
      source: 'welfare',
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      unreadByAdmin: true
    };

    // บันทึกลง LocalStorage
    const existingRequests = JSON.parse(localStorage.getItem('welfare_requests') || '[]');
    localStorage.setItem('welfare_requests', JSON.stringify([newRequest, ...existingRequests]));

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedData(newRequest);
    }, 700);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8faff] text-[#1a2332] font-sans flex flex-col justify-between selection:bg-[#004c99] selection:text-white">
      
      {/* Top Navbar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00366f] to-[#0066cc] flex items-center justify-center text-white font-black text-sm shadow-md">
              MJU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base md:text-lg text-[#002f61] leading-tight">ระบบยื่นคำร้องความเดือดร้อนฉุกเฉิน</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 text-rose-700 rounded-md">EMERGENCY</span>
              </div>
              <p className="text-xs text-slate-500">กองพัฒนานักศึกษา & คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/scholarship/student" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
              ติดตามสถานะ
            </a>
            <a href="/" className="px-4 py-2 bg-[#004c99] hover:bg-[#00366f] text-white text-xs font-bold rounded-xl transition shadow-xs">
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 w-full flex-grow">
        
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/40 rounded-3xl p-6 md:p-8 border border-blue-100 mb-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-[#004c99] text-xs font-bold rounded-full mb-3 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              ศูนย์รับเรื่องความช่วยเหลือเร่งด่วน ประจำปีการศึกษา 2026
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-[#002f61] mb-2 tracking-tight">
              แบบฟอร์มขอรับการสนับสนุนกรณีเดือดร้อน
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium">
              หากนักศึกษาประสบปัญหาด้านค่าครองชีพ ภัยพิบัติ อุบัติเหตุ หรือเหตุจำเป็นฉุกเฉิน สามารถบันทึกข้อมูลเพื่อส่งตรงไปยังอาจารย์ที่ปรึกษาและฝ่ายบริหารสาขาวิชาเพื่อพิจารณาการช่วยเหลือทันที
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* ส่วนที่ 1: ข้อมูลผู้ยื่นคำร้อง */}
            <div>
              <p className={sectionLabelClass}>
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#004c99] flex items-center justify-center text-xs font-black">1</span>
                ข้อมูลนักศึกษาผู้ขอรับความช่วยเหลือ
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>รหัสนักศึกษา <span className="text-rose-500">*</span> (เฉพาะตัวเลข 10 หลัก)</label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleNumericChange('studentId', 10)}
                    placeholder="กรอกรหัส 10 หลัก เช่น 6704101XXX"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>ชื่อ - นามสกุล <span className="text-rose-500">*</span> (เฉพาะตัวอักษร)</label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleTextChange('fullName', 80)}
                    placeholder="กรอกชื่อและนามสกุลจริง"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>ชั้นปีที่กำลังศึกษา <span className="text-rose-500">*</span></label>
                  <select
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="" disabled>-- เลือกชั้นปี --</option>
                    <option value="ชั้นปีที่ 1">ชั้นปีที่ 1</option>
                    <option value="ชั้นปีที่ 2">ชั้นปีที่ 2</option>
                    <option value="ชั้นปีที่ 3">ชั้นปีที่ 3</option>
                    <option value="ชั้นปีที่ 4">ชั้นปีที่ 4</option>
                    <option value="ชั้นปีอื่น ๆ">ชั้นปีอื่น ๆ</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>คณะ / สาขาวิชา <span className="text-rose-500">*</span> (เฉพาะตัวอักษร)</label>
                  <input
                    type="text"
                    required
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleTextChange('faculty', 80)}
                    placeholder="เช่น สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>เบอร์โทรศัพท์ที่ติดต่อได้จริง <span className="text-rose-500">*</span> (เฉพาะตัวเลข 10 หลัก)</label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    name="phone"
                    value={formData.phone}
                    onChange={handleNumericChange('phone', 10)}
                    placeholder="กรอกเบอร์โทรศัพท์ 10 หลัก เช่น 08XXXXXXXX"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* ส่วนที่ 2: รายละเอียดปัญหาและระดับความเร่งด่วน */}
            <div>
              <p className={sectionLabelClass}>
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#004c99] flex items-center justify-center text-xs font-black">2</span>
                สาเหตุความเดือดร้อนและความจำเป็น
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>ประเภทความเดือดร้อน <span className="text-rose-500">*</span></label>
                  <select
                    name="issueType"
                    value={formData.issueType}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="ปัญหาภาระค่าครองชีพและค่าใช้จ่ายฉุกเฉิน">ปัญหาภาระค่าครองชีพและค่าใช้จ่ายฉุกเฉิน</option>
                    <option value="ครอบครัวประสบวิกฤตกะทันหัน / ภัยพิบัติ">ครอบครัวประสบวิกฤตกะทันหัน / ภัยพิบัติ</option>
                    <option value="อุบัติเหตุ / ค่ารักษาพยาบาลเร่งด่วน">อุบัติเหตุ / ค่ารักษาพยาบาลเร่งด่วน</option>
                    <option value="ขาดแคลนอุปกรณ์การเรียนและเครื่องมือโครงงาน">ขาดแคลนอุปกรณ์การเรียนและเครื่องมือโครงงาน</option>
                    <option value="ปัญหาค่าที่พักอาศัย / ค่าหอพักฉุกเฉิน">ปัญหาค่าที่พักอาศัย / ค่าหอพักฉุกเฉิน</option>
                    <option value="อื่น ๆ (ระบุในรายละเอียด)">อื่น ๆ (ระบุในรายละเอียด)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>ระดับความเร่งด่วน <span className="text-rose-500">*</span></label>
                  <select
                    name="urgencyLevel"
                    value={formData.urgencyLevel}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer font-bold ${urgencyStyles}`}
                  >
                    <option value="ปกติ (Normal)">ปกติ (Normal)</option>
                    <option value="ปานกลาง (Medium)">ปานกลาง (Medium)</option>
                    <option value="ด่วน (Urgent)">ด่วน (Urgent)</option>
                    <option value="วิกฤต (Critical Crisis)">วิกฤตเร่งด่วน (Critical Crisis)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>
                    รายละเอียดสถานการณ์และเหตุผลความจำเป็น <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows="4"
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="อธิบายปัญหาที่เกิดขึ้น ผลกระทบที่ได้รับ และเหตุผลที่จำเป็นต้องขอรับความช่วยเหลือ..."
                    className={`${inputClass} resize-none leading-relaxed`}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* ส่วนที่ 3: วงเงินและช่องทางการโอนเงินช่วยเหลือ */}
            <div>
              <p className={sectionLabelClass}>
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#004c99] flex items-center justify-center text-xs font-black">3</span>
                วงเงินและข้อมูลบัญชีสำหรับรับความช่วยเหลือ
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>จำนวนเงินที่ต้องการขอรับการสนับสนุน (บาท) <span className="text-rose-500">*</span> (เฉพาะตัวเลข)</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      name="amountNeeded"
                      value={formData.amountNeeded}
                      onChange={handleNumericChange('amountNeeded', 7)}
                      placeholder="ระบุตัวเลข เช่น 3000 หรือ 5000"
                      className={`${inputClass} pr-14 font-bold text-base text-[#002f61]`}
                    />
                    <span className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-400">บาท</span>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>รูปแบบการรับเงินโอน</label>
                  <select
                    name="payoutType"
                    value={formData.payoutType}
                    onChange={handleChange}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="พร้อมเพย์ (PromptPay)">พร้อมเพย์ (ผูกเบอร์โทรหรือเลข ปชช.)</option>
                    <option value="ธนาคารกรุงไทย">บัญชีธนาคารกรุงไทย</option>
                    <option value="ธนาคารไทยพาณิชย์">บัญชีธนาคารไทยพาณิชย์</option>
                    <option value="ธนาคารกสิกรไทย">บัญชีธนาคารกสิกรไทย</option>
                    <option value="ธนาคารอื่น ๆ">บัญชีธนาคารอื่น ๆ</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>หมายเลขบัญชี / เบอร์พร้อมเพย์ <span className="text-rose-500">*</span> (เฉพาะตัวเลข/ขีด)</label>
                  <input
                    type="text"
                    required
                    name="payoutAccount"
                    value={formData.payoutAccount}
                    onChange={handleAccountChange}
                    placeholder="กรอกหมายเลขบัญชี หรือเบอร์พร้อมเพย์"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* ส่วนที่ 4: เอกสารแนบหลักฐาน (ถ้ามี) */}
            <div>
              <p className={sectionLabelClass}>
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#004c99] flex items-center justify-center text-xs font-black">4</span>
                เอกสารหรือหลักฐานประกอบ (ถ้ามี)
              </p>

              <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 text-lg">
                    📎
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {formData.attachmentName || 'แนบภาพถ่ายบิลค่าใช้จ่าย หรือหนังสือรับรอง'}
                    </p>
                    <p className="text-[11px] text-slate-400">รองรับไฟล์ JPG, PNG, PDF ขนาดไม่เกิน 10MB</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {formData.attachmentName && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, attachmentName: '' }))}
                      className="px-3 py-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition"
                    >
                      ลบไฟล์
                    </button>
                  )}
                  <label className="px-4 py-2 bg-white border border-slate-300 hover:border-[#004c99] text-[#004c99] text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition">
                    เลือกไฟล์
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* การยอมรับเงื่อนไข */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="w-4 h-4 mt-0.5 text-[#004c99] rounded border-slate-300 focus:ring-[#004c99]"
                />
                <span className="text-xs text-slate-600 leading-relaxed font-medium">
                  ข้าพเจ้าขอรับรองว่าข้อมูลและรายละเอียดความเดือดร้อนที่ได้ระบุไว้ในแบบฟอร์มนี้เป็นความจริงทุกประการ และยินยอมให้คณะกรรมการสวัสดิการนำข้อมูลไปใช้เพื่อพิจารณาความช่วยเหลือ
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-100">
              <a 
                href="/" 
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition text-center"
              >
                ยกเลิก
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 bg-gradient-to-r from-[#00366f] to-[#004c99] hover:brightness-110 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <span>กำลังส่งข้อมูลเข้าสู่ระบบ...</span>
                ) : (
                  <>
                    <span>ส่งคำร้องขอความช่วยเหลือ</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </main>

      {/* Success Modal Confirmation Dialog */}
      {submittedData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 border border-slate-200 shadow-2xl relative text-center">
            
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
              ✓
            </div>

            <h3 className="text-xl font-black text-[#002f61] mb-1">ส่งคำร้องเรียบร้อยแล้ว</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              ระบบได้บันทึกคำร้องและส่งการแจ้งเตือนไปยังแอดมินสาขาวิชาเรียบร้อยแล้ว กรุณาบันทึกรหัสติดตามคำร้องด้านล่างเพื่อตรวจสอบผล
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 text-left space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-400">รหัสติดตามคำร้อง (Tracking No.)</span>
                <button
                  onClick={() => handleCopy(submittedData.trackingNo)}
                  className="text-xs font-bold text-[#004c99] hover:underline cursor-pointer"
                >
                  {copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                </button>
              </div>
              <p className="text-base font-black text-[#002f61] tracking-wider text-center py-1">
                {submittedData.trackingNo}
              </p>
              <div className="text-xs space-y-1 pt-1 text-slate-600 border-t border-slate-200/60">
                <p><strong>ผู้ยื่น:</strong> {submittedData.name} ({submittedData.studentId})</p>
                <p><strong>วงเงินที่ขอรับ:</strong> <span className="text-emerald-700 font-bold">{submittedData.amountRequested}</span></p>
                <p><strong>สถานะปัจจุบัน:</strong> <span className="text-[#004c99] font-bold">{submittedData.status}</span></p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                พิมพ์สลิปยืนยัน
              </button>
              <a
                href="/scholarship/student"
                className="flex-1 py-3 bg-[#004c99] hover:bg-[#00366f] text-white rounded-xl text-xs font-bold transition shadow-xs text-center"
              >
                ไปหน้าติดตามสถานะ
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p className="font-semibold">กองพัฒนานักศึกษา มหาวิทยาลัยแม่โจ้ (Student Welfare Protection &copy; 2026)</p>
      </footer>
    </div>
  );
}