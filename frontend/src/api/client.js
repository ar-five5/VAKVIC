const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const request = async (method, path, body = null) => {
  const token = localStorage.getItem('vakvic_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error?.message || data.message || 'Request failed' };
  return data;
};

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body);
export const patch = (path, body) => request('PATCH', path, body);
export const del = (path) => request('DELETE', path);
