'use client';

/** สร้างไฟล์ CSV (UTF-8 + BOM ให้ Excel อ่านภาษาไทยถูก) แล้วดาวน์โหลดในเบราว์เซอร์ */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    // กันสูตร Excel (CSV injection) และ escape เครื่องหมายคำพูด
    const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const body = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  const blob = new Blob(['﻿', body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
