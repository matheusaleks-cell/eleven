-- Índices de performance (declarados em prisma/schema.prisma).
-- O Turso NÃO é atualizado pelo `prisma generate`/build: este arquivo precisa ser aplicado
-- manualmente no banco de produção (idempotente: pode rodar mais de uma vez).
-- Só criam índices, não alteram nem apagam dados.

-- Busca de estoque por produto, mais antigo primeiro:
--   WHERE product_id = ? AND current_status = 'ESTOQUE' ORDER BY entry_date
CREATE INDEX IF NOT EXISTS "weapons_map_product_id_current_status_entry_date_idx"
  ON "weapons_map" ("product_id", "current_status", "entry_date");

-- Lista de pedidos (ORDER BY created_at DESC) e total de vendas do mês no cabeçalho.
CREATE INDEX IF NOT EXISTS "sales_orders_created_at_idx"
  ON "sales_orders" ("created_at");
