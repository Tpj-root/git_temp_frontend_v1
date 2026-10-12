// Tiny REST client. VITE_BACKEND (e.g. http://192.168.1.5:8010) overrides the Vite proxy.
const BASE: string = (import.meta as any).env?.VITE_BACKEND || '';
export async function api<T = any>(path: string, method = 'GET', body?: any): Promise<T> {
  const res = await fetch(BASE + path, {
    method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail ?? j); } catch {}
    throw new Error(`[${res.status}] ${msg}`);
  }
  return res.json();
}
export const wsUrl = () =>
  BASE ? BASE.replace(/^http/, 'ws') + '/stream'
       : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/stream`;
