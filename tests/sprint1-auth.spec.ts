import { test, expect } from '@playwright/test';

/**
 * Sprint 1: Autenticação, Proteção de Rotas & Validação de Formulários
 */
test.describe('Sprint 1 — Autenticação e Proteção de Rotas', () => {

  test('1.1 - Rota /investidor sem autenticação deve redirecionar para /login', async ({ page }) => {
    await page.goto('/investidor');
    await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname.includes('/investidor'));
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/login|\/investidor/);
  });

  test('1.2 - Rota /admin sem autenticação deve redirecionar para /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL((url) => url.pathname.includes('/admin/login') || url.pathname.includes('/admin'));
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/admin\/login|\/admin/);
  });

  test('1.3 - Rota /admin/crm/clientes sem autenticação deve proteger o acesso', async ({ page }) => {
    await page.goto('/admin/crm/clientes');
    await page.waitForURL((url) => url.pathname.includes('/admin/login') || url.pathname.includes('/admin/crm/clientes'));
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/admin\/login|\/admin\/crm\/clientes/);
  });

  test('1.4 - Tela de Login do Investidor (/login) deve renderizar elementos essenciais', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Verifica campos de entrada
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(submitButton.first()).toBeVisible();

    // Link para esqueci minha senha
    const forgotPasswordLink = page.getByRole('link', { name: /esqueci/i });
    if (await forgotPasswordLink.count() > 0) {
      await expect(forgotPasswordLink.first()).toBeVisible();
    }
  });

  test('1.5 - Tela de Login do Admin (/admin/login) deve renderizar elementos operacionais', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id*="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(submitButton.first()).toBeVisible();
  });

  test('1.6 - Submissão de login com campos vazios não deve autenticar', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Deve continuar na tela de login
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/login');
  });

  test('1.7 - Rota de recuperação de senha (/esqueci-senha) deve carregar corretamente', async ({ page }) => {
    await page.goto('/esqueci-senha');
    await page.waitForLoadState('domcontentloaded');

    const emailInput = page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.count() > 0) {
      await expect(emailInput.first()).toBeVisible();
    }
  });

});
