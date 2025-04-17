-- Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_proposals (
  id SERIAL PRIMARY KEY,
  proposta TEXT NOT NULL,
  valor_total NUMERIC(10,2) NOT NULL,
  valor_pago NUMERIC(10,2) NOT NULL,
  percent_comissao NUMERIC(5,2) NOT NULL,
  valor_comissao_paga NUMERIC(10,2) NOT NULL
);

-- Inserir dados iniciais de exemplo
INSERT INTO sales_proposals (proposta, valor_total, valor_pago, percent_comissao, valor_comissao_paga)
VALUES 
  ('264.24 – Orlando', 24500, 12250, 10, 1225),
  ('192.18 – Maria Alice', 18750, 18750, 12, 2250),
  ('305.32 – Pedro Souza', 42800, 21400, 15, 3210),
  ('178.09 – Alexandre Lima', 15300, 0, 8, 0)
ON CONFLICT DO NOTHING;