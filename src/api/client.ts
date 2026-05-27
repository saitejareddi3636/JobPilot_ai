import { supabase } from '../auth/supabase';

const defaultApiBase = 'http://localhost:3001/api/v1';

function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') || defaultApiBase;
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

async function getAccessToken() {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  return localStorage.getItem('jobpilot_demo_token');
}

async function buildHeaders(initHeaders?: HeadersInit) {
  const token = await getAccessToken();

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...initHeaders,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? response.statusText;
    throw new Error(message);
  }

  return payload;
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await buildHeaders();
  const response = await fetch(buildUrl(path), {
    headers,
  });

  return parseResponse<T>(response);
}

export async function apiSend<T>(path: string, init: RequestInit): Promise<T> {
  const headers = await buildHeaders(init.headers);
  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  return parseResponse<T>(response);
}

export async function apiJson<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
  return apiSend<T>(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
