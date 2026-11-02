import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
async function login(page:Page,account='provider',role:'Super Admin'|'Admin Site'|'Management'='Super Admin'){
  await page.goto('/#/login');await page.getByRole('button',{name:role,exact:true}).click();await page.getByLabel('Pilih akun demo',{exact:true}).selectOption(account);await page.getByRole('button',{name:'Masuk ke workspace demo',exact:true}).click();await expect(page.locator('.app-shell,.role-workspace').first()).toBeVisible();
}
async function release(page:Page){await login(page);await page.getByRole('navigation',{name:'Navigasi Provider'}).getByRole('link',{name:'Release Readiness',exact:true}).click();await expect(page.getByRole('heading',{name:'Go-live menunggu persetujuan'})).toBeVisible();}
const tags=['wcag2a','wcag2aa','wcag21aa'];
async function accessible(page:Page){const results=await new AxeBuilder({page}).withTags(tags).analyze();expect(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);}

test('release gate is provider-only and never asserts production approval',async({page})=>{
  await release(page);await expect(page.locator('.release-blockers article')).toHaveCount(5);await expect(page.locator('.release-flags>div')).toHaveCount(4);await expect(page.locator('.release-overall')).toContainText('Mode produksi diblokir');await expect(page.getByRole('button',{name:/approve|setujui produksi|deploy|go-live/i})).toHaveCount(0);await page.goto('/#/login');await login(page,'admin','Admin Site');await page.goto('/#/provider/release');await expect(page.getByRole('heading',{name:'Akses tidak diizinkan'})).toBeVisible();await expect(page.locator('.release-readiness')).toHaveCount(0);await page.goto('/#/login');await login(page,'management','Management');await page.goto('/#/provider/release');await expect(page.getByRole('heading',{name:'Akses tidak diizinkan'})).toBeVisible();
});

test('missing or stale QA evidence is explicit and download contains metadata only',async({page})=>{
  await page.route('**/release-evidence.json',route=>route.fulfill({status:404,body:'Unavailable'}));await release(page);await expect(page.locator('.release-notice')).toContainText('Bukti QA belum tersedia');await page.unroute('**/release-evidence.json');await page.route('**/release-evidence.json',route=>route.fulfill({json:{schema:1,source:'0'.repeat(64),profile:'old-profile',generatedAt:'2026-11-02T00:00:00Z',checks:{lint:{status:'passed',at:'2026-11-02T00:00:00Z'}},privatePayload:'data:image/jpeg;base64,SECRET',owner:'private@example.test'}}));await page.getByRole('button',{name:'Refresh bukti',exact:true}).click();await expect(page.locator('.release-notice')).toContainText('source atau konfigurasi berbeda');const event=page.waitForEvent('download');await page.getByRole('button',{name:'Unduh ringkasan QA',exact:true}).click();const csv=await event;const data=await readFile((await csv.path())!,'utf8');expect(data).toContain('pending-external-approval');expect(data).not.toMatch(/SECRET|private@example|data:image|VIS\d{6}|EMP\d{5}|password|rtsp:\/\//);await expect(page.getByRole('heading',{name:'Go-live menunggu persetujuan'})).toBeVisible();
});

test('controlled UI error displays a safe frontend reference and recovers without data loss',async({page})=>{
  await release(page);const before=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));await page.locator('.release-self-test summary').click();await page.getByRole('button',{name:'Uji pemulihan tampilan',exact:true}).click();await expect(page.getByRole('heading',{name:'Tampilan belum dapat dimuat'})).toBeVisible();await expect(page.locator('.release-reference')).toHaveText(/Referensi frontend: FE-[A-F0-9]{8}/);await expect(page.locator('.release-recovery')).not.toContainText('Controlled frontend recovery check');await page.getByRole('button',{name:'Coba tampilkan kembali',exact:true}).click();await expect(page.getByRole('button',{name:'Uji pemulihan tampilan',exact:true})).toBeVisible();expect(await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))) .toEqual(before);await expect(page.locator('.release-table').last()).toContainText('FE_RENDER');
});

