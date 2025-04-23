// Script para criar tabelas no banco de dados

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { users, partners, salesProposals, pagamentoPropostas, pagamentoComissoes } from '../shared/schema';
import ws from 'ws';
import { createInsertSchema } from 'drizzle-zod';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL deve ser definido no ambiente");
}

async function main() {
  console.log("Conectando ao banco de dados...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Criando tabelas...");

  // Verificar se as tabelas existem e criar se não existirem
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      );
      
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        proposal_ids JSONB DEFAULT '[]'
      );
      
      CREATE TABLE IF NOT EXISTS sales_proposals (
        id SERIAL PRIMARY KEY,
        proposta TEXT NOT NULL,
        valor_total NUMERIC(10,2) NOT NULL,
        valor_pago NUMERIC(10,2) NOT NULL,
        percent_comissao NUMERIC(5,2) NOT NULL,
        valor_comissao_paga NUMERIC(10,2) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS pagamento_propostas (
        id SERIAL PRIMARY KEY,
        proposta_id INTEGER NOT NULL,
        valor NUMERIC(10,2) NOT NULL,
        data_pagamento DATE NOT NULL,
        observacao TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS pagamento_comissoes (
        id SERIAL PRIMARY KEY,
        proposta_id INTEGER NOT NULL,
        valor NUMERIC(10,2) NOT NULL,
        data_pagamento DATE NOT NULL,
        observacao TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log("Tabelas criadas ou já existentes!");
  } catch (error) {
    console.error("Erro ao criar tabelas:", error);
    process.exit(1);
  }

  // Fechar conexão
  await pool.end();
  console.log("Concluído!");
}

main().catch(console.error);