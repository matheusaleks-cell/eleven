# Relatório de Auditoria Visual — Plataforma Eleven Firearms

**Data da Auditoria:** 15 de Agosto de 2026  
**Status:** Concluído (Fase 0)  
**Projeto:** `eleven-dashboard` (`DASHBOARD INVESTIDORES/eleven-dashboard`)

---

## 1. Diagnóstico Tecnológico e Arquitetural

| Aspecto | Especificação / Implementação Atual |
| :--- | :--- |
| **Framework & Versão** | **Next.js 16.2.6** (App Router) com **React 19.2.4** e TypeScript 5 |
| **Sistema de Estilos** | **Tailwind CSS v4** (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`) com diretiva `@theme` em `app/globals.css`, coexistindo com configuração residual em `tailwind.config.ts`, mais de 400 blocos de estilos inline (`style={{ ... }}`) e classes manuais (`clsx`, `tailwind-merge`) |
| **Biblioteca de Componentes** | Componentes primitivos próprios em `components/ui/*` (`Button`, `Card`, `Input`, `Dialog`), ícones via `lucide-react` (v1.14.0), gráficos via `recharts` (v3.8.1), notificações via `sonner` (v2.0.7), formulários via `react-hook-form` + `zod` |
| **Separação de Roteamento (Admin vs. Investidor)** | **Tríplice camada de proteção e layout:**<br>1. **Proxy / Middleware (`proxy.ts`):** NextAuth v5 intercepta rotas. Rotas `/admin/*` exigem `session.user.role === 'ADMIN'` (redireciona para `/admin/login`). Rotas `/investidor/*` exigem sessão ativa (redireciona para `/login`).<br>2. **Layouts de Servidor:** `app/admin/layout.tsx` valida sessão e role `ADMIN`; `app/investidor/layout.tsx` valida sessão e role `INVESTOR`.<br>3. **Layout de Apresentação (`DashboardLayout.tsx`):** Recebe `role="ADMIN"` ou `role="INVESTOR"`. No mobile, o Investidor recebe navegação fixa via `MobileTabBar` (`components/layout/MobileTabBar.tsx`), enquanto o Admin utiliza navegação retrátil (drawer). |

---

## 2. Inventário de Problemas Visuais Concretos

A auditoria identificou inconsistências estruturais distribuídas em cinco categorias críticas:

---

### A. Valores de espaçamento fora de qualquer escala (padding/margin arbitrários)

Valores "mágicos" que não respeitam a grade modular de 4px/8px, gerando descontinuidade de ritmo vertical e horizontal:

1. **`components/shared/FilterBar.tsx` (Linha 46):**  
   - `className="flex flex-wrap items-end gap-8 p-10 rounded-[4px]"` — `p-10` (40px de padding) em uma barra de filtro gera área desproporcional e desperdício de espaço vertical.
2. **`components/shared/StatCard.tsx` (Linhas 16, 37):**  
   - `className="rounded-[4px] p-8 transition-all"` e `className="p-2.5 rounded-[2px]"` — Uso de `p-8` (32px) em cards simples e `p-2.5` (10px) no ícone, fora da escala padrão.
3. **`components/layout/Sidebar.tsx` (Linhas 99, 111, 132, 141, 147, 156, 170, 199):**  
   - Múltiplos paddings arbitrários via inline style: `padding: "30px 24px 24px"` no cabeçalho, `padding: "10px 20px 8px"` na tag de role, `padding: "14px 20px"` no item de menu, `marginBottom: 6`, `margin: "0 16px 8px"`, `padding: "14px 16px"`.
4. **`components/layout/Header.tsx` (Linhas 53, 128, 154):**  
   - `gap: 24`, `paddingRight: 20`, `padding: "0 16px"`, `marginRight: 4` definidos via inline style sem sincronia com os tokens de layout.
5. **`app/login/page.tsx` (Linhas 121, 168-171, 221-224, 268) & `app/admin/login/page.tsx` (Linhas 120, 170-173, 224-227, 273):**  
   - Card com `p-10` (40px), inputs com `paddingTop: '14px'`, `paddingBottom: '14px'`, `paddingLeft: '52px'` (no Investidor) versus `paddingTop: '16px'`, `paddingBottom: '16px'`, `paddingLeft: '56px'` (no Admin).
6. **`app/admin/crm/clientes/page.tsx` (Linhas 380, 399, 405, 411, 419):**  
   - Todas as células `<td>` utilizam `px-6 py-6` (24px de padding vertical por linha), tornando a tabela excessivamente alta e pouco densa para um ambiente administrativo.
7. **`app/admin/page.tsx` (Linhas 148, 178, 225, 229):**  
   - `marginBottom: "24px"`, espaçador vazio `<div style={{ height: "32px" }} />` e `p-8` no painel financeiro.

---

### B. Tamanhos de fonte e pesos sem hierarquia definida

Multiplicidade de tamanhos arbitrários (`8px`, `9px`, `10px`, `11px`, `13px`, `15px`, `22px`, `32px`, `38px`), além de letter-spacing despadronizado (`0.04em`, `0.08em`, `0.1em`, `0.15em`, `0.18em`, `0.25em`, `0.5em`, `0.6em`):

1. **`components/layout/Header.tsx` (Linhas 99, 109, 131, 138, 156, 174, 189, 201):**  
   - Mistura de `fontSize: "9px"`, `fontSize: "10px"`, `fontSize: "12px"`, `fontSize: "14px"`, `fontSize: "15px"`, `fontSize: "16px"` com pesos 500, 600, 700 declarados inline.
2. **`components/layout/Sidebar.tsx` (Linhas 107, 142, 205, 206, 209):**  
   - `fontSize: "10px"` com `letterSpacing: "0.18em"`, `fontSize: "15px"` com `letterSpacing: "0.04em"`, `fontSize: "14px"`, `fontSize: "13px"`, `fontSize: "12px"`.
3. **`components/shared/WhatsAppWidget.tsx` (Linhas 23, 35, 39):**  
   - Classes `text-[9px]`, `text-[8px]`, `text-[10px]` sem escala tipográfica consistente.
4. **`components/shared/StatusBadge.tsx` (Linhas 46-50):**  
   - `fontSize: "11px"`, `letterSpacing: "0.1em"`, `fontWeight: 700`.
5. **`components/shared/StatCard.tsx` (Linhas 27, 53, 66):**  
   - `fontSize: "13px"`, `letterSpacing: "0.15em"`, `fontSize: "32px"`, `fontSize: "14px"`.
6. **`components/shared/FilterBar.tsx` (Linhas 38, 51, 142):**  
   - `fontSize: "14px"`, `fontSize: "13px"`, `letterSpacing: "0.15em"`, `fontSize: "13px"`.
7. **`app/investidor/page.tsx` (Linhas 116, 141, 187, 194, 204, 213, 218, 227, 244, 256, 318, 353, 372, 377, 388):**  
   - Emaranhado de micro-fontes: `text-[11px]`, `text-[10px]`, `text-[9px]`, `text-[8px]`, com `tracking-[0.2em]`, `tracking-[0.3em]`, `tracking-widest`.
8. **`app/login/page.tsx` vs. `app/admin/login/page.tsx`:**  
   - Login Investidor usa `fontSize: "10px"` com `letterSpacing: "0.5em"` e título `20px`; Login Admin usa `fontSize: "11px"` com `letterSpacing: "0.6em"` e título `22px`.

---

### C. Cores declaradas direto no componente em vez de variáveis/tokens

Mais de 400 declarações manuais de cores em formato hexadecimal e rgba nos componentes:

1. **`components/layout/Header.tsx` (Linhas 51, 52, 68, 71, 98, 107, 110, 131, 132, 137, 138, 146, 147, 156, 157, 159, 170, 187, 199):**  
   - `#161616`, `#242424`, `#2A2A2A`, `#A0A0A0`, `#555`, `#333`, `#FFFFFF`, `#F5C400`, `#4CAF50`, `rgba(245,196,0,0.12)`, `rgba(245,196,0,0.25)`.
2. **`components/layout/Sidebar.tsx` (Linhas 101-103, 114, 126, 127, 132, 135, 142, 147, 156, 165, 167, 184, 186, 199, 201, 205, 206, 209):**  
   - `#161616`, `#242424`, `#2A2A2A`, `#F5C400`, `#A0A0A0`, `#555`, `#666`, `#FFFFFF`, `rgba(245,196,0,0.10)`.
3. **`components/shared/StatusBadge.tsx` (Linhas 8-35):**  
   - Tabela de status com strings rgba e hex hardcoded (`rgba(245,196,0,0.1)`, `rgba(76,175,80,0.1)`, `rgba(96,96,96,0.15)`, `rgba(229,57,53,0.1)`).
4. **`components/shared/StatCard.tsx` (Linhas 18-20, 26, 39, 40, 50, 65):**  
   - `#242424`, `#333`, `#F5C400`, `#A0A0A0`, `rgba(245,196,0,0.08)`, `#FFFFFF`, `#666`.
5. **`components/shared/FilterBar.tsx` (Linhas 33-36, 47, 51, 61, 66, 76, 83, 99, 116, 118, 122, 123, 136, 139, 148, 149):**  
   - `#242424`, `#333`, `#FFFFFF`, `#1E1E1E`, `#2A2A2A`, `#888`, `#F5C400`, `#606060`, `#1A1A1A`, `#D4A900`.
6. **`components/shared/MoneyDisplay.tsx` (Linha 22):**  
   - `text-green-400` e `text-red-400` (cores utilitárias padrão do Tailwind, fora dos tokens de marca `--color-brand-success` e `--color-brand-danger`).
7. **`components/shared/WhatsAppWidget.tsx` (Linha 45):**  
   - `bg-[#25D366] hover:bg-[#128C7E]`.
8. **`components/ui/Dialog.tsx` (Linha 49):**  
   - `style={{ borderTop: "4px solid #F5C400" }}`.
9. **`app/investidor/page.tsx` (Linhas 310, 344-348, 358-361, 371, 378):**  
   - `#2196F3`, `#f44336`, `#FF9800`, `#F5C400`, `#404040` aplicados em barras de decomposição de receita e indicadores.
10. **`app/admin/page.tsx` (Linhas 150, 161, 169, 197, 229, 235, 245, 260, 265-274, 277-286, 298-320):**  
    - Cores `#2196F3`, `#f44336`, `#FF9800`, `#9C27B0`, `#4CAF50`, `#F5C400`, `#1a1a1a`, `#242424`, `#333`, `#606060`, `#FFFFFF` espalhadas no fluxo de caixa e KPIs.

---

### D. Componentes duplicados que fazem a mesma coisa com aparência diferente

1. **Telas de Login Duplicadas:**
   - `app/login/page.tsx` (Investidor) e `app/admin/login/page.tsx` (Admin) são 90% idênticas, duplicando lógica de submit, keyframes `@keyframes fade-in` e `@keyframes shake`, com pequenas divergências de tons de fundo (`#080808` vs `#050505`), raios de borda (`6px` vs `8px`) e paddings (`14px` vs `16px`).
2. **Três Modelos Concorrentes de Cards / Containers:**
   - Classe `.card` em `globals.css` (Linhas 132-137: `border-radius: 4px; padding: 20px 24px`);
   - Componente `<Card>` em `components/ui/Card.tsx` (`rounded-lg p-6 bg-brand-surface`);
   - Cards ad-hoc com estilos inline (`StatCard.tsx` com `rounded-[4px] p-8`, `app/investidor/projetos/page.tsx` linha 43 com `rounded-[4px] p-5`, e `FilterBar.tsx` com `rounded-[4px] p-10`).
3. **Padrões Divergentes de Botões:**
   - Componente `<Button>` em `components/ui/Button.tsx` (`rounded-military` = 2px);
   - Tags `<button>` nativas com inline styles (`borderRadius: "2px"` em `FilterBar.tsx`, `rounded-lg` em `WhatsAppWidget.tsx`);
   - Tags `<Link>` estilizadas manualmente como botões em `app/admin/page.tsx` (Linhas 158-174).
4. **Modais e Diálogos Fragmentados:**
   - `<Dialog>` em `components/ui/Dialog.tsx` (`rounded-lg`);
   - `<SaleModal>` em `components/crm/SaleModal.tsx` (`rounded-xl`);
   - `<CycleModal>` em `components/cycles/CycleModal.tsx` (`rounded-lg`);
   - Modal interno de `<CustomerProfile>` em `components/crm/CustomerProfile.tsx`;
   - Cada modal re-implementa de forma isolada o backdrop blur, controle de tecla `Escape`, travas de overflow e cabeçalhos.
5. **Estados de Carregamento Inconsistentes:**
   - Spinners centralizados ocupando tela cheia (`app/investidor/page.tsx` Linhas 64-69, `app/admin/page.tsx` Linhas 102-108, `app/investidor/extrato/page.tsx` Linhas 34-37);
   - Spinner de tabela em `app/admin/crm/clientes/page.tsx` (Linhas 365-371);
   - **Ausência total de Skeleton Screens** com o formato real dos dados.
6. **Múltiplos Padrões de Tabela:**
   - `.table-base` em `globals.css` (Linhas 201-243);
   - Tabelas manuais em `app/admin/crm/clientes/page.tsx` (Linhas 352-450) e `app/investidor/page.tsx` (Linhas 242-270) com tipografias de cabeçalho distintas (`text-[9px] font-black` vs `text-[10px] uppercase` vs `text-[11px] font-semibold`).

---

### E. Quebras de layout em telas estreitas (360px – 430px)

1. **`components/shared/FilterBar.tsx` (Linhas 46, 59, 74):**  
   - `gap-8 p-10` combinado com inputs de largura fixa `width: "160px"`. Em telas de 360px a 390px, o container quebra de forma desordenada e causa transbordamento horizontal devido aos 40px de padding lateral.
2. **`components/layout/Header.tsx` (Linhas 125, 154):**  
   - No mobile, o indicador "USD ATUAL" com bordas e paddings fixos compete com o logo e avatar, espremendo os elementos no topo de dispositivos estreitos.
3. **`components/shared/WhatsAppWidget.tsx` (Linha 14):**  
   - O popover possui largura fixa `w-[320px]` posicionada a `right-6` (24px). Em telas de 360px (`320 + 24 + 24 = 368px`), o widget estoura a viewport horizontal.
4. **`app/investidor/page.tsx` (Linha 120, 138, 153):**  
   - Os cards de KPI exibem valores em `text-3xl font-mono`. Em saldos monetários extensos (ex.: `R$ 1.250.800,00`), o texto estoura os limites do card em telas de 360px.
5. **`app/investidor/page.tsx` (Linhas 241-270):**  
   - Tabela de "Vendas Recentes" com 6 colunas encapsulada apenas em `overflow-x-auto`, sem layout em formato de card para mobile, gerando visual denso e ilegível no celular.
6. **`app/investidor/extrato/page.tsx` (Linhas 86-103):**  
   - Grid de estatísticas financeiras com valores fixos em `text-2xl font-mono` sem ajuste responsivo para telas compactas.
7. **`app/admin/crm/clientes/page.tsx` (Linhas 350-450):**  
   - Tabela de dados ampla sem visualização adaptativa (cards) para telas mobile, cortando botões de ação e dados fiscais.
8. **`app/admin/page.tsx` (Linha 292):**  
   - Grid financeiro `grid-cols-2 md:grid-cols-3 xl:grid-cols-6` em 360px comprime os rótulos a ponto de quebrar palavras em 3 linhas.

---

## 3. Resumo da Auditoria

O projeto possui uma base sólida em Next.js 16 com autenticação funcional, mas sofre com **acúmulo de estilos inline ad-hoc**, **duplicação de telas/modais** e **ausência de um design system unificado**.

A transição para a **Fase 1 (Tokens)** permitirá:
- Centralizar a paleta existente (#1A1A1A, #242424, #2E2E2E, #F5C400, #4CAF50, #E53935, #FF9800, etc.) em variáveis CSS sem criar novas cores.
- Estabelecer uma escala modular de 4px para espaçamentos e raios de borda.
- Definir 6 degraus tipográficos precisos para substituir as classes arbitrárias `text-[8px]` a `text-[38px]`.
- Padronizar durações de animação (150ms, 250ms, 350ms) e suporte a `prefers-reduced-motion`.

---

**Fim do Relatório da Fase 0.**  
*Aguardando sua revisão e aprovação para avançar para a Fase 1 (Tokens).*
