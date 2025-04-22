import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`Conectando ao banco de dados: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`);

// Configurar cliente postgres-js
const queryClient = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('sslmode=require'),
  max: 10, // Máximo de conexões no pool
});

export const db = drizzle(queryClient, { schema });

// Verificar conexão ao iniciar
queryClient`SELECT 1`
  .then(() => console.log('✅ Conexão com banco de dados estabelecida'))
  .catch((err) => console.error('❌ Erro ao conectar ao banco de dados:', err));
