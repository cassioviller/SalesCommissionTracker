// Verificação de conexão com o banco de dados para uso no EasyPanel
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';

// Garante que o diretório scripts existe
if (!fs.existsSync('./scripts')) {
  fs.mkdirSync('./scripts');
}

function log(message) {
  console.log(`[DB-CHECK] ${message}`);
  fs.appendFileSync('./scripts/db-check.log', `${new Date().toISOString()} - ${message}\n`);
}

async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    log('❌ DATABASE_URL não está definida!');
    process.exit(1);
  }

  log(`Tentando conectar a: ${process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@')}`);
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const client = await pool.connect();
    log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Teste básico de query
    const result = await client.query('SELECT 1 as test');
    log(`Query de teste executada: ${JSON.stringify(result.rows[0])}`);
    
    client.release();
    await pool.end();
    log('Conexão fechada.');
    
    process.exit(0);
  } catch (error) {
    log(`❌ Erro ao conectar ao banco de dados: ${error.message}`);
    log('Detalhes do erro:');
    log(JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

checkDatabaseConnection().catch(error => {
  log(`❌ Erro não tratado: ${error.message}`);
  process.exit(1);
});