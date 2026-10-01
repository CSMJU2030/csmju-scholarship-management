/** token ใช้ไม่ได้ด้วยเหตุใดก็ตาม → ตอบ 401 เสมอ (auth-contract.md ข้อ 4, 8) */
export class InvalidTokenError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = 'InvalidTokenError';
  }
}
