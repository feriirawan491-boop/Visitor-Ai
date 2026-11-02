/** Compile-time configuration; this project intentionally supports demo adapters only. */
export function validateReleaseConfig(env = {}) {
  const mode = env.NEXT_PUBLIC_APP_MODE ?? 'demo';
  const source = env.NEXT_PUBLIC_DATA_SOURCE ?? 'demo';
  if (mode !== 'demo') throw new Error('NEXT_PUBLIC_APP_MODE: production belum tersedia; integrasi dan approval produksi wajib diselesaikan.');
  if (source !== 'demo') throw new Error('NEXT_PUBLIC_DATA_SOURCE: hanya adapter demo yang tersedia pada build ini.');
  const flag = (key) => {
    const value = env[key] ?? 'true';
    if (value !== 'true' && value !== 'false') throw new Error(`${key}: gunakan true atau false.`);
    return value === 'true';
  };
  const forbidden = Object.keys(env).filter(key => /^NEXT_PUBLIC_.*(SECRET|PASSWORD|TOKEN|CREDENTIAL|RTSP)/i.test(key) && env[key]);
  if (forbidden.length) throw new Error('Konfigurasi publik tidak boleh memuat secret, token, password, credential, atau RTSP. Nilai tidak dicetak.');
  const features = {
    access: flag('NEXT_PUBLIC_PHASE4_ACCESS_ENABLED'),
    analytics: flag('NEXT_PUBLIC_PHASE5_ANALYTICS_ENABLED'),
    provider: flag('NEXT_PUBLIC_PHASE6_PROVIDER_ENABLED'),
    definitions: flag('NEXT_PUBLIC_PHASE7_DEFINITIONS_ENABLED'),
  };
  return { mode: 'demo', source: 'demo', features, profile: JSON.stringify(features) };
}
