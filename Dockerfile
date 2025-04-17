FROM node:20-slim

WORKDIR /app

# Instalar ferramentas necessárias
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o restante dos arquivos do projeto
COPY . .

# Tornar o script de entrada executável
RUN chmod +x docker-entrypoint.sh

# Executar o build da aplicação
RUN npm run build

# Expor a porta utilizada pelo aplicativo
EXPOSE 5000

# Definir o script de entrada como ENTRYPOINT
ENTRYPOINT ["./docker-entrypoint.sh"]

# Comando para iniciar a aplicação
CMD ["npm", "run", "start"]