import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/config';

/**
 * Servicio centralizado de API.
 * - Lee API_BASE_URL de variable de entorno (nunca hardcode).
 * - Inyecta JWT en header Authorization desde el sessionStore.
 * - Maneja errores con códigos del contrato OCC.
 */

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void | Promise<void>;

let getToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureApi(opts: { getToken: TokenGetter; onUnauthorized?: UnauthorizedHandler }) {
  getToken = opts.getToken;
  if (opts.onUnauthorized) onUnauthorized = opts.onUnauthorized;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      await onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export type ApiError = {
  status: number;
  code: string;
  message: string;
};

export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    const code = err.response?.data?.error?.code ?? 'NETWORK_ERROR';
    const message = err.response?.data?.error?.message ?? err.message;
    return { status, code, message };
  }
  return { status: 0, code: 'UNKNOWN', message: String(err) };
}
