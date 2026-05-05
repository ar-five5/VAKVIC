const resolveBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  const fallback = import.meta.env.PROD
    ? 'https://vakvic-backend.onrender.com'
    : 'http://localhost:3001';

  const base = (configured || fallback).replace(/\/+$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};

const BASE_URL = resolveBaseUrl();

const request = async (method, path, body = null) => {
  const token = localStorage.getItem('vakvic_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text || 'Request failed' };
  }
  if (!res.ok) throw { status: res.status, message: data.error?.message || data.message || 'Request failed' };
  return data;
};

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body);
export const patch = (path, body) => request('PATCH', path, body);
export const del = (path) => request('DELETE', path);
