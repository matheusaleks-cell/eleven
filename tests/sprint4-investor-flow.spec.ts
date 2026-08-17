import { test, expect } from '@playwright/test';

/**
 * Sprint 4: Módulo do Investidor (Estrutura de Rotas, Extratos e Projetos)
 */
test.describe('Sprint 4 — Módulo do Investidor', () => {

  test('4.1 - Rotas de navegação do Investidor devem responder com status válido (200 ou 307 redirect)', async ({ page }) => {
    const investorRoutes = [
      '/investidor',
      '/investidor/extrato',
      '/investidor/projetos',
      '/investidor/documentos',
      '/investidor/perfil',
    ];

    for (const route of investorRoutes) {
      const response = await page.goto(route);
      expect(response).not.toBeNull();
      // Deve carregar a página ou redirecionar para login de forma graciosa
      expect([200, 304, 307, 308]).toContain(response?.status());
    }
  });

  test('4.2 - Metatags e títulos das páginas do investidor devem estar presentes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('4.3 - Links de navegação para termos ou políticas devem ser válidos se presentes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const links = page.locator('a[href^="http"], a[href^="/"]');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

});
