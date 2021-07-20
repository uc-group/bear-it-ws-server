import axios, { AxiosRequestConfig } from 'axios';

export default interface BearitSuccessResponse<T> {
  status: 'OK',
  data: T
}

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (
  axios.get<BearitSuccessResponse<T>>(url, config).then((r) => r.data.data)
);

export const post = async <T, K = any>(
  url: string,
  data: K,
  config?: AxiosRequestConfig,
): Promise<T> => (
  axios.post<BearitSuccessResponse<T>>(url, data, config).then((r) => r.data.data)
);

export const put = async <T, K = any>(
  url: string,
  data: K,
  config?: AxiosRequestConfig,
): Promise<T> => (
  axios.put<BearitSuccessResponse<T>>(url, data, config).then((r) => r.data.data)
);

export const doDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (
  axios.delete<BearitSuccessResponse<T>>(url, config).then((r) => r.data.data)
);
