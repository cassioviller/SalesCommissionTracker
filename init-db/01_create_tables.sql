-- Criar tabelas iniciais caso ainda não existam

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Criar tabela de propostas de vendas
CREATE TABLE IF NOT EXISTS sales_proposals (
  id SERIAL PRIMARY KEY,
  proposta TEXT NOT NULL,
  valorTotal NUMERIC(15, 2) NOT NULL,
  valorPago NUMERIC(15, 2) NOT NULL,
  percentComissao NUMERIC(5, 2) NOT NULL,
  valorComissaoPaga NUMERIC(15, 2) NOT NULL
);