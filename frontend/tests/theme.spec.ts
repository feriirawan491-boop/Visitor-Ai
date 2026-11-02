import { test, expect } from './fixtures';

test('requested typography and blue-500 primary load locally', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Aktifkan .* mode/ })).toBeEnabled();
  const styles = await page.evaluate(async () => {
    await document.fonts.ready;
    return {
      heading: getComputedStyle(document.querySelector('h1')!).fontFamily,
      body: getComputedStyle(document.body).fontFamily,
      blue: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
      displayLoaded: document.fonts.check('40px "Bebas Neue"'),
      bodyLoaded: document.fonts.check('14px "Plus Jakarta Sans Variable"'),
    };
  });
  expect(styles.heading).toContain('Bebas Neue');
  expect(styles.body).toContain('Plus Jakarta Sans');
  expect(styles.blue).toBe('#3b82f6');
  expect(styles.displayLoaded && styles.bodyLoaded).toBe(true);
});

test('dark mode persists, syncs across tabs, and themes editor portals', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Aktifkan dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Aktifkan light mode' })).toBeEnabled();
  await page.getByRole('button', { name: 'Atur gate' }).first().click();
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(19, 26, 41)');
  await page.getByRole('button', { name: 'Tutup dialog' }).click();
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('button', { name: 'Aktifkan light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('system preference applies until an explicit theme is selected', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Aktifkan light mode' })).toBeEnabled();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Aktifkan dark mode' }).click();
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('dark mode remains responsive and has no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Aktifkan light mode' })).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: 'test-results/phase1-dark-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Atur gate' }).first().click();
  await page.screenshot({ path: 'test-results/phase1-dark-editor.png', fullPage: true });
  await page.keyboard.press('Escape');
  for (const width of [1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), { message: `overflow at ${width}` }).toBe(true);
  }
  await page.screenshot({ path: 'test-results/phase1-dark-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
