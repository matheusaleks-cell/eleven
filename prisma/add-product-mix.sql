-- Coluna opcional: produtos do projeto (JSON [{ productId, name, quantity }]).
-- Aditiva (nullable, sem default): não altera nenhuma linha existente.
ALTER TABLE investment_projects ADD COLUMN product_mix TEXT;
