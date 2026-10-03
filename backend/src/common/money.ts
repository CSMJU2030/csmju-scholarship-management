/** เงินเก็บเป็นจำนวนเต็ม "สตางค์" เสมอ (data-dictionary.md ข้อ 6) */
export const SATANG_PER_BAHT = 100;

export function formatBaht(satang: number): string {
  const baht = satang / SATANG_PER_BAHT;
  return baht.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** GPA เก็บเป็น "ร้อยส่วน" (Int) เช่น 3.25 → 325 เพื่อเลี่ยงทศนิยมในฐานข้อมูล */
export const toGpa = (hundredths: number | null | undefined): number | null =>
  hundredths === null || hundredths === undefined ? null : hundredths / 100;


/** แปลง GPA (0.00–4.00) เป็นร้อยส่วน */
export const fromGpa = (gpa: number): number => Math.round(gpa * 100);
