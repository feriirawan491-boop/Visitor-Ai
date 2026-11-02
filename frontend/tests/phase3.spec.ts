import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
const settingsKey='visitor-ai.phase3.settings.v1';
async function ready(page:Page,route='monitor'){
  await page.goto(`/#${route}`);
  await expect(page.getByLabel('Mode akses demo')).toBeEnabled();
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('WS Live');
}
async function reviewTuning(page:Page,value:string,reason='Uji konfigurasi preview lounge'){
  await page.getByLabel('Detection confidence nilai',{exact:true}).fill(value);
  await page.getByRole('button',{name:'Tinjau perubahan',exact:true}).click();
  await page.getByLabel('Alasan perubahan tuning').fill(reason);
}

test('global period updates monitoring, visitor and history and survives reload',async({page})=>{
  await ready(page);
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await page.getByRole('button',{name:'Kemarin',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('1');
  await expect(page.locator('.metric-count-in .stat-value')).toHaveText('1');
  await expect(page.locator('.metric-count-out .stat-value')).toHaveText('1');
  await expect(page.locator('.metric-occupancy .stat-value')).toHaveText('3');
  await page.getByRole('button',{name:'Visitor',exact:true}).click();
  await expect(page.locator('.identity-table tbody tr')).toHaveCount(1);
  await expect(page.getByLabel('Tanggal awal visitor')).toHaveValue('2026-10-28');
  await page.getByRole('button',{name:'History',exact:true}).click();
  await expect(page.locator('.history-table tbody tr')).toHaveCount(2);
  await page.reload();
  await expect(page.getByLabel('Tanggal awal global')).toHaveValue('2026-10-28');
  await expect(page.locator('.history-table tbody tr')).toHaveCount(2);
});

test('invalid date draft is rejected without changing the active KPI range',async({page})=>{
  await ready(page);
  await page.getByLabel('Tanggal awal global').fill('2026-10-30');
  await page.getByRole('button',{name:'Terapkan',exact:true}).click();
  await expect(page.locator('.global-filter-error')).toContainText('Tanggal awal');
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await expect(page).not.toHaveURL(/from=2026-10-30/);
});

test('history filtering, pagination, snapshot and visitor references work',async({page})=>{
  await ready(page,'history');
  await expect(page.locator('.history-table tbody tr')).toHaveCount(8);
  await page.getByRole('button',{name:'Halaman berikutnya'}).click();
  await expect(page.locator('.identity-pagination')).toContainText('Halaman 2');
  await page.getByLabel('Jenis event history').selectOption('VISITOR_ENTER');
  await page.getByLabel('Kamera history').selectOption('1');
  await expect(page.locator('.history-table tbody tr')).toHaveCount(8);
  await page.getByLabel('Cari history',{exact:true}).fill('VIS000004');
  await expect(page.locator('.history-table tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:/^Snapshot /}).click();
  await expect(page.getByRole('dialog')).toContainText('Snapshot tidak tersedia');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'VIS000004 ↗',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('VIS000004');
  await expect(page).toHaveURL(/\/visitors\/VIS000004$/);
});

test('history employee reference opens filtered employee directory',async({page})=>{
  await ready(page,'history');
  await page.getByLabel('Jenis event history').selectOption('EMPLOYEE_IDENTIFIED');
  await page.getByRole('button',{name:'EMP00001 ↗',exact:true}).click();
  await expect(page.getByLabel('Cari employee',{exact:true})).toHaveValue('EMP00001');
  await expect(page.locator('.identity-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.identity-table')).toContainText('Alya Pratama');
});

test('tuning validates range, reviews changes, persists values and adds audit to history',async({page})=>{
  await ready(page,'settings');
  await page.getByLabel('Detection confidence nilai',{exact:true}).fill('1.5');
  await expect(page.locator('.identity-validation')).toContainText('0.1–0.95');
  await expect(page.getByRole('button',{name:'Tinjau perubahan',exact:true})).toBeDisabled();
  await page.getByLabel('Detection confidence nilai',{exact:true}).fill('0.65');
  await page.getByRole('button',{name:'Tinjau perubahan',exact:true}).click();
  await page.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Alasan perubahan');
  await page.getByLabel('Alasan perubahan tuning').fill('Menyesuaikan preview kondisi lounge');
  await page.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.65');
  await expect(page.locator('.config-audit-list')).toContainText('Menyesuaikan preview kondisi lounge');
  await page.getByRole('button',{name:'History',exact:true}).click();
  // New audit records use actual browser time; include dates beyond the historical fixture day.
  await page.getByRole('button',{name:'Semua data',exact:true}).click();
  await page.getByLabel('Jenis event history').selectOption('CONFIG_UPDATED');
  await expect(page.locator('.history-table')).toContainText('CONFIG-2');
  await expect(page.locator('.history-table')).toContainText('Menyesuaikan preview kondisi lounge');
});

test('rollback is reviewed and creates a new version, rather than erasing audit',async({page})=>{
  await ready(page,'settings');
  await reviewTuning(page,'0.65');
  await page.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Siapkan rollback',exact:true}).click();
  await page.getByRole('button',{name:'Tinjau perubahan',exact:true}).click();
  await page.getByLabel('Alasan perubahan tuning').fill('Kembali ke konfigurasi sebelumnya');
  await page.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.55');
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),settingsKey);
  expect(saved.version).toBe(3);expect(saved.audit).toHaveLength(2);expect(saved.audit[1].action).toBe('rollback');
});

test('concurrent tuning changes preserve draft and require loading the latest version',async({page,context})=>{
  await ready(page,'settings');
  await page.getByLabel('Detection confidence nilai',{exact:true}).fill('0.7');
  const other=await context.newPage();await ready(other,'settings');
  await reviewTuning(other,'0.65','Perubahan dari tab lain');
  await other.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(other.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.settings-conflict')).toContainText('berubah di tab lain');
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.7');
  await expect(page.getByRole('button',{name:'Tinjau perubahan',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Muat versi terbaru',exact:true}).click();
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.65');
});

test('read only and failed save do not mutate tuning values',async({page})=>{
  await ready(page,'settings');
  await page.getByLabel('Mode akses demo').selectOption('viewer');
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Muat default demo'})).toBeDisabled();
  await page.getByLabel('Mode akses demo').selectOption('tech');
  await reviewTuning(page,'0.65');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Penyimpanan penuh','QuotaExceededError');};});
  await page.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Penyimpanan penuh');
  expect(await page.evaluate(key=>localStorage.getItem(key),settingsKey)).toBeNull();
  await page.getByRole('button',{name:'Kembali',exact:true}).click();
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.65');
});

test('WS failures reach polling after two attempts and recovery stops the polling timer',async({page})=>{
  await ready(page,'health');
  await page.getByLabel('Skenario koneksi realtime').selectOption('ws_down');
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('Reconnecting');
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('Polling Fallback');
  await expect(page.locator('.realtime-diagnostics>span').filter({hasText:'Reconnect'})).toContainText('2/2');
  await expect(page.locator('.realtime-diagnostics>span').filter({hasText:'Polling timer'})).toContainText('Aktif');
  await page.getByLabel('Skenario koneksi realtime').selectOption('healthy');
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('WS Live');
  await expect(page.locator('.realtime-diagnostics>span').filter({hasText:'Polling timer'})).toContainText('Tidak aktif');
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await page.getByRole('button',{name:'History',exact:true}).click();
  const ids=await page.locator('.history-table tbody tr').evaluateAll(rows=>rows.map(row=>row.getAttribute('data-event-id')));
  expect(new Set(ids).size).toBe(ids.length);
});

test('offline/stale and camera gaps retain known data and do not claim zero missing traffic',async({page})=>{
  await ready(page,'health');
  await page.getByLabel('Skenario koneksi realtime').selectOption('stale');
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('Stale');
  await page.getByLabel('Skenario koneksi realtime').selectOption('offline');
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await page.getByLabel('Tanggal awal global').fill('2026-11-01');
  await page.getByLabel('Tanggal akhir global').fill('2026-11-01');
  await page.getByRole('button',{name:'Terapkan',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('—');
  await page.getByRole('button',{name:'History',exact:true}).click();
  await expect(page.locator('.history-gap')).toContainText('tidak dianggap traffic nol');
  await expect(page.locator('.identity-empty')).toContainText('tidak membuktikan tidak ada pergerakan');
});

test('session/revocation scenarios clear sensitive content and recover explicitly',async({page})=>{
  await ready(page,'health');
  for(const scenario of ['expired','revoked','unavailable']){
    await page.getByLabel('Skenario koneksi realtime').selectOption(scenario);
    await expect(page.locator('.access-state')).toBeVisible();
    await expect(page.locator('.identity-page')).toHaveCount(0);
    await expect(page.locator('.camera-scene')).toHaveCount(0);
    await expect(page.locator('.realtime-lab')).toHaveCount(0);
    await page.getByRole('button',{name:'Kembali ke workspace demo',exact:true}).click();
    await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('WS Live');
  }
});

test('telemetry failure is visible without blocking camera or local data refresh',async({page})=>{
  await ready(page,'health');
  await page.getByLabel('Skenario telemetry').selectOption('failed');
  await expect(page.locator('.telemetry-warning')).toContainText('tetap berjalan');
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('WS Live');
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.locator('.camera-cover')).toHaveCount(0);
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
});

test('rapid period changes settle on the latest scope without stale overwrites',async({page})=>{
  await ready(page);
  await page.getByRole('button',{name:'Kemarin',exact:true}).click();
  await page.getByRole('button',{name:'7 hari terakhir',exact:true}).click();
  await page.getByRole('button',{name:'Hari ini',exact:true}).click();
  await expect(page.getByRole('region',{name:'Status realtime demo'})).toContainText('WS Live');
  await expect(page.locator('.connection-bar')).toHaveAttribute('data-scope',`SITE-001:admin_site:${JSON.stringify({from:'2026-10-29',to:'2026-10-29'})}`);
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
});

test('operations screens fit desktop/mobile in both themes and report no browser errors',async({page})=>{
  test.setTimeout(90000);const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await ready(page,'history');await page.evaluate(()=>document.fonts.ready);
  await page.setViewportSize({width:1440,height:1100});
  await page.screenshot({path:'test-results/phase3-history.png',fullPage:true});
  for(const theme of ['light','dark'] as const){await page.emulateMedia({colorScheme:theme});for(const route of ['monitor','history','settings','health']){
    await page.goto(`/#${route}`);await expect(page.getByRole('region',{name:'Status realtime demo'})).toBeVisible();
    for(const width of [1440,1024,768,390,360]){await page.setViewportSize({width,height:1000});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  }}
  await page.goto('/#settings');await page.setViewportSize({width:1440,height:1100});
  await page.screenshot({path:'test-results/phase3-settings-dark.png',fullPage:true});
  await page.setViewportSize({width:360,height:844});
  await reviewTuning(page,'0.65');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/phase3-review-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
