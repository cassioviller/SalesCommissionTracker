import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Verificar se o ambiente define a URL do banco de dados
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Mostrar a URL de conexão (sem exibir a senha)
console.log(`Conectando ao banco de dados: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`);

// Configurar o cliente postgres-js
const queryClient = postgres(process.env.DATABASE_URL, {
  ssl: process.env.DATABASE_URL.includes('sslmode=require'),
  max: 10, // Máximo de conexões no pool
  connect_timeout: 10, // Timeout de conexão em segundos
  idle_timeout: 30 // Timeout de inatividade
});

// Nota: Para deploys com EasyPanel, substituir a URL para:
// postgres://comissoes_user:senha123forte@estruturas_comissoes:5432/comissoes?sslmode=disable

export const db = drizzle(queryClient, { schema });

// Função para verificar conexão
async function testDatabaseConnection() {
  try {
    await queryClient`SELECT 1`;
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err);
    return false;
  }
}

// Iniciar verificação, mas não bloqueie a inicialização do servidor
testDatabaseConnection();
