import { test, expect } from './fixtures';

test.beforeEach(async ({page})=>{ await page.goto('/'); await expect(page.getByRole('button',{name:'Atur gate'}).first()).toBeEnabled(); });

test('monitoring shows explicit demo status and no fake identity counts',async({page})=>{
  await expect(page.getByRole('heading',{name:'Live Monitoring'})).toBeVisible();
  await expect(page.getByText('Mode demonstrasi',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Camera 01 IN'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Camera 02 OUT'})).toBeVisible();
  await page.getByLabel('Filter arah crossing').selectOption('OUT');
  await expect(page.locator('tbody')).toContainText('TRK-0176');
  await expect(page.locator('tbody .event-direction.in')).toHaveCount(0);
  await expect(page.locator('tbody .event-direction.out').first()).toBeVisible();
});

test('gate save persists after reload',async({page})=>{
  await page.getByRole('button',{name:'Atur gate'}).first().click();
  await page.getByLabel('Mode gate',{exact:true}).selectOption('partial_line');
  await page.getByLabel('Posisi garis A',{exact:true}).fill('40');
  await page.getByRole('button',{name:'Simpan konfigurasi'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button',{name:'Atur gate'}).first().click();
  await expect(page.getByLabel('Mode gate',{exact:true})).toHaveValue('partial_line');
  await expect(page.getByLabel('Posisi garis A',{exact:true})).toHaveValue('40');
});

test('invalid geometry blocked, polygon can be drawn and saved',async({page})=>{
  await page.getByRole('button',{name:'Atur gate'}).first().click();
  await page.getByLabel('Posisi garis A',{exact:true}).fill('80');
  await expect(page.getByRole('alert')).toContainText('Garis B');
  await expect(page.getByRole('button',{name:'Simpan konfigurasi'})).toBeDisabled();
  await page.getByLabel('Mode gate',{exact:true}).selectOption('polygon');
  await page.getByRole('button',{name:'Hapus titik',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('minimal 3');
  const scene = page.getByRole('dialog').locator('svg.camera-scene');
  await scene.click({position:{x:80,y:60}});
  await scene.click({position:{x:280,y:60}});
  await scene.click({position:{x:200,y:200}});
  await expect(page.getByRole('button',{name:'Simpan konfigurasi'})).toBeEnabled();
  await page.getByRole('button',{name:'Simpan konfigurasi'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('near mode controls and draft discard',async({page})=>{
  await page.getByRole('button',{name:'Atur gate'}).first().click();
  await page.getByLabel('Mode gate',{exact:true}).selectOption('near');
  await page.getByLabel('Guard tepi').selectOption('left');
  await expect(page.getByLabel('Guard policy')).toBeVisible();
  await page.getByLabel('Minimum dwell',{exact:true}).fill('1000');
  await page.getByRole('button',{name:'Batalkan perubahan'}).click();
  await expect(page.getByLabel('Mode gate',{exact:true})).toHaveValue('line');
  await expect(page.getByRole('button',{name:'Simpan konfigurasi'})).toBeDisabled();
});

test('offline camera does not affect healthy camera; pause marks both non-live',async({page})=>{
  await page.getByRole('button',{name:'System Health',exact:true}).click();
  await page.getByLabel('Kondisi preview').first().selectOption('offline');
  await page.getByRole('button',{name:'Live Monitoring',exact:true}).click();
  await expect(page.getByText('Koneksi kamera terputus · skenario demo')).toBeVisible();
  await expect(page.locator('.camera-status').filter({hasText:'Simulasi aktif'})).toHaveCount(1);
  await page.getByRole('button',{name:'Pulihkan preview'}).click();
  await page.getByRole('button',{name:'Jeda preview'}).click();
  await expect(page.locator('.camera-cover')).toHaveCount(2);
  await page.getByRole('button',{name:'Lanjutkan',exact:true}).click();
  await expect(page.locator('.camera-cover')).toHaveCount(0);
});

test('view-only demo disables editor, modal keyboard close restores focus',async({page})=>{
  const edit = page.getByRole('button',{name:'Atur gate'}).first();
  await edit.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(edit).toBeFocused();
  await page.getByLabel('Mode akses demo').selectOption('viewer');
  await expect(edit).toBeDisabled();
  await expect(page.getByRole('button',{name:'Jeda preview'})).toHaveCount(0);
});

test('storage failures surface and preserve draft',async({page})=>{
  await page.getByRole('button',{name:'Atur gate'}).first().click();
  await page.getByLabel('Mode gate',{exact:true}).selectOption('near');
  await page.evaluate(()=>{ Storage.prototype.setItem=()=>{throw new DOMException('Penyimpanan penuh','QuotaExceededError');}; });
  await page.getByRole('button',{name:'Simpan konfigurasi'}).click();
  await expect(page.getByRole('alert')).toContainText('Penyimpanan penuh');
  await expect(page.getByLabel('Mode gate',{exact:true})).toHaveValue('near');
});

test('concurrent tab edit detects version conflict',async({page,context})=>{
  await page.getByRole('button',{name:'Atur gate'}).first().click();
  await page.getByLabel('Mode gate',{exact:true}).selectOption('near');
  const other = await context.newPage();await other.goto('/');
  await other.getByRole('button',{name:'Atur gate'}).first().click();
  await other.getByLabel('Posisi garis A',{exact:true}).fill('40');
  await other.getByRole('button',{name:'Simpan konfigurasi'}).click();
  await expect(other.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Simpan konfigurasi'}).click();
  await expect(page.getByRole('alert')).toContainText('tab lain');
});

test('responsive layouts have no document overflow',async({page})=>{
  for(const width of [1440,1280,1024,768,390,360]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`overflow at ${width}`).toBe(true);
    if(width===390){ await page.getByRole('button',{name:'Buka navigasi'}).click();await page.getByRole('button',{name:'Gate Configuration',exact:true}).click();await expect(page.getByRole('heading',{name:'Gate Configuration'})).toBeVisible(); }
  }
});

test('capture desktop and mobile reference without console errors',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.reload();
  await expect(page.getByRole('button',{name:'Atur gate'}).first()).toBeEnabled();
  await page.setViewportSize({width:1440,height:1100});
  await page.screenshot({path:'test-results/phase1-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(300);
  await page.screenshot({path:'test-results/phase1-mobile.png',fullPage:true});
  expect(errors).toEqual([]);
});
