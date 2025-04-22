FROM node:20-slim

WORKDIR /app

# Instalar ferramentas necessárias (inclui postgresql-client para scripts de inicialização)
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante dos arquivos do projeto
COPY . .

# Executar o build da aplicação
RUN npm run build

# Expor a porta utilizada pelo aplicativo (port será redirecionada pelo EasyPanel)
EXPOSE 5000

# Verificar se DATABASE_URL está definido, caso contrário definir com valor padrão
ENV DATABASE_URL=${DATABASE_URL:-postgres://comissoes_user:senha123forte@estruturas_comissoes:5432/comissoes?sslmode=disable}
ENV PORT=${PORT:-5000}

# Comando para iniciar a aplicação
# Nota: Não usamos ENTRYPOINT para facilitar integrações com plataformas como EasyPanel
CMD npm run db:push && npm run start