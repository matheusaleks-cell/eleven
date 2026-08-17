# Guia de Testes Automatizados e Sprints de Validação — Eleven Dashboard

Este documento descreve a infraestrutura de testes automatizados configurada com base na skill **`webapp-testing`** e adaptada para **Playwright + TypeScript + Node.js**.

---

## 1. Estrutura Instalada

A skill foi instalada no ambiente Antigravity e integrada ao projeto:
- **Skill Global**: `~/.gemini/config/skills/webapp-testing/`
- **Skill no Workspace**: `.agents/skills/webapp-testing/`
- **Lifecycle Runner**: `scripts/with_server.js` (gerencia abertura do servidor `next dev`, execução de testes e encerramento limpo)
- **Configuração de Teste**: `playwright.config.ts` (suporte a Desktop 1440px, Mobile Estreito 360px, Mobile Padrão 390px e Tablet 768px)

---

## 2. Mapa dos Sprints de Teste

| Sprint | Arquivo | Escopo & Objetivos de Teste |
| :--- | :--- | :--- |
| **Sprint 1** | `tests/sprint1-auth.spec.ts` | **Autenticação & Proteção de Rotas:** Redirecionamento de `/investidor` e `/admin` sem login, integridade das telas `/login` e `/admin/login`, validação de formulários vazios e recuperação de senha. |
| **Sprint 2** | `tests/sprint2-visual-tokens.spec.ts` | **Design System & Auditoria Visual:** Conformidade com tokens CSS, ausência de transbordamentos horizontais, hierarquia tipográfica e áreas mínimas de clique. |
| **Sprint 3** | `tests/sprint3-responsive.spec.ts` | **Responsividade (360px – 1440px):** Teste de overflow horizontal em 4 viewports, comportamento de cards e botões em telas estreitas (360px) prevenindo quebras relatadas na Auditoria Visual. |
| **Sprint 4** | `tests/sprint4-investor-flow.spec.ts` | **Módulo do Investidor:** Estrutura e resposta das rotas de extrato, projetos, documentos e perfil com validação de metatags. |
| **Sprint 5** | `tests/sprint5-admin-crm.spec.ts` | **Módulo Administrativo & CRM:** Proteção de rotas admin, acessibilidade de inputs (labels, placeholders, aria) e ausência de erros críticos de console. |

---

## 3. Comandos de Execução

Todos os comandos podem ser disparados via terminal no diretório `eleven-dashboard`:

```bash
# Executar todos os testes em todos os navegadores/viewports
npm test

# Executar sprint específica
npm run test:sprint1
npm run test:sprint2
npm run test:sprint3
npm run test:sprint4
npm run test:sprint5

# Executar com a interface visual interativa do Playwright
npm run test:ui

# Executar testes garantindo subida e encerramento do servidor
npm run test:with-server
```

---

## 4. Testes em Viewports Específicos

Para testar especificamente o viewport mobile de 360px da auditoria visual:

```bash
npx playwright test --project="Mobile Narrow (360px - Auditoria)"
```

Para visualizar o relatório HTML gerado após os testes:

```bash
npx playwright show-report
```
