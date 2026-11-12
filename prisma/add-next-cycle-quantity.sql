-- Coluna opcional: quantidade proposta para o próximo ciclo do projeto.
-- Aditiva (nullable, sem default): não altera nenhuma linha existente.
ALTER TABLE investment_projects ADD COLUMN next_cycle_quantity INTEGER;
