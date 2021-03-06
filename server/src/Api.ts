import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import restClient from './restClient';
import logger from './logger';

export default interface BearitSuccessResponse<T> {
  status: 'OK',
  data: T
}

export const handleError = (e: Error | AxiosError) => {
  if (Object.prototype.hasOwnProperty.call(e, 'response')) {
    const response = (e as AxiosError).response as AxiosResponse;
    logger.error(e.message, [
      response?.config?.method || '',
      `${response?.status}`,
      response?.statusText,
      response?.config?.baseURL || '',
    ]);
    logger.info(JSON.stringify(response?.config, null, 4));
    logger.debug(JSON.stringify(response?.data, null, 4));
  } else {
    logger.error(e.message);
  }
};

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (
  restClient.get<BearitSuccessResponse<T>>(url, config).then((r) => r.data.data)
    .catch((e) => {
      handleError(e);
      return Promise.reject(e);
    })
);

export const post = async <T, K = any>(
  url: string,
  data: K,
  config?: AxiosRequestConfig,
): Promise<T> => (
  restClient.post<BearitSuccessResponse<T>>(url, data, config).then((r) => r.data.data)
    .catch((e) => {
      handleError(e);
      return Promise.reject(e);
    })
);

export const put = async <T, K = any>(
  url: string,
  data: K,
  config?: AxiosRequestConfig,
): Promise<T> => (
  restClient.put<BearitSuccessResponse<T>>(url, data, config).then((r) => r.data.data)
    .catch((e) => {
      handleError(e);
      return Promise.reject(e);
    })
);

export const doDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => (
  restClient.delete<BearitSuccessResponse<T>>(url, config).then((r) => r.data.data)
    .catch((e) => {
      handleError(e);
      return Promise.reject(e);
    })
);
