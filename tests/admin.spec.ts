import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function loadLocalAdminCreds(): { email?: string; password?: string } {
  const envPath = path.join(process.cwd(), '.env.local');
  const out: { email?: string; password?: string } = {};
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const val = m[2].replace(/^['"]|['"]$/g, '').trim();
      if (m[1] === 'ADMIN_EMAIL') out.email = val;
      if (m[1] === 'ADMIN_PASSWORD') out.password = val;
    }
  }
  return out;
}

test.describe('Admin Dashboard & Owner-Only Analytics Button', () => {
  test('regular visitor does NOT see analytics button on main page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const adminLink = page.locator('a:has-text("аналитика · админ"), a:has-text("analytics · admin")');
    await expect(adminLink).toHaveCount(0);
  });

  test('admin login sets badge cookie, renders dashboard cleanly at 1280px & 390px, shows owner button, and logout hides it', async ({ page }) => {
    const creds = loadLocalAdminCreds();
    test.skip(!creds.password, 'No ADMIN_PASSWORD in .env.local');

    // 1. Visit /admin unauthenticated at 1280px
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#admin-password')).toBeVisible();

    // 2. Log in
    if (creds.email) {
      await page.fill('#admin-email', creds.email);
    }
    await page.fill('#admin-password', creds.password!);
    await page.click('button[type="submit"]');

    // Wait for dashboard header & KPIs to render
    await expect(page.locator('h1:has-text("tic³")')).toBeVisible();
    await expect(page.locator('section[aria-label="key metrics"]')).toBeVisible();

    // Verify no horizontal scroll at 1280px
    const overflow1280 = await page.evaluate(
      () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth
    );
    expect(overflow1280).toBe(false);

    // Screenshot desktop light
    const artDir = '/Users/kalmukhantemirlan/.gemini/antigravity/brain/fc2995b4-2d50-4dd4-bc44-1a38d8acd28d';
    if (fs.existsSync(artDir)) {
      await page.screenshot({ path: path.join(artDir, 'admin_desktop_light.png'), fullPage: true });
      await page.click('button[aria-label="toggle theme"]');
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(artDir, 'admin_desktop_dark.png'), fullPage: true });
      await page.click('button[aria-label="toggle theme"]');
      await page.waitForTimeout(200);
    }

    // Check view tabs work cleanly
    await page.click('button:has-text("геймплей"), button:has-text("gameplay")');
    await page.click('button:has-text("весь обзор"), button:has-text("overview")');

    // Check mobile 390px layout & no horizontal scroll
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const overflow390 = await page.evaluate(
      () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth
    );
    expect(overflow390).toBe(false);

    if (fs.existsSync(artDir)) {
      await page.screenshot({ path: path.join(artDir, 'admin_mobile_light.png'), fullPage: true });
    }

    // 3. Navigate back to main game page: owner-only analytics button MUST now appear!
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const adminLink = page.locator('a:has-text("аналитика · админ"), a:has-text("analytics · admin")');
    await expect(adminLink).toBeVisible();

    if (fs.existsSync(artDir)) {
      await page.screenshot({ path: path.join(artDir, 'game_with_admin_button.png'), fullPage: true });
    }

    // 4. Go back to /admin and logout -> button disappears on /
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.click('button[title="выйти"], button[title="log out"]');
    await expect(page.locator('#admin-password')).toBeVisible();

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(adminLink).toHaveCount(0);
  });
});
