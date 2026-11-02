import { test, expect, type Page } from '@playwright/test';
const sessionKey='visitor-ai.phase4.demo-session.v1';
async function login(page:Page,account='admin',role:'admin_site'|'management'|'provider'='admin_site',target='/#login'){
  await page.goto(target);
  const label=role==='admin_site'?'Admin Site':role==='management'?'Management':'Super Admin';
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.getByLabel('Pilih akun demo',{exact:true}).selectOption(account);
  await page.getByRole('button',{name:'Masuk ke workspace demo',exact:true}).click();
  await expect(page.locator('.app-shell,.role-workspace,.session-state-card').first()).toBeVisible();
}
async function profile(page:Page){await page.getByRole('button',{name:'Profil dan akses',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();}

test('initial visit shows login only; no operational or identity data is loaded',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.getItem;(window as unknown as {protectedReads:string[]}).protectedReads=[];Storage.prototype.getItem=function(key){if(/^visitor-ai\.phase[123]\./.test(key))(window as unknown as {protectedReads:string[]}).protectedReads.push(key);return original.call(this,key);};});
  await page.goto('/#visitors/VIS000001');
  await expect(page.getByRole('heading',{name:'Masuk ke Visitor AI'})).toBeVisible();
  await expect(page.locator('.camera-scene,.identity-page,.identity-portrait')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as unknown as {protectedReads:string[]}).protectedReads)).toEqual([]);
  await expect(page.getByRole('textbox',{name:/password|kata sandi/i})).toHaveCount(0);
});

