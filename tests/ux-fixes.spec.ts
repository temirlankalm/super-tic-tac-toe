import { test, expect } from '@playwright/test';

test.describe('UX Fixes Verification', () => {
  test('1 & 2. Auto-generated nickname matches leaderboard and preserves exact typed case', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headerNickBtn = page.locator('button[aria-label*="nickname"], button[aria-label*="никнейм"]').first();
    await expect(headerNickBtn).toBeVisible();

    const headerNick = (await headerNickBtn.locator('span').textContent())?.trim() || '';
    expect(headerNick.length).toBeGreaterThanOrEqual(2);
    // Generated nickname uses Title Case like "Cosmic Deer 38", must NOT be forced lowercase by CSS
    const textTransform = await headerNickBtn.locator('span').evaluate(
      (el) => window.getComputedStyle(el).textTransform
    );
    expect(textTransform).not.toBe('lowercase');
    expect(headerNick).toMatch(/[A-Z]/);

    // Go to /leaderboard and confirm the "you" card shows the exact same nickname (not "Player XX")
    await page.goto('/leaderboard');
    await page.waitForLoadState('networkidle');

    const youBanner = page.locator('div:has(> div > span:text-is("you")), div:has(> div > span:text-is("вы"))').first();
    await expect(youBanner).toBeVisible();
    const lbNick = (await youBanner.locator('span').first().textContent())?.trim() || '';
    expect(lbNick).toBe(headerNick);

    // Edit nickname to mixed case and verify exact case in header and leaderboard
    const uniqueMixedNick = `MiXeD_${Date.now().toString(36).slice(-4)}`;
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(headerNickBtn.locator('span')).toHaveText(headerNick);
    await headerNickBtn.click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[type="text"]').fill(uniqueMixedNick);
    await dialog.locator('button[type="submit"]').click();
    await expect(page.locator('#nickname-modal-title')).toHaveCount(0);

    await expect(headerNickBtn.locator('span')).toHaveText(uniqueMixedNick);

    await page.goto('/leaderboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(youBanner.locator('span').first()).toHaveText(uniqueMixedNick);
  });

  test('3. Stored Russian language SSRs directly with no EN -> RU flash on reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to RU if currently EN
    const currentLang = await page.evaluate(() => document.documentElement.lang);
    if (currentLang !== 'ru') {
      await page.locator('button[aria-label*="russian"], button[title*="Переключить на русский"]').first().click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    }

    // Intercept raw HTML response on reload to ensure server SSR already sends Russian copy
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().endsWith('/') && res.request().resourceType() === 'document'),
      page.reload(),
    ]);
    const rawHtml = await response.text();
    expect(rawHtml).toContain('челлендж');
    expect(rawHtml).toContain('против ии');
    expect(rawHtml).not.toContain('>vs ai<');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });

  test('4. Closing online room modal (Esc or X) restores previous mode instead of leaving waiting dead end', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Switch to 2 players first so we test restoring non-default mode too
    await page.locator('button[aria-haspopup="menu"]').nth(1).click();
    await page.locator('[role="menuitem"]').nth(1).click(); // 2 players

    // Now open "room code / по коду (онлайн)"
    await page.locator('button[aria-haspopup="menu"]').nth(1).click();
    await page.locator('[role="menuitem"]').nth(2).click();

    const onlineModal = page.locator('#online-room-modal-title');
    await expect(onlineModal).toBeVisible();

    // Press Escape -> modal closes AND mode returns to 2 players (not stuck waiting!)
    await page.keyboard.press('Escape');
    await expect(onlineModal).toHaveCount(0);
    await expect(page.locator('text=waiting for opponent')).toHaveCount(0);
    await expect(page.locator('text=ожидание соперника')).toHaveCount(0);

    // Re-open online modal, then close with X button -> restores previous mode
    await page.locator('button[aria-haspopup="menu"]').nth(1).click();
    await page.locator('[role="menuitem"]').nth(2).click();
    await expect(onlineModal).toBeVisible();
    await page.locator('[role="dialog"] button[aria-label="close"], [role="dialog"] button[aria-label="закрыть"]').click();
    await expect(onlineModal).toHaveCount(0);
    await expect(page.locator('text=waiting for opponent')).toHaveCount(0);
    await expect(page.locator('text=ожидание соперника')).toHaveCount(0);
  });

  test('5. Full Russian difficulty words (легко / средне / сложно), челлендж button, and zero overflow at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const currentLang = await page.evaluate(() => document.documentElement.lang);
    if (currentLang !== 'ru') {
      await page.locator('button[aria-label*="russian"], button[title*="Переключить на русский"]').first().click();
      await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    }

    await expect(page.locator('button:text-is("легко")')).toBeVisible();
    await expect(page.locator('button:text-is("средне")')).toBeVisible();
    await expect(page.locator('button:text-is("сложно")')).toBeVisible();
    await expect(page.locator('button[title*="челлендж"]')).toContainText('челлендж');

    const hasHorizontalScroll = await page.evaluate(
      () => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > window.innerWidth
    );
    expect(hasHorizontalScroll).toBe(false);
  });
});
