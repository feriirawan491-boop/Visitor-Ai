import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';
test.use({launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']}});

const key='visitor-ai.phase2.identity.v1';
async function validPhoto(page:Page){const base64=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=48;canvas.height=48;const context=canvas.getContext('2d')!;context.fillStyle='#3b82f6';context.fillRect(0,0,48,48);return canvas.toDataURL('image/png').split(',')[1];});return Buffer.from(base64,'base64');}
async function visit(page:Page,hash='visitors'){
  await page.goto(`/#${hash}`);
  if(hash.includes('/'))await expect(page.getByRole('dialog')).toBeVisible();else await expect(page.getByLabel('Mode akses demo')).toBeEnabled();
}
async function prepareResolution(page:Page,id:string,kind:'new'|'existing'|'employee',target?:string){
  await page.locator(`[data-review="${id}"]`).click();
  await page.locator(`input[name="resolution-kind"][value="${kind}"]`).check();
  if(target)await page.getByLabel(kind==='employee'?'Pilih employee':'Pilih visitor existing',{exact:true}).selectOption(target);
  await page.getByLabel('Catatan konfirmasi',{exact:true}).fill('Ditinjau oleh operator untuk pengujian demo.');
  await page.getByRole('button',{name:'Tinjau keputusan',exact:true}).click();
}
async function readState(page:Page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);}

