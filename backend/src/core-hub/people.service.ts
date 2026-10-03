import { Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { CoreHubClient } from './core-hub.client';

/** บุคคลจาก Core Hub (reference-data.md ข้อ 5.1) — ใช้แสดงผลเท่านั้น ห้ามเก็บลงฐานและห้าม cache */
export interface CorePerson {
  personCode: string;
  personType: string;
  staffType?: string | null;
  academicTitle?: string | null;
  fullNameTh: string;
  fullNameEn?: string | null;
  universityEmail?: string | null;
  entryYear?: number | null;
  status: string;
  faculty?: { code: string; nameTh: string } | null;
  department?: { code: string; nameTh: string } | null;
  curriculum?: { code: string; nameTh: string; curriculumYear?: number | null } | null;
}

/** ตัดเหลือเฉพาะ field ที่หน้าเว็บใช้ — ไม่ส่ง coreUserId หรือข้อมูลอื่นที่ไม่จำเป็นต่อ */
export function toPersonView(person: CorePerson) {
  return {
    personCode: person.personCode,
    personType: person.personType,
    fullNameTh: person.fullNameTh,
    fullNameEn: person.fullNameEn ?? null,
    entryYear: person.entryYear ?? null,
    status: person.status,
    facultyCode: person.faculty?.code ?? null,
    facultyName: person.faculty?.nameTh ?? null,
    departmentCode: person.department?.code ?? null,
    departmentName: person.department?.nameTh ?? null,
    curriculumName: person.curriculum?.nameTh ?? null,
    universityEmail: person.universityEmail ?? null,
  };
}
export type PersonView = ReturnType<typeof toPersonView>;

const PERSON_CODE = /^[A-Za-z0-9._-]{1,64}$/;

@Injectable()
export class PeopleService {
  constructor(private readonly coreHub: CoreHubClient) {}

  /** บุคคลที่ผูกกับบัญชีผู้เรียก · ยังไม่ผูก = null · guest = 403 จาก Core Hub */
  async me(token: string): Promise<CorePerson | null> {
    return (await this.coreHub.get<CorePerson | null>('/people/me', token)) ?? null;
  }

  /**
   * ใช้ตอนแสดงผลเท่านั้น (staff/lecturer/admin) — ไม่มีสิทธิ์ · ไม่พบ · Core Hub ล่ม → null ให้หน้าเว็บแสดง person_code แทน
   * 401 ยังส่งต่อ เพื่อให้หน้าเว็บพา SSO ใหม่
   */
  async findForDisplay(personCode: string, token: string): Promise<CorePerson | null> {
    if (!PERSON_CODE.test(personCode)) return null;
    try {
      return await this.coreHub.get<CorePerson>(`/people/${encodeURIComponent(personCode)}`, token);
    } catch (error) {
      if (error instanceof ApiException && error.code === 'UNAUTHORIZED') throw error;
      return null;
    }
  }
}
