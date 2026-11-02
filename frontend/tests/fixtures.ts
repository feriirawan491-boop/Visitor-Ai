import { test as base, expect } from '@playwright/test';
// Earlier phases exercise operations with an explicitly provisioned technician demo session.
export const test=base.extend({page:async({page},use)=>{
  await page.addInitScript(()=>{
    const key='visitor-ai.phase4.demo-session.v1';
    if(!localStorage.getItem(key)){const now=Date.now();localStorage.setItem(key,JSON.stringify({schema:1,id:crypto.randomUUID(),accountId:'technician',role:'admin_site',siteId:'SITE-001',issuedAt:now-1000,expiresAt:now+45*60*1000,state:'active',support:null}));}
  });
  await use(page);
}});
export { expect };
