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

until pg_isready -h $(echo $DATABASE_URL | sed -E 's/^.*@([^:]+):.*/\1/') -p $(echo $DATABASE_URL | sed -E 's/^.*:([0-9]+).*/\1/') -U $(echo $DATABASE_URL | sed -E 's/^.*:\/\/([^:]+):.*/\1/') || [ $COUNTER -eq $MAX_ATTEMPTS ]
do
  echo "Aguardando banco de dados... ($COUNTER/$MAX_ATTEMPTS)"
  sleep 2
  COUNTER=$((COUNTER+1))
done

if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
  echo "Falha ao conectar ao banco de dados!"
  exit 1
fi

echo "Banco de dados conectado com sucesso!"

# Executa migrações do banco de dados
echo "Executando migrações do banco de dados..."
npm run db:push

# Inicia a aplicação
echo "Iniciando aplicação..."
exec "$@"