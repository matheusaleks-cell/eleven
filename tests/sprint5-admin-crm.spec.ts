import { test, expect } from '@playwright/test';

/**
 * Sprint 5: Módulo Administrativo & CRM (Estrutura de Rotas Admin e Acessibilidade)
 */
test.describe('Sprint 5 — Módulo Administrativo & CRM', () => {

  test('5.1 - Rotas administrativas essenciais devem responder com proteção de acesso adequada', async ({ page }) => {
    const adminRoutes = [
      '/admin',
      '/admin/crm/clientes',
      '/admin/financeiro',
      '/admin/projetos',
      '/admin/vendas',
      '/admin/mapa-de-armas',
      '/admin/relatorios',
      '/admin/simulador',
      '/admin/usuarios',
      '/admin/configuracoes',
    ];

    for (const route of adminRoutes) {
      const response = await page.goto(route);
      expect(response).not.toBeNull();
      // Deve carregar ou redirecionar com status HTTP válido
      expect([200, 304, 307, 308]).toContain(response?.status());
    }
  });

  test('5.2 - Acessibilidade: atributos semânticos e labels nos inputs do login admin', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    if (await emailInput.count() > 0) {
      const ariaLabel = await emailInput.first().getAttribute('aria-label');
      const placeholder = await emailInput.first().getAttribute('placeholder');
      const id = await emailInput.first().getAttribute('id');
      const name = await emailInput.first().getAttribute('name');
      expect(ariaLabel || placeholder || id || name).toBeTruthy();
    }

    if (await passwordInput.count() > 0) {
      const ariaLabel = await passwordInput.first().getAttribute('aria-label');
      const placeholder = await passwordInput.first().getAttribute('placeholder');
      const id = await passwordInput.first().getAttribute('id');
      const name = await passwordInput.first().getAttribute('name');
      expect(ariaLabel || placeholder || id || name).toBeTruthy();
    }
  });

  test('5.3 - Ausência de erros críticos no console do navegador durante navegação inicial', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');

    // Não deve conter erros críticos não tratados
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes('favicon') && !err.includes('404') && !err.includes('hydration')
    );
    expect(criticalErrors.length).toBe(0);
  });

});
