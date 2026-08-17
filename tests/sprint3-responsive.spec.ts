import { test, expect } from '@playwright/test';

/**
 * Sprint 3: Responsividade Mobile (360px - 430px) vs Desktop (1440px)
 * Testa especificamente os pontos críticos de quebra levantados na Auditoria Visual (docs/auditoria-visual.md - Seção E)
 */
test.describe('Sprint 3 — Responsividade e Layouts Adaptativos', () => {

  const viewports = [
    { name: 'Mobile Estreito (360px)', width: 360, height: 740 },
    { name: 'Mobile Padrão (390px)', width: 390, height: 844 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`3.1 - Login Investidor em ${vp.name} sem overflow horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(isOverflowing).toBe(false);
    });

    test(`3.2 - Login Admin em ${vp.name} sem overflow horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/admin/login');
      await page.waitForLoadState('domcontentloaded');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(isOverflowing).toBe(false);
    });

    test(`3.3 - Recuperação de Senha em ${vp.name} sem overflow horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/esqueci-senha');
      await page.waitForLoadState('domcontentloaded');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(isOverflowing).toBe(false);
    });
  }

  test('3.4 - Card de login deve manter margens e paddings proporcionais em tela de 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const formOrCard = page.locator('form, [class*="card"]').first();
    if (await formOrCard.count() > 0) {
      const box = await formOrCard.boundingBox();
      if (box) {
        // Card deve caber dentro de 360px sem vazar para fora
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.width).toBeLessThanOrEqual(360);
      }
    }
  });

  test('3.5 - Elementos de formulário e botões devem respeitar a largura da tela em 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const inputs = page.locator('input');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const box = await input.boundingBox();
        if (box) {
          expect(box.x + box.width).toBeLessThanOrEqual(360);
        }
      }
    }
  });

});
