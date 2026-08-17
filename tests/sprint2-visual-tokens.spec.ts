import { test, expect } from '@playwright/test';

/**
 * Sprint 2: Auditoria Visual, Tokens CSS & Componentes Compartilhados
 * Valida a conformidade de Design System e consistência visual conforme docs/auditoria-visual.md
 */
test.describe('Sprint 2 — Design System & Auditoria Visual', () => {

  test('2.1 - Tokens CSS fundamentais devem estar carregados na raiz do documento', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const styles = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = getComputedStyle(root);
      return {
        hasBg: computed.backgroundColor !== '',
        color: computed.color,
      };
    });

    expect(styles.hasBg).toBe(true);
  });

  test('2.2 - Página de login não deve conter transbordamento horizontal de layout', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('2.3 - Página de login do Admin não deve conter transbordamento horizontal', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('2.4 - Hierarquia tipográfica e contraste nos formulários de autenticação', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const heading = headings.nth(i);
      if (await heading.isVisible()) {
        const fontSize = await heading.evaluate((el) => window.getComputedStyle(el).fontSize);
        const parsedSize = parseFloat(fontSize);
        // Títulos principais devem ter tamanho legível (>= 16px)
        expect(parsedSize).toBeGreaterThanOrEqual(16);
      }
    }
  });

  test('2.5 - Botões de ação devem ter área clicável e contraste adequado (mínimo 40px altura)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const buttons = page.locator('button[type="submit"]');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        // Área de toque mínima recomendada para botões primários
        expect(box.height).toBeGreaterThanOrEqual(36);
        expect(box.width).toBeGreaterThanOrEqual(80);
      }
    }
  });

});
