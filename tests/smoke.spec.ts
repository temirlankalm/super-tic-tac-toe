import { test, expect } from '@playwright/test';

test.describe('Tic³ Smoke Tests', () => {
  // (a) no horizontal scroll at 390px
  test('(a) no horizontal scroll at 390px viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      const scrollWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth
      );
      return scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  // (b) ?room= link doesn't show blocking nickname modal
  test('(b) ?room= link does not show blocking nickname modal', async ({ page }) => {
    await page.goto('/?room=guest123');
    await page.waitForLoadState('networkidle');

    // Ensure nickname modal is not visible
    const nicknameModal = page.locator('#nickname-modal-title');
    await expect(nicknameModal).toHaveCount(0);
  });

  // (c) vs-AI game, resign confirm, no confetti
  test('(c) vs-AI game, resign confirm, no confetti', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click any playable cell on the board to make a move
    const playableCell = page.locator('button[role="gridcell"]:not([disabled])').first();
    await expect(playableCell).toBeVisible();
    await playableCell.click();

    // Click resign button in actions bar
    const resignButton = page.locator('button:has-text("сдаться"), button:has-text("resign")').first();
    await expect(resignButton).toBeVisible();
    await resignButton.click();

    // Click the confirmation "да" / "yes" button
    const confirmButton = page.locator('div:has-text("сдаться?") button:has-text("да"), div:has-text("resign?") button:has-text("yes")').first();
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Verify game ends (result panel appears)
    const resultPanel = page.locator('div[role="region"][aria-live="polite"]');
    await expect(resultPanel).toBeVisible();

    // Verify no canvas-confetti canvas was spawned
    const confettiCanvas = page.locator('canvas');
    await expect(confettiCanvas).toHaveCount(0);
  });

  // (d) daily start
  test('(d) daily challenge modal opens and starts match', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click daily button in header
    const dailyButton = page.locator('button[title*="челлендж"], button[title*="daily"]').first();
    await expect(dailyButton).toBeVisible();
    await dailyButton.click();

    // Verify modal opens
    const dailyModal = page.locator('#daily-challenge-modal-title');
    await expect(dailyModal).toBeVisible();

    // Click start daily button
    const startButton = page.locator('button:has-text("играть"), button:has-text("play"), button:has-text("продолжить"), button:has-text("continue")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Verify modal closes and game is in daily mode
    await expect(dailyModal).not.toBeVisible();
  });

  // (e) language switch
  test('(e) language switcher toggles between RU and EN', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const initialLang = await page.evaluate(() => document.documentElement.lang);

    // Click language toggle button in header
    const langButton = page.locator('button[aria-label*="russian"], button[aria-label*="английский"], button[title*="Switch to English"], button[title*="Переключить на русский"]').first();
    await expect(langButton).toBeVisible();
    await langButton.click();

    // Wait for lang attribute on <html> to change
    const targetLang = initialLang === 'ru' ? 'en' : 'ru';
    await expect(page.locator('html')).toHaveAttribute('lang', targetLang);
  });
});
