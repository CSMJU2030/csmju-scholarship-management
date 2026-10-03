/** ผลลัพธ์แบบ collection — interceptor แปลงเป็น { success, data[], meta{} } */
export class Paginated<T> {
  constructor(
    readonly items: T[],
    readonly total: number,
    readonly page: number,
    readonly limit: number,
  ) {}

  get meta() {
    return {
      total: this.total,
      page: this.page,
      limit: this.limit,
      totalPages: this.limit > 0 ? Math.ceil(this.total / this.limit) : 0,
    };
  }
}