test('admin site can operate its assigned site but tuning controls and routes are denied',async({page})=>{
  await login(page);
  await expect(page.getByRole('heading',{name:'Live Monitoring',level:1})).toBeVisible();
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('8');
  await expect(page.getByRole('button',{name:'Atur gate'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Jeda preview'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Settings / Tuning',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Employee',exact:true}).click();
  await expect(page.getByRole('button',{name:'Enroll employee',exact:true})).toBeEnabled();
  await page.goto('/#/admin-site/SITE-001/settings');
  await expect(page.getByRole('heading',{name:'Akses tidak diizinkan'})).toBeVisible();
  await expect(page.locator('.parameter-list')).toHaveCount(0);
});

test('management never loads individual identities, media, tuning or operational transport',async({page})=>{
  await page.addInitScript(()=>{const original=Storage.prototype.getItem;(window as unknown as {protectedReads:string[]}).protectedReads=[];Storage.prototype.getItem=function(key){if(/^visitor-ai\.phase[123]\./.test(key))(window as unknown as {protectedReads:string[]}).protectedReads.push(key);return original.call(this,key);};});
  await login(page,'management','management');
  await expect(page.getByRole('heading',{name:'Management Overview'})).toBeVisible();
  await expect(page.locator('.site-summary-table tbody tr')).toHaveCount(2);
  await expect(page.locator('.camera-scene,.identity-page,.connection-bar')).toHaveCount(0);
  await page.goto('/#/admin-site/SITE-001/visitors/VIS000001');
  await expect(page.getByRole('heading',{name:'Akses tidak diizinkan'})).toBeVisible();
  await expect(page.locator('.identity-portrait')).toHaveCount(0);
  expect(await page.evaluate(()=>(window as unknown as {protectedReads:string[]}).protectedReads)).toEqual([]);
});

test('cross-site URL manipulation denies access without showing the previous site data',async({page})=>{
  await login(page);
  await page.getByRole('button',{name:'Visitor',exact:true}).click();
  await expect(page.locator('.identity-table')).toContainText('VIS000001');
  await page.goto('/#/admin-site/SITE-002/visitors/VIS000001');
  await expect(page.getByRole('heading',{name:'Akses tidak diizinkan'})).toBeVisible();
  await expect(page.locator('.identity-page,.identity-portrait,.connection-bar')).toHaveCount(0);
  await page.getByRole('button',{name:'Kembali ke workspace',exact:true}).click();
  await expect(page.locator('.context-bar')).toContainText('SITE-001');
});

test('technician site switch uses separate identity and tuning storage and survives reload',async({page})=>{
  await login(page,'technician');
  await page.getByRole('button',{name:'Settings / Tuning',exact:true}).click();
  await page.getByLabel('Detection confidence nilai',{exact:true}).fill('0.65');
  await page.getByRole('button',{name:'Tinjau perubahan',exact:true}).click();
  await page.getByLabel('Alasan perubahan tuning').fill('Konfigurasi khusus SITE-001');
  await page.getByRole('button',{name:'Simpan tuning',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Pilih site aktif').selectOption('SITE-002');
  await expect(page.locator('.context-bar')).toContainText('Terminal 3 Lounge');
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('4');
  await page.getByRole('button',{name:'Settings / Tuning',exact:true}).click();
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.55');
  await page.reload();
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.55');
  await page.getByLabel('Pilih site aktif').selectOption('SITE-001');
  await page.getByRole('button',{name:'Settings / Tuning',exact:true}).click();
  await expect(page.getByLabel('Detection confidence nilai',{exact:true})).toHaveValue('0.65');
});

test('site change in another tab clears open visitor media before the new scope mounts',async({page,context})=>{
  await login(page,'technician');
  await page.getByRole('button',{name:'Visitor',exact:true}).click();
  await page.getByRole('button',{name:'Detail VIS000001',exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText('VIS000001');
  const other=await context.newPage();await other.goto('/#/admin-site/SITE-001/monitor');
  await other.getByLabel('Pilih site aktif').selectOption('SITE-002');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.context-bar')).toContainText('SITE-002');
  await expect(page.locator('.metric-visitors .stat-value')).toHaveText('4');
  await expect(page.locator('.connection-bar')).toHaveAttribute('data-scope',/^SITE-002:admin_site:/);
});

test('authorized visitor deep link survives reload; unknown site returns 404',async({page})=>{
  await login(page,'technician','admin_site','/#/admin-site/SITE-001/visitors/VIS000001');
  await expect(page.getByRole('dialog')).toContainText('VIS000001');
  await page.reload();
  await expect(page.getByRole('dialog')).toContainText('VIS000001');
  await page.keyboard.press('Escape');
  await page.goto('/#/admin-site/SITE-999/monitor');
  await expect(page.getByRole('heading',{name:'Halaman tidak ditemukan'})).toBeVisible();
  await expect(page.locator('.camera-scene')).toHaveCount(0);
});

test('logout in another tab clears visitor detail and all operational subscriptions',async({page,context})=>{
  await login(page,'technician');
  await page.getByRole('button',{name:'Visitor',exact:true}).click();
  await page.getByRole('button',{name:'Detail VIS000001',exact:true}).click();
  const other=await context.newPage();await other.goto('/#/admin-site/SITE-001/monitor');
  await profile(other);await other.getByRole('button',{name:'Keluar',exact:true}).click();
  await expect(page.locator('.login-page')).toBeVisible();
  await expect(page.locator('.identity-page,.identity-portrait,.connection-bar,[role=dialog]')).toHaveCount(0);
  expect(await page.evaluate(key=>localStorage.getItem(key),sessionKey)).toBeNull();
});

test('session expiry requires login and never restores protected media by itself',async({page})=>{
  await login(page,'technician');
  await profile(page);await page.getByText('Uji lifecycle sesi demo',{exact:true}).click();
  await page.getByRole('button',{name:'Akhiri sesi demo',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Sesi demo telah berakhir'})).toBeVisible();
  await expect(page.locator('.camera-scene,.identity-portrait,.connection-bar')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Sesi demo telah berakhir'})).toBeVisible();
  await page.getByRole('button',{name:'Masuk kembali',exact:true}).click();
  await expect(page.locator('.login-page')).toBeVisible();
});

test('revoking access propagates across tabs and clears an active workspace',async({page,context})=>{
  await login(page,'technician');
  const other=await context.newPage();await other.goto('/#/admin-site/SITE-001/monitor');
  await profile(other);await other.getByText('Uji lifecycle sesi demo',{exact:true}).click();
  await other.getByRole('button',{name:'Cabut akses demo',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Akses demo telah dicabut'})).toBeVisible();
  await expect(page.locator('.camera-scene,.connection-bar')).toHaveCount(0);
});

test('demo catalog contains exactly two admins, one management and one super admin',async({page})=>{
  await page.goto('/#/login');
  for(const [role,ids] of [['Admin Site',['admin','technician']],['Management',['management']],['Super Admin',['provider']]] as const){
    await page.getByRole('button',{name:role,exact:true}).click();
    expect(await page.getByLabel('Pilih akun demo',{exact:true}).locator('option').evaluateAll(options=>options.map(o=>(o as HTMLOptionElement).value))).toEqual([...ids]);
  }
});

test('sessions from retired demo accounts return to login',async({page})=>{
  await page.goto('/#/login');
  for(const accountId of ['admin-b','observer','multi-role','unassigned','suspended']){
    await page.evaluate(({key,accountId})=>localStorage.setItem(key,JSON.stringify({schema:1,id:'old-session',accountId,role:'admin_site',siteId:'SITE-001',issuedAt:Date.now()-1000,expiresAt:Date.now()+60000,state:'active',support:null})),{key:sessionKey,accountId});
    await page.reload();await expect(page.getByRole('heading',{name:'Masuk ke Visitor AI'})).toBeVisible();await expect(page.locator('.app-shell,.role-workspace')).toHaveCount(0);
  }
});

test('provider support requires purpose and stays restricted to the approved site',async({page})=>{
  await login(page,'provider','provider');
  await expect(page.getByRole('heading',{name:'Provider Workspace'})).toBeVisible();
  await expect(page.locator('.camera-scene')).toHaveCount(0);
  await page.getByRole('button',{name:'Buka dukungan site',exact:true}).click();
  await page.getByRole('button',{name:'Masuk mode dukungan',exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('tujuan dukungan');
  await page.getByLabel('Tujuan dukungan').fill('Meninjau gate Camera 01 pada SITE-001');
  await page.getByRole('button',{name:'Masuk mode dukungan',exact:true}).click();
  await expect(page.locator('.support-runtime-banner')).toContainText('Meninjau gate');
  await expect(page.getByRole('button',{name:'Atur gate'}).first()).toBeEnabled();
  await page.goto('/#/admin-site/SITE-002/monitor');
  await expect(page.getByRole('heading',{name:'Akses tidak diizinkan'})).toBeVisible();
  await profile(page);await page.getByRole('button',{name:'Akhiri dukungan',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Provider Workspace'})).toBeVisible();
  const audit=await page.evaluate(()=>JSON.parse(localStorage.getItem('visitor-ai.phase4.access-audit.v1')!));
  expect(audit.some((e:{action:string;reason:string})=>e.action==='START_SUPPORT'&&e.reason.includes('Meninjau gate'))).toBe(true);
  expect(audit.at(-1).action).toBe('END_SUPPORT');
});

test('login timeout recovers and suspension lifecycle clears the current workspace',async({page})=>{
  await page.goto('/#login');await page.getByText('Uji kondisi login',{exact:true}).click();await page.getByLabel('Kondisi login demo').selectOption('timeout');await page.getByRole('button',{name:'Masuk ke workspace demo',exact:true}).click();await expect(page.locator('.identity-validation')).toContainText('timeout');expect(await page.evaluate(key=>localStorage.getItem(key),sessionKey)).toBeNull();
  await page.getByLabel('Kondisi login demo').selectOption('normal');await page.getByRole('button',{name:'Masuk ke workspace demo',exact:true}).click();await expect(page.getByRole('heading',{name:'Live Monitoring',exact:false,level:1})).toBeVisible();await profile(page);await page.getByText('Uji lifecycle sesi demo',{exact:true}).click();await page.getByRole('button',{name:'Tangguhkan sesi demo',exact:true}).click();await expect(page.getByRole('heading',{name:'Sesi demo ditangguhkan'})).toBeVisible();await expect(page.locator('.camera-scene,.connection-bar')).toHaveCount(0);
});

test('malformed role/session defaults to login and external return URL is ignored',async({page})=>{
  await page.goto('/#login');
  await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({schema:1,id:'invalid',accountId:'admin',role:'provider',siteId:'SITE-001',issuedAt:Date.now()-1000,expiresAt:Date.now()+60000,state:'active',support:null})),sessionKey);
  await page.reload();
  await expect(page.locator('.login-page')).toBeVisible();
  await page.evaluate(key=>localStorage.removeItem(key),sessionKey);
  await login(page,'admin','admin_site','/?returnTo=https%3A%2F%2Fexample.com&site_id=SITE-002#login');
  await expect(page.locator('.context-bar')).toContainText('SITE-001');
  expect(new URL(page.url()).origin).toBe((process.env.VISITOR_E2E_BASE_URL??'http://127.0.0.1:3000'));
});

test('access pages and role workspaces fit mobile/light/dark and emit no browser errors',async({page})=>{
  test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});
  await page.goto('/#login');await page.evaluate(()=>document.fonts.ready);
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/phase4-login.png',fullPage:true});
  for(const theme of ['light','dark'] as const){await page.emulateMedia({colorScheme:theme});for(const width of [1440,1024,768,390,360]){await page.setViewportSize({width,height:1000});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}}
  await page.setViewportSize({width:1440,height:1000});await login(page,'management','management');
  await page.screenshot({path:'test-results/phase4-management-dark.png',fullPage:true});
  for(const width of [1440,1024,768,390,360]){await page.setViewportSize({width,height:1000});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
  await profile(page);await page.getByRole('button',{name:'Keluar',exact:true}).click();
  await login(page,'technician');await page.setViewportSize({width:360,height:844});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/phase4-site-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
