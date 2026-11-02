import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testIgnore:['**/flags/**','**/unit/**'], testMatch:'**/*.spec.ts', fullyParallel: true, reporter: process.env.VISITOR_QA_REPORT ? [['list'],['json',{outputFile:process.env.VISITOR_QA_REPORT}]] : 'list',
  use: { baseURL: process.env.VISITOR_E2E_BASE_URL??'http://127.0.0.1:3000', browserName: 'chromium', launchOptions: { executablePath: process.env.VISITOR_CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
