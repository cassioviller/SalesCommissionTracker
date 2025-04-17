#!/bin/bash
set -e

# Aguarda o PostgreSQL iniciar
echo "Aguardando PostgreSQL iniciar..."
until PGPASSWORD=senha123forte psql -h estruturas_comissoes -U comissoes_user -d comissoes -c '\q'; do
  >&2 echo "PostgreSQL indisponível - aguardando..."
  sleep 1
done

echo "PostgreSQL pronto! Inicializando aplicação..."

# Executa as migrações do banco de dados
echo "Executando as migrações do banco de dados..."
npm run db:push

# Inicia a aplicação
echo "Iniciando a aplicação..."
exec "$@"