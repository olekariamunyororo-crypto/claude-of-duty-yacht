export const log = {
  info: (...a: unknown[]) => console.log('[codv]', ...a),
  warn: (...a: unknown[]) => console.warn('[codv]', ...a),
  error: (...a: unknown[]) => console.error('[codv]', ...a),
};
