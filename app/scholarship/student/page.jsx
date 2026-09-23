"use client";

import React, { useState, useEffect, useMemo } from 'react';

export default function ScholarshipStudentPage() {
  const [searchId, setSearchId] = useState('');
  const [searchedResults, setSearchedResults] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // สำหรับเปิดดูรูปภาพขนาดเต็ม

  // รายการคำร้องทั้งหมด
  const [allRequests, setAllRequests] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('welfare_requests') || '[]');
      if (Array.isArray(saved)) {
        setAllRequests(saved);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    }
  }, []);

  // กรองเฉพาะรหัสที่ไม่ซ้ำกันสำหรับปุ่มค้นหาด่วน
  const uniqueApplicants = useMemo(() => {
    const seen = new Set();
    return allRequests.filter(item => {
      const id = item.studentId?.trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [allRequests]);

  const performSearch = (idToSearch) => {
    const cleanId = idToSearch.trim();
    if (!cleanId) return;

    setHasSearched(true);
    const matches = allRequests.filter(item => 
      (item.studentId && item.studentId.trim() === cleanId) || 
      (item.trackingNo && item.trackingNo.toLowerCase().includes(cleanId.toLowerCase()))
    );

    setSearchedResults(matches);
    setSelectedRequest(matches.length > 0 ? matches[0] : null);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchId);
  };

  const handleCopyTracking = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusBadge = (status = '') => {
    if (status.includes('อนุมัติเบิกจ่าย') || status.includes('เรียบร้อย')) {
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          {status}
        </span>
      );
    }
    if (status.includes('ผ่านการอนุมัติขั้นต้น')) {
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        {status || 'รอตรวจสอบ'}
      </span>
    );
  };

  // ดึงที่อยู่ของไฟล์แนบ (รองรับทั้งชื่อไฟล์ฟอร์มฉุกเฉินและฟอร์มสมัครทุน)
  const attachedFile = selectedRequest?.attachment || selectedRequest?.incomeEvidence || selectedRequest?.fileData;
  const isImageFile = attachedFile && (
    attachedFile.startsWith('data:image') || 
    /\.(jpg|jpeg|png|webp|gif)$/i.test(attachedFile)
  );

  return (
    <div className="min-h-screen bg-[#f7f9fd] text-[#1a2332] font-sans flex flex-col justify-between selection:bg-[#004c99] selection:text-white">
      {/* Navbar */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#00366f] to-[#0066cc] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md shadow-blue-900/10">
              MJU
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg text-[#002f61] leading-tight">Student Scholarship Portal</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-[#004c99] rounded-md uppercase tracking-wider">v2.4</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">ระบบติดตามสถานะคำร้องทุน สาขาวิทยาการคอมพิวเตอร์</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowContactModal(true)}
              className="px-4 py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:border-[#004c99] hover:text-[#004c99] transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <i className="fa-solid fa-headset text-[#004c99]"></i>
              <span>ติดต่อฝ่ายทุน</span>
            </button>
            <a
              href="/"
              className="px-4 py-2 bg-[#004c99] text-white text-xs font-semibold rounded-xl hover:bg-[#00366f] transition-all shadow-sm active:scale-95"
            >
              กลับหน้าหลัก
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 w-full flex-grow">
        
        {/* Banner + Search Hero */}
        <section className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-blue-100/60 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none"></div>

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-semibold text-[#004c99] mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ระบบตรวจสอบสถานะพิจารณาทุนการศึกษาแบบเรียลไทม์
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-[#002f61] tracking-tight mb-3">
              ตรวจสอบสถานะคำร้องของคุณ
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium mb-8">
              พิมพ์รหัสนักศึกษา 10 หลัก หรือ รหัสติดตามคำร้อง (Tracking No.) เพื่อตรวจสอบผลการดำเนินงาน
            </p>

            {/* Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-lg mx-auto mb-5">
              <div className="flex rounded-2xl shadow-sm border border-slate-300 focus-within:border-[#004c99] focus-within:ring-4 focus-within:ring-blue-100 transition-all bg-white p-1.5">
                <input
                  type="text"
                  required
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="กรอกรหัสนักศึกษา เช่น 6704101310"
                  className="w-full px-4 py-3 text-sm text-[#002f61] font-semibold focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#00366f] to-[#004c99] text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <span>ค้นหาข้อมูล</span>
                </button>
              </div>
            </form>

            {/* ปุ่มทดลองค้นหาด่วน */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">ผู้ยื่นคำร้องล่าสุด:</span>
              {uniqueApplicants.length > 0 ? (
                uniqueApplicants.map((req) => (
                  <button
                    key={req.id || req.studentId}
                    type="button"
                    onClick={() => {
                      setSearchId(req.studentId);
                      performSearch(req.studentId);
                    }}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[#004c99] font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                  >
                    <i className="fa-regular fa-user text-[10px] text-slate-400"></i>
                    <span>{req.studentId}</span>
                    <span className="text-slate-500 font-normal">({req.name ? req.name.split(' ')[0] : 'ผู้ยื่นคำร้อง'})</span>
                  </button>
                ))
              ) : (
                <span className="text-slate-400 italic text-[11px]">
                  ยังไม่มีประวัติการสมัครในระบบ (รอการยื่นคำร้องใหม่)
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Results Workspace */}
        {hasSearched && (
          searchedResults.length > 0 && selectedRequest ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              
              {/* Multi-Request Switcher Tabs */}
              {searchedResults.length > 1 && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2 overflow-x-auto shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap pl-2">
                    พบ {searchedResults.length} คำร้อง:
                  </span>
                  {searchedResults.map((req) => (
                    <button
                      key={req.id || req.date}
                      onClick={() => setSelectedRequest(req)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        selectedRequest.id === req.id
                          ? 'bg-[#004c99] text-white shadow-sm'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {req.requestType || req.title || 'คำร้องขอรับทุน'} ({req.date})
                    </button>
                  ))}
                </div>
              )}

              {/* Main Card */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                
                {/* Header Card */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 bg-blue-100/70 text-[#004c99] rounded text-[11px] font-bold">
                        รหัสคำร้อง: {selectedRequest.trackingNo || `MJU-SCH-${selectedRequest.id || 'REQ'}`}
                      </span>
                      <button
                        onClick={() => handleCopyTracking(selectedRequest.trackingNo || `MJU-SCH-${selectedRequest.id || 'REQ'}`)}
                        className="text-slate-400 hover:text-[#004c99] text-xs transition-colors cursor-pointer"
                        title="คัดลอกรหัสคำร้อง"
                      >
                        <i className={copiedTracking ? "fa-solid fa-check text-emerald-500" : "fa-regular fa-copy"}></i>
                      </button>
                      {copiedTracking && <span className="text-[10px] text-emerald-600 font-bold">คัดลอกแล้ว!</span>}
                    </div>
                    <h3 className="text-2xl font-black text-[#002f61]">{selectedRequest.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      รหัสนักศึกษา: <span className="font-bold text-slate-700">{selectedRequest.studentId}</span> • {selectedRequest.year || 'ชั้นปีที่ 2'} • {selectedRequest.faculty || 'สาขาวิทยาการคอมพิวเตอร์'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:items-end gap-3 w-full md:w-auto">
                    {getStatusBadge(selectedRequest.status)}
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <i className="fa-solid fa-print"></i>
                      <span>พิมพ์ใบคำร้อง</span>
                    </button>
                  </div>
                </div>

                {/* Details Info Grid */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">ประเภทกองทุน / ความช่วยเหลือ</span>
                        <span className="text-xs font-extrabold text-[#004c99]">ยื่นเรื่องเมื่อ: {selectedRequest.date || 'ไม่ระบุวันที่'}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-[#002f61] mb-2">{selectedRequest.requestType || selectedRequest.title || 'คำร้องทั่วไป'}</h4>
                      <div className="border-t border-slate-200/80 pt-3">
                        <span className="text-[11px] font-bold text-slate-400 block mb-1">เหตุผลและความจำเป็นที่ระบุในคำร้อง:</span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200">
                          "{selectedRequest.reason || selectedRequest.description || 'ไม่มีรายละเอียดระบุไว้'}"
                        </p>
                      </div>
                    </div>

                    {/* ส่วนดึงรูปภาพ/เอกสารแนบมาแสดง */}
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#002f61] flex items-center gap-2">
                          <i className="fa-solid fa-paperclip text-[#004c99]"></i>
                          เอกสารและหลักฐานประกอบคำร้อง
                        </span>
                        {attachedFile && attachedFile !== 'ไม่มีเอกสารแนบ' && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#004c99] border border-blue-200">
                            แนบแล้ว
                          </span>
                        )}
                      </div>

                      {attachedFile && attachedFile !== 'ไม่มีเอกสารแนบ' ? (
                        <div className="space-y-3 pt-1">
                          {isImageFile ? (
                            <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group max-w-sm">
                              <img 
                                src={attachedFile} 
                                alt="หลักฐานประกอบคำร้อง" 
                                className="w-full h-44 object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                                onClick={() => setPreviewImage(attachedFile)}
                              />
                              <div 
                                onClick={() => setPreviewImage(attachedFile)}
                                className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer"
                              >
                                <i className="fa-solid fa-magnifying-glass-plus"></i>
                                <span>คลิกเพื่อดูรูปภาพขนาดเต็ม</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#004c99] flex items-center justify-center font-bold text-sm">
                                  <i className="fa-solid fa-file-pdf"></i>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{attachedFile}</p>
                                  <p className="text-[10px] text-slate-400">ไฟล์เอกสารหลักฐานแนบ</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50/80 border border-dashed border-slate-200 text-center">
                          <p className="text-xs text-slate-400 italic">ไม่มีไฟล์หรือภาพถ่ายแนบมากับคำร้องนี้</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-start gap-3">
                      <i className="fa-solid fa-circle-info text-amber-600 mt-0.5 text-base"></i>
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold">คำแนะนำสำหรับผู้ยื่นคำร้อง:</span> หากต้องการติดตามผลแบบเร่งด่วน หรือนำส่งเอกสารเพิ่มเติม สามารถติดต่อได้ที่ห้องพักอาจารย์สาขาวิทยาการคอมพิวเตอร์ อาคาร 60 ปี
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* ข้อมูลจำนวนเงิน */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-[#00366f] text-white shadow-md">
                      <span className="text-[11px] font-medium text-blue-200 block mb-1">จำนวนเงินที่เสนอขอรับทุน</span>
                      <div className="text-2xl font-black text-amber-300 tracking-tight mb-2">
                        {selectedRequest.amountRequested || selectedRequest.amount || 'ตามดุลยพินิจ'}
                      </div>
                      <p className="text-[11px] text-blue-100/80 leading-snug">
                        เบอร์โทรศัพท์ติดต่อ: {selectedRequest.phone || '-'}
                      </p>
                      {selectedRequest.payoutMethod && (
                        <p className="text-[11px] text-blue-200/90 mt-1">
                          ช่องทางโอน: {selectedRequest.payoutMethod}
                        </p>
                      )}
                    </div>

                    {/* กล่องศูนย์ช่วยเหลือนักศึกษา */}
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        ศูนย์ช่วยเหลือนักศึกษา
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        หากข้อมูลไม่ถูกต้อง หรือต้องการแจ้งเหตุฉุกเฉินเพิ่มเติม
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href="tel:053873820"
                          className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[#004c99] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
                        >
                          <i className="fa-solid fa-phone"></i>
                          <span>โทรสอบถาม</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setShowContactModal(true)}
                          className="p-2.5 rounded-xl bg-[#004c99] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-[#00366f] transition-all cursor-pointer shadow-xs"
                        >
                          <i className="fa-solid fa-comments"></i>
                          <span>จุดติดต่อ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Not Found Screen */
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-lg mx-auto shadow-sm animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-4 text-2xl border border-rose-100 shadow-xs">
                <i className="fa-solid fa-file-circle-question"></i>
              </div>
              <h3 className="font-bold text-[#002f61] text-lg mb-1">ไม่พบประวัติคำร้องในระบบ</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                ไม่พบข้อมูลคำร้องของรหัส <strong>"{searchId}"</strong> กรุณาตรวจสอบรหัสใหม่อีกครั้ง หรือเข้ากรอกแบบฟอร์มขอรับทุนการศึกษา
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <a 
                  href="/scholarship/welfare/form"
                  className="px-5 py-2.5 bg-[#004c99] text-white text-xs font-bold rounded-xl hover:bg-[#00366f] transition-all shadow-sm"
                >
                  <i className="fa-solid fa-pen-to-square mr-1.5"></i> กรอกคำร้องใหม่
                </a>
                <button
                  onClick={() => setSearchId('')}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  ล้างค่าค้นหา
                </button>
              </div>
            </div>
          )
        )}

      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
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
              alt="พรีวิวหลักฐานแนบ" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* Advisor Support Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-xl relative">
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition cursor-pointer"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#004c99] flex items-center justify-center font-bold">
                <i className="fa-solid fa-phone-volume"></i>
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-base">ติดต่อฝ่ายพัฒนานักศึกษา</h4>
                <p className="text-[11px] text-slate-500">สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์</p>
              </div>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-600">ห้องพักภาควิชา:</span>
                <span className="font-bold text-slate-800">อาคาร 60 ปี แม่โจ้ ชั้น 6</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="font-semibold text-slate-600">เบอร์โทรศัพท์ภายใน:</span>
                <span className="font-bold text-[#004c99]">053-873-820 ต่อ 104</span>
              </div>
            </div>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full mt-5 py-3 bg-[#004c99] text-white font-bold rounded-xl text-xs hover:bg-[#00366f] transition-all cursor-pointer"
            >
              รับทราบ / ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p className="font-medium">สาขาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้</p>
        <p className="text-[11px] text-slate-400 mt-1">Student Welfare & Scholarship Tracking System &copy; 2026</p>
      </footer>
    </div>
  );
}