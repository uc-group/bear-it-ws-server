import axios from 'axios';

export default interface BearitSuccessResponse<T> {
  status: 'OK',
  data: T
}

export const get = async <T>(url: string): Promise<T> => (
  axios.get<BearitSuccessResponse<T>>(url).then((r) => r.data.data)
);

export const post = async <T, K = any>(url: string, data: K): Promise<T> => (
  axios.post<BearitSuccessResponse<T>>(url, data).then((r) => r.data.data)
);
