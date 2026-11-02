export type Point = { x: number; y: number };
export type GateConfig = { mode: 'line' | 'partial_line' | 'polygon' | 'near'; lineA: number; lineB: number; xStart: number; xEnd: number; threshold: number; dwell: number; hysteresis: number; guard: 'none' | 'left' | 'right'; policy: 'receding' | 'always'; points: Point[]; version: number; savedAt: string | null };
export type CameraState = 'active' | 'offline' | 'stale' | 'connecting';
export const modes = { line: 'Two-line gate', partial_line: 'Partial line', polygon: 'Polygon zone', near: 'Near mode' };
export const defaultGate: GateConfig = { mode: 'line', lineA: 49, lineB: 72, xStart: 15, xEnd: 85, threshold: 60, dwell: 500, hysteresis: 8, guard: 'none', policy: 'receding', points: [{ x: 22, y: 38 }, { x: 78, y: 38 }, { x: 88, y: 85 }, { x: 12, y: 85 }], version: 1, savedAt: null };
export const storageKey = (id: number,siteId='SITE-001') => `visitor-ai.phase1.gate.${id}${siteId==='SITE-001'?'':`.${siteId}`}`;
export function validGate(c: unknown): c is GateConfig {
  if (!c || typeof c !== 'object') return false;
  const v = c as GateConfig;
  return Object.hasOwn(modes, v.mode) && [v.lineA, v.lineB, v.xStart, v.xEnd, v.threshold, v.hysteresis].every(n => Number.isFinite(n) && n >= 0 && n <= 100) && Number.isFinite(v.dwell) && v.dwell >= 0 && v.dwell <= 3000 && Number.isInteger(v.version) && v.version > 0 && ['none','left','right'].includes(v.guard) && ['receding','always'].includes(v.policy) && (v.savedAt === null || typeof v.savedAt === 'string') && Array.isArray(v.points) && v.points.length <= 12 && v.points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100);
}
export function readGate(id: number,siteId='SITE-001'): GateConfig {
  const raw = localStorage.getItem(storageKey(id,siteId));
  if (!raw) return structuredClone(defaultGate);
  const data: unknown = JSON.parse(raw);
  if (!validGate(data)) throw new Error('Konfigurasi tersimpan tidak valid.');
  return data;
}
function orientation(a: Point, b: Point, c: Point) { return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x); }
export function gateError(c: GateConfig): string | null {
  if (!validGate(c)) return 'Nilai konfigurasi di luar rentang.';
  if (c.mode === 'line' || c.mode === 'partial_line') {
    if (c.lineA + 5 > c.lineB) return 'Garis B harus minimal 5% di bawah garis A.';
    if (c.mode === 'partial_line' && c.xStart + 10 > c.xEnd) return 'Lebar segmen minimal 10%.';
  }
  if (c.mode === 'polygon') {
    if (c.points.length < 3) return 'Polygon membutuhkan minimal 3 titik.';
    const p = c.points;
    const area = Math.abs(p.reduce((a,v,i) => a + v.x*p[(i+1)%p.length].y - p[(i+1)%p.length].x*v.y,0)) / 2;
    if (area < 100) return 'Area polygon terlalu kecil atau titik saling bertumpuk.';
    for (let i=0;i<p.length;i++) for(let j=i+2;j<p.length;j++) {
      if(i===0 && j===p.length-1) continue;
      const [a,b,c,d] = [p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]];
      if(orientation(a,b,c)*orientation(a,b,d)<=0 && orientation(c,d,a)*orientation(c,d,b)<=0) return 'Sisi polygon tidak boleh saling berpotongan.';
    }
  }
  if(c.mode==='near' && (c.threshold < 10 || c.hysteresis >= c.threshold)) return 'Threshold minimal 10% dan hysteresis harus lebih kecil dari threshold.';
  return null;
}
export const demoEvents = [
  { time: '10:42:38', track: 'TRK-0248', camera: 1, direction: 'IN', note: 'Crossing A → B tervalidasi', mode: 'Two-line gate' },
  { time: '10:42:21', track: 'TRK-0176', camera: 2, direction: 'OUT', note: 'Crossing A → B tervalidasi', mode: 'Two-line gate' },
  { time: '10:41:56', track: 'TRK-0247', camera: 1, direction: 'IN', note: 'Crossing A → B tervalidasi', mode: 'Two-line gate' },
  { time: '10:41:32', track: 'TRK-0246', camera: 1, direction: 'SKIP', note: 'Gerakan berbalik • tidak dihitung', mode: 'Two-line gate' },
];
