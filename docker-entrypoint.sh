#!/bin/bash

# Configuração do ambiente
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5000}

echo "=== Iniciando aplicação em modo: $NODE_ENV ==="

# Verifica se DATABASE_URL está definido
if [ -z "$DATABASE_URL" ]; then
  echo "ERRO: Variável DATABASE_URL não está definida!"
  exit 1
fi

# Verifica se o banco de dados está acessível
echo "Verificando conexão com o banco de dados..."
MAX_ATTEMPTS=30
COUNTER=0

# Tenta extrair informações de conexão do DATABASE_URL
PGHOST=$(echo $DATABASE_URL | sed -E 's/^.*@([^:]+):.*/\1/' 2>/dev/null || echo "localhost")
PGPORT=$(echo $DATABASE_URL | sed -E 's/^.*:([0-9]+).*/\1/' 2>/dev/null || echo "5432")
PGUSER=$(echo $DATABASE_URL | sed -E 's/^.*:\/\/([^:]+):.*/\1/' 2>/dev/null || echo "postgres")

echo "Tentando conectar a: Host=$PGHOST, Porta=$PGPORT, Usuário=$PGUSER"

# Função para verificar conexão de forma segura
check_db_connection() {
  # Se tiver SSL, usamos curl para testar
  if [[ "$DATABASE_URL" == *"sslmode=require"* ]]; then
    curl -s "https://$PGHOST:$PGPORT" > /dev/null 2>&1
    return $?
  else
    # Se não tiver SSL, usamos pg_isready
    pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" > /dev/null 2>&1
    return $?
  fi
}

# Loop de tentativas
until check_db_connection || [ $COUNTER -eq $MAX_ATTEMPTS ]
do
  echo "Aguardando banco de dados... ($COUNTER/$MAX_ATTEMPTS)"
  sleep 2
  COUNTER=$((COUNTER+1))
done

if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
  echo "Falha ao conectar ao banco de dados!"
  echo "URL do banco: ${DATABASE_URL//:*@/:***@}"
  exit 1
fi

echo "Banco de dados conectado com sucesso!"

# Executa migrações do banco de dados
echo "Executando migrações do banco de dados..."
npm run db:push

# Inicia a aplicação
echo "Iniciando aplicação..."
exec "$@"