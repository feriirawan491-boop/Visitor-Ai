import { test, expect, type Page } from '@playwright/test';
async function assertReadable(page:Page){
  await expect.poll(()=>page.evaluate(()=>{
    const issues:string[]=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;if(!node.textContent?.trim())continue;const element=node.parentElement;if(!element||element.closest('script,style,title,option,[aria-hidden="true"],.sr-only'))continue;
      const rect=element.getBoundingClientRect();if(!rect.width||!rect.height||!element.checkVisibility())continue;
      const range=document.createRange();range.selectNodeContents(node);if(!range.getBoundingClientRect().width)continue;
      const style=getComputedStyle(element);let size=parseFloat(style.fontSize);
      if(element instanceof SVGGraphicsElement){const m=element.getScreenCTM();if(m)size*=Math.hypot(m.a,m.b);}
      if(size<11.95)issues.push(`${element.tagName}.${element.getAttribute('class')??''}: ${size.toFixed(2)}px ${node.textContent.trim().slice(0,45)}`);
    }
    return issues.slice(0,15);
  }),{message:'All visible text must render at least 12px'}).toEqual([]);
  await expect.poll(()=>page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth})),{message:'Larger typography must not overflow the page'}).toMatchObject({width:await page.evaluate(()=>innerWidth),scroll:await page.evaluate(()=>innerWidth)});
}
async function login(page:Page,role:'Admin Site'|'Management'|'Super Admin',account:string){await page.goto('/#/login');await page.getByRole('button',{name:role,exact:true}).click();await page.getByLabel('Pilih akun demo',{exact:true}).selectOption(account);await page.getByRole('button',{name:'Masuk ke workspace demo',exact:true}).click();await expect(page.locator('.app-shell,.role-workspace').first()).toBeVisible();}

test('login and provider typography use at least 12px with four demo accounts',async({page})=>{
  test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/#/login');for(const theme of ['light','dark'] as const){await page.emulateMedia({colorScheme:theme});for(const width of [1440,1024,768,390,360]){await page.setViewportSize({width,height:1000});await assertReadable(page);}}
  await page.screenshot({path:'test-results/type-login-mobile.png',fullPage:true});await page.setViewportSize({width:1440,height:1000});await login(page,'Super Admin','provider');
  for(const width of [1440,768,390,360]){await page.setViewportSize({width,height:1000});await assertReadable(page);}
  await page.getByRole('button',{name:'Buka dukungan site',exact:true}).click();await assertReadable(page);await page.keyboard.press('Escape');await page.getByRole('button',{name:'Profil dan akses',exact:true}).click();await assertReadable(page);expect(errors).toEqual([]);
});

test('operational routes, camera SVG and dialogs remain readable at 12px on desktop and mobile',async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page,'Admin Site','technician');
  for(const theme of ['light','dark'] as const){await page.emulateMedia({colorScheme:theme});for(const view of ['monitor','visitors','employees','ambiguous','history','settings','gates','health']){await page.goto(`/#/admin-site/SITE-001/${view}`);await expect(page.locator('.app-shell')).toBeVisible();for(const width of [1440,768,390,360]){await page.setViewportSize({width,height:1000});await assertReadable(page);}}}
  await page.goto('/#/admin-site/SITE-001/monitor');await page.getByRole('button',{name:'Atur gate',exact:true}).first().click();await assertReadable(page);await page.screenshot({path:'test-results/type-gate-mobile-dark.png'});await page.keyboard.press('Escape');await page.goto('/#/admin-site/SITE-001/employees');await page.getByRole('button',{name:'Enroll employee',exact:true}).click();await assertReadable(page);expect(errors).toEqual([]);
});

test('all management screens and SVG/chart table alternatives stay at least 12px',async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await login(page,'Management','management');
  for(const theme of ['light','dark'] as const){await page.emulateMedia({colorScheme:theme});for(const view of ['overview','visitors','duration','performance','reports']){await page.goto(`/#/management/${view}`);await expect(page.locator('.analytics-health')).toBeVisible();for(const width of [1440,1024,768,390,360]){await page.setViewportSize({width,height:1000});await assertReadable(page);}if(view==='overview'){await page.getByRole('group',{name:'Tampilan Traffic overview',exact:true}).getByRole('button',{name:'Tabel',exact:true}).click();await assertReadable(page);await page.getByRole('group',{name:'Tampilan Traffic overview',exact:true}).getByRole('button',{name:'Grafik',exact:true}).click();await page.setViewportSize({width:390,height:1000});await assertReadable(page);}}
  }
  await page.setViewportSize({width:1440,height:844});await page.goto('/#/management/overview');await expect(page.locator('.analytics-health')).toBeVisible();await expect.poll(()=>page.locator('.role-sidebar').evaluate(el=>{el.scrollTop=el.scrollHeight;return el.querySelector('footer')!.getBoundingClientRect().bottom<=innerHeight+1;}),{message:'Account footer stays reachable in a short desktop sidebar'}).toBe(true);await page.locator('.role-sidebar').evaluate(el=>{el.scrollTop=0;});await page.setViewportSize({width:1440,height:1100});await expect(page.locator('.analytics-health')).toBeVisible();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/type-management-desktop.png',fullPage:true});expect(errors).toEqual([]);
});
