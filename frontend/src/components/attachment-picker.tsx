'use client';

import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import { cx } from './ui';

export const ACCEPTED_FILES = '.jpg,.jpeg,.png,.webp,.pdf';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function checkFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP และ PDF';
  if (file.size > MAX_FILE_BYTES) return 'ไฟล์ต้องมีขนาดไม่เกิน 10 MB';
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** เลือกไฟล์หลักฐาน (ลากวางได้) — อัปโหลดหลังยื่นคำร้องสำเร็จผ่าน POST /api/v1/requests/:id/attachments */
export function AttachmentPicker({
  files,
  onChange,
  error,
  onError,
  max = 5,
  label = 'ไฟล์หลักฐานประกอบ (ถ้ามี)',
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  onError: (message: string) => void;
  max?: number;
  label?: string;
}) {
  const [dragging, setDragging] = useState(false);

  const add = (picked: File[]) => {
    for (const file of picked) {
      const problem = checkFile(file);
      if (problem) return onError(`${file.name}: ${problem}`);
    }
    if (files.length + picked.length > max) onError(`แนบได้สูงสุด ${max} ไฟล์`);
    else onError('');
    onChange([...files, ...picked].slice(0, max));
  };

  return (
    <div className="space-y-3">
      <span className="block text-label-md text-on-surface">{label}</span>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          add(Array.from(event.dataTransfer.files));
        }}
        className={cx(
          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragging ? 'border-primary-container bg-primary-container/10' : 'border-outline-variant hover:border-primary-container hover:bg-primary-container/5',
          files.length >= max && 'pointer-events-none opacity-50',
        )}
      >
        <UploadCloud className="h-8 w-8 text-primary-container" strokeWidth={1.6} aria-hidden="true" />
        <span className="text-label-md text-primary-container">ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์</span>
        <span className="text-label-sm font-normal text-on-surface-variant">
          JPG, PNG, WEBP, PDF · ไม่เกิน 10 MB ต่อไฟล์ · สูงสุด {max} ไฟล์ ({files.length}/{max})
        </span>
        <input
          type="file"
          accept={ACCEPTED_FILES}
          multiple
          className="sr-only"
          disabled={files.length >= max}
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? []);
            event.target.value = '';
            add(picked);
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const Icon = file.type.startsWith('image/') ? ImageIcon : FileText;
            return (
              <li key={`${file.name}-${index}`} className="fade-slide-up flex items-center gap-3 rounded-lg border border-outline-variant/40 bg-surface px-3 py-2">
                <Icon className="h-5 w-5 shrink-0 text-primary-container" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-md text-on-surface">{file.name}</span>
                  <span className="text-caption text-secondary">{formatBytes(file.size)}</span>
                </span>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-variant/50 hover:text-error"
                  aria-label={`ลบไฟล์ ${file.name}`}
                  onClick={() => onChange(files.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p className="text-label-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** อัปโหลดทีละไฟล์ คืนรายชื่อไฟล์ที่อัปโหลดไม่สำเร็จ */
export async function uploadAll(requestId: string, files: File[]): Promise<string[]> {
  const failed: string[] = [];
  for (const file of files) {
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(`/api/v1/requests/${requestId}/attachments`, {
      method: 'POST',
      body: form,
      credentials: 'same-origin',
    }).catch(() => null);
    if (!response || !response.ok) failed.push(file.name);
  }
  return failed;
}
