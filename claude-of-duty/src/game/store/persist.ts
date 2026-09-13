interface KV { getItem(k: string): string | null; setItem(k: string, v: string): void }
const mem = new Map<string, string>();
let kv: KV | null = null;

function storage(): KV {
  if (kv) return kv;
  try {
    const { MMKV } = require('react-native-mmkv');
    const inst = new MMKV();
    kv = { getItem: (k) => inst.getString(k) ?? null, setItem: (k, v) => inst.set(k, v) };
  } catch {
    kv = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  }
  return kv;
}

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage().getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
export function saveJSON(key: string, value: unknown) {
  try { storage().setItem(key, JSON.stringify(value)); } catch {}
}