test('security headers prevent framing and do not permit microphone/location',async({request})=>{
  const response=await request.get('/');const headers=response.headers();expect(headers['x-content-type-options']).toBe('nosniff');expect(headers['x-frame-options']).toBe('DENY');expect(headers['referrer-policy']).toBe('no-referrer');expect(headers['permissions-policy']).toContain('microphone=()');expect(headers['permissions-policy']).toContain('geolocation=()');expect(headers['x-powered-by']).toBeUndefined();
});

test('login passes automated accessibility in both themes',async({page})=>{
  await page.goto('/#/login');for(const colorScheme of ['light','dark'] as const){await page.emulateMedia({colorScheme});await accessible(page);}
});

test('operational monitoring, enrollment dialog and gate editor pass automated accessibility',async({page})=>{
  test.setTimeout(90000);await login(page,'technician','Admin Site');await expect(page.locator('.camera-scene').first()).toBeVisible();await accessible(page);await page.getByRole('button',{name:'Atur gate',exact:true}).first().click();await accessible(page);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Employee',exact:true}).click();await page.getByRole('button',{name:'Enroll employee',exact:true}).click();await accessible(page);
});

test('management charts/tables and release readiness pass automated accessibility',async({page})=>{
  test.setTimeout(90000);await login(page,'management','Management');await expect(page.locator('.analytics-health')).toBeVisible();await accessible(page);await page.getByRole('group',{name:'Tampilan Traffic overview',exact:true}).getByRole('button',{name:'Tabel',exact:true}).click();await accessible(page);await page.goto('/#/login');await release(page);await accessible(page);
});

test('all role workspaces reflow at required widths and landscape',async({page})=>{
  test.setTimeout(90000);for(const [account,role] of [['technician','Admin Site'],['management','Management'],['provider','Super Admin']] as const){await login(page,account,role);await expect(page.locator('.app-shell,.role-workspace').first()).toBeVisible();for(const width of [1440,1280,1024,768,390,360]){await page.setViewportSize({width,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),{message:`${role} ${width}px`}).toBe(true);}await page.setViewportSize({width:844,height:390});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:1440,height:1000});}
});

test('keyboard skip link and 200-percent-equivalent reflow keep critical controls reachable',async({browser})=>{
  const context=await browser.newContext({viewport:{width:720,height:450},deviceScaleFactor:2,reducedMotion:'reduce'});const page=await context.newPage();await login(page,'technician','Admin Site');await page.getByRole('link',{name:'Lewati ke konten utama',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#main')).toBeFocused();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Buka navigasi',exact:true}).click();await page.getByRole('button',{name:'Employee',exact:true}).click();await page.getByRole('button',{name:'Enroll employee',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByLabel('Nama employee',{exact:true}).focus();await page.keyboard.type('Keyboard check');await expect(page.getByLabel('Nama employee',{exact:true})).toHaveValue('Keyboard check');await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await context.close();
});


test('Escape cancels a cold gate editor before its delayed chunk mounts',async({page})=>{
  await login(page,'technician','Admin Site');await expect(page.locator('.camera-scene').first()).toBeVisible();
  let unblock:()=>void=()=>{};const pending=new Promise<void>(resolve=>{unblock=resolve;});let requested=0;
  await page.route('**/_next/static/chunks/*.js',async route=>{requested++;await pending;await route.continue();});
  const edit=page.getByRole('button',{name:'Atur gate',exact:true}).first();
  try{await edit.click();await expect.poll(()=>requested).toBeGreaterThan(0);await expect(page.getByRole('status').filter({hasText:'Memuat editor gate'})).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('.editor-loading')).toHaveCount(0);await expect(edit).toBeFocused();}finally{unblock();}
  await edit.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(edit).toBeFocused();
});
