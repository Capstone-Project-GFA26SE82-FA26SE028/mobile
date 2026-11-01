export type Envelope<T> = { isSuccess: boolean; message: string; result: T };
export type PageResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};