test('visitor search, pagination, date validation and recurring identity detail',async({page})=>{
  await visit(page);
  await expect(page.getByRole('heading',{name:'Visitor Directory',level:1})).toBeVisible();
  await expect(page.locator('.identity-table tbody tr')).toHaveCount(6);
  await page.getByRole('button',{name:'Halaman berikutnya'}).click();
  await expect(page.locator('.identity-table tbody tr')).toHaveCount(2);
  await page.getByLabel('Cari visitor',{exact:true}).fill('VIS000001');
  await expect(page.locator('.identity-table tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'Detail VIS000001',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('2 sesi');
  await expect(page.locator('.session-timeline article')).toHaveCount(2);
  await expect(page).toHaveURL(/\/visitors\/VIS000001$/);
  await page.reload();
  await expect(page.getByRole('dialog')).toContainText('VIS000001');
  await page.keyboard.press('Escape');
  await page.getByLabel('Tanggal awal visitor').fill('2026-10-30');
  await expect(page.locator('.identity-validation[role=alert]')).toContainText('Tanggal awal');
  await page.getByRole('button',{name:'Reset filter',exact:true}).click();
  await page.getByLabel('Status visitor').selectOption('inside');
  await expect(page.locator('.identity-table tbody tr')).toHaveCount(3);
});

test('missing/expired media, unknown deep link and incomplete sessions are explicit',async({page})=>{
  await visit(page,'visitors/VIS999999');
  await expect(page.getByRole('dialog')).toContainText('Visitor tidak ditemukan');
  await page.keyboard.press('Escape');
  await page.getByLabel('Cari visitor',{exact:true}).fill('VIS000004');
  await page.getByRole('button',{name:'Detail VIS000004',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Snapshot tidak tersedia');
  await page.keyboard.press('Escape');
  await page.getByLabel('Cari visitor',{exact:true}).fill('VIS000007');
  await page.getByRole('button',{name:'Detail VIS000007',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('Snapshot kedaluwarsa');
  await expect(page.getByRole('dialog')).toContainText('durasi belum final');
});

test('employee enrollment validates file contents and required fields',async({page})=>{
  await visit(page,'employees');
  await page.getByRole('button',{name:'Enroll employee',exact:true}).click();
  await page.getByRole('button',{name:'Tinjau enrollment',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('wajib diisi');
  await page.getByLabel('Upload foto employee').setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await expect(page.getByRole('alert')).toContainText('Isi file');
  await page.getByLabel('Upload foto employee').setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(5*1024*1024+1)});
  await expect(page.getByRole('alert')).toContainText('maksimal 5 MB');
});

test('employee upload persists without changing visitor counts; duplicate rejected',async({page})=>{
  await visit(page,'employees');
  const png=await validPhoto(page);
  await page.getByRole('button',{name:'Enroll employee',exact:true}).click();
  await page.getByLabel('Nama employee',{exact:true}).fill('Maya Putri');
  await page.getByLabel('Departemen',{exact:true}).fill('Guest Relations');
  await page.getByLabel('Jabatan',{exact:true}).fill('Lounge Host');
  await page.getByLabel('Upload foto employee').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:png});
  await expect(page.getByAltText('Preview foto enrollment')).toBeVisible();
  await page.getByRole('button',{name:'Tinjau enrollment',exact:true}).click();
  await page.getByRole('button',{name:'Konfirmasi enrollment',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.identity-table')).toContainText('Maya Putri');
  const state=await readState(page);
  expect(state.employees).toHaveLength(5);expect(state.visitors).toHaveLength(8);
  await page.reload();
  await expect(page.locator('.identity-table')).toContainText('EMP00005');
  await page.getByRole('button',{name:'Enroll employee',exact:true}).click();
  await page.getByLabel('Nama employee',{exact:true}).fill(' maya putri ');
  await page.getByLabel('Departemen',{exact:true}).fill('Guest Relations');
  await page.getByLabel('Jabatan',{exact:true}).fill('Lounge Host');
  await page.getByLabel('Upload foto employee').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:png});
  await expect(page.getByAltText('Preview foto enrollment')).toBeVisible();
  await page.getByRole('button',{name:'Tinjau enrollment',exact:true}).click();
  await page.getByRole('button',{name:'Konfirmasi enrollment',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('sudah terdaftar');
});

test('webcam denied state supports fallback upload',async({page})=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))});});
  await visit(page,'employees');
  await page.getByRole('button',{name:'Enroll employee',exact:true}).click();
  await page.getByRole('button',{name:'Webcam',exact:true}).click();
  await page.getByRole('button',{name:'Aktifkan webcam',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Akses kamera ditolak');
  await page.getByRole('button',{name:'Upload foto',exact:true}).click();
  await expect(page.getByRole('button',{name:'Pilih foto',exact:true})).toBeVisible();
});

test('link existing visitor keeps same ID and reconciles occupancy and event display',async({page})=>{
  await visit(page,'ambiguous');
  await expect(page.locator('.ambiguous-card')).toHaveCount(3);
  await prepareResolution(page,'AMB-0001','existing','VIS000001');
  await page.getByRole('button',{name:'Konfirmasi identitas',exact:true}).click();
  await expect(page.locator('.ambiguous-card')).toHaveCount(2);
  const state=await readState(page);
  expect(state.visitors).toHaveLength(8);
  expect(state.queue[0].resolution.targetId).toBe('VIS000001');
  expect(state.visitors[0].sessions).toHaveLength(3);
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await expect(page.locator('.metric-occupancy .stat-value')).toHaveText('4');
  // Resolution audit is stamped at actual browser time, beyond the fixed fixture period.
  await page.getByRole('button',{name:'Semua data',exact:true}).click();
  await expect(page.locator('tbody')).toContainText('VIS000001');
  await page.reload();
  await expect(page.locator('.metric-occupancy .stat-value')).toHaveText('4');
});

test('Cam2 unknown stays ambiguous until explicit manual decision; orphan exit has no duration',async({page})=>{
  await visit(page,'ambiguous');
  await prepareResolution(page,'AMB-0002','new');
  await page.getByRole('button',{name:'Konfirmasi identitas',exact:true}).click();
  await expect(page.locator('.ambiguous-card')).toHaveCount(2);
  const state=await readState(page);const created=state.visitors.find((v:{id:string})=>v.id==='VIS000009');
  expect(created.sessions[0].entry).toBe(null);expect(created.sessions[0].exit).toBeTruthy();
  await page.getByLabel('Status ambiguous').selectOption('resolved');
  await page.getByRole('button',{name:'Lihat visitor'}).click();
  await expect(page.getByRole('dialog')).toContainText('Entry belum tersedia · durasi tidak dihitung');
});

test('employee resolution excludes employees from visitor metrics',async({page})=>{
  await visit(page,'ambiguous');
  await prepareResolution(page,'AMB-0003','employee','EMP00001');
  await page.getByRole('button',{name:'Konfirmasi identitas',exact:true}).click();
  await expect(page.locator('.ambiguous-card')).toHaveCount(2);
  const state=await readState(page);expect(state.visitors).toHaveLength(8);
  expect(state.queue[2].resolution.kind).toBe('employee');
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await expect(page.locator('.metric-occupancy .stat-value')).toHaveText('3');
  await expect(page.locator('tbody')).toContainText('EMP00001');
});

test('concurrent resolutions do not overwrite another tab decision',async({page,context})=>{
  await visit(page,'ambiguous');
  const other=await context.newPage();await visit(other,'ambiguous');
  await prepareResolution(page,'AMB-0001','existing','VIS000001');
  await prepareResolution(other,'AMB-0001','employee','EMP00001');
  await page.getByRole('button',{name:'Konfirmasi identitas',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(other.getByRole('alert')).toContainText('sudah dikonfirmasi');
  await expect(other.getByRole('button',{name:'Konfirmasi identitas',exact:true})).toBeDisabled();
  expect((await readState(page)).queue[0].resolution.targetId).toBe('VIS000001');
});

test('view only blocks mutations and storage errors are recoverable',async({page})=>{
  await visit(page,'employees');
  await page.getByLabel('Mode akses demo').selectOption('viewer');
  await expect(page.getByRole('button',{name:'Enroll employee',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:/^Ambiguous Queue/}).click();
  for(const button of await page.getByRole('button',{name:'Tinjau identitas',exact:true}).all())await expect(button).toBeDisabled();
  await page.evaluate(k=>localStorage.setItem(k,'corrupt'),key);await page.reload();
  await expect(page.locator('.identity-error[role=alert]')).toContainText('Data identitas belum dapat dimuat');
  await page.evaluate(k=>localStorage.removeItem(k),key);
  await page.getByRole('button',{name:'Refresh',exact:true}).click();
  await expect(page.locator('.ambiguous-card')).toHaveCount(3);
});

test('new Cam1 visitor creates one identity; failed persistence preserves queue',async({page})=>{
  await visit(page,'ambiguous');
  await prepareResolution(page,'AMB-0001','new');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Penyimpanan penuh','QuotaExceededError');};});
  await page.getByRole('button',{name:'Konfirmasi identitas',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Penyimpanan penuh');
  await expect(page.locator('.ambiguous-card')).toHaveCount(3);
  await page.reload();
  await prepareResolution(page,'AMB-0001','new');
  await page.getByRole('button',{name:'Konfirmasi identitas',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const state=await readState(page);
  expect(state.visitors).toHaveLength(9);
  expect(state.queue[0].resolution.targetId).toBe('VIS000009');
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('9');
  await expect(page.locator('.metric-occupancy .stat-value')).toHaveText('4');
});

test.describe('webcam capture',()=>{

  test('capture previews a frame and stops the camera before saving',async({page})=>{
    await page.addInitScript(()=>{
      const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await original(constraints);(window as unknown as {testTracks:MediaStreamTrack[]}).testTracks=stream.getTracks();return stream;};
    });
    await visit(page,'employees');
    await page.getByRole('button',{name:'Enroll employee',exact:true}).click();
    await page.getByRole('button',{name:'Webcam',exact:true}).click();
    await page.getByRole('button',{name:'Aktifkan webcam',exact:true}).click();
    await expect(page.getByLabel('Preview webcam')).toBeVisible();
    await page.waitForFunction(()=>!!document.querySelector('video')?.videoWidth);
    await page.getByRole('button',{name:'Ambil foto',exact:true}).click();
    await expect(page.getByAltText('Preview foto enrollment')).toBeVisible();
    expect(await page.evaluate(()=>(window as unknown as {testTracks:MediaStreamTrack[]}).testTracks.every(t=>t.readyState==='ended'))).toBe(true);
    await page.getByRole('button',{name:'Batal',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test('Phase 2 screens and dialogs fit mobile, light and dark; no browser errors',async({page})=>{
  test.setTimeout(90000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await visit(page);await page.evaluate(()=>document.fonts.ready);
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'test-results/phase2-visitors.png',fullPage:true});
  for(const theme of ['light','dark'] as const){
    await page.emulateMedia({colorScheme:theme});
    for(const route of ['visitors','employees','ambiguous']){
      await page.goto(`/#${route}`);
      await expect(page.locator('.identity-page')).toBeVisible();
      for(const width of [1440,1024,768,390,360]){
        await page.setViewportSize({width,height:1000});
        await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
    }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'test-results/phase2-ambiguous-dark.png',fullPage:true});
  await page.setViewportSize({width:360,height:844});
  await page.locator('[data-review="AMB-0001"]').click();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/phase2-review-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
