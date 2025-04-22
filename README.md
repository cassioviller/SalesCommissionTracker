# Sistema de Gerenciamento de Comissões de Vendas

Este é um sistema para gerenciar comissões de vendas, com tabela interativa e gráficos visuais.

## Requisitos

- Node.js 20+
- PostgreSQL 15+

## Deploy com EasyPanel

### Opção 1: Deploy via Dockerfile (Recomendado)

1. No EasyPanel, crie um novo serviço
2. Selecione "Dockerfile" como método de construção
3. Faça upload do código ou conecte ao repositório Git
4. Configure as variáveis de ambiente no EasyPanel:
   - `DATABASE_URL`: Configuração de conexão com o PostgreSQL (fornecida pelo EasyPanel ou externa)
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (ou a porta que o EasyPanel configurar)
5. Clique em "Deploy"

### Configuração do Banco de Dados

Ao iniciar pela primeira vez, o sistema:
1. Verifica a conexão com o banco de dados
2. Executa as migrações necessárias para criar as tabelas
3. Popula o banco com dados de exemplo (se estiver vazio)

### Variáveis de Ambiente

- `DATABASE_URL`: URL de conexão com o PostgreSQL
- `PORT`: Porta em que o servidor será executado (padrão: 5000)
- `NODE_ENV`: Ambiente de execução (`development` ou `production`)

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Compilar para produção
npm run build

# Executar em modo de produção
npm run start
```