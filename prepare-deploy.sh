#!/bin/bash

# Criar diretório temporário para arquivos de deploy
mkdir -p deploy_temp

# Copiar arquivos necessários para deploy
cp -r client deploy_temp/
cp -r server deploy_temp/
cp -r shared deploy_temp/
cp -r init-db deploy_temp/
cp Dockerfile deploy_temp/
cp .env deploy_temp/
cp README.md deploy_temp/
cp easypanel.config.json deploy_temp/
cp package.json deploy_temp/
cp package-lock.json deploy_temp/
cp tsconfig.json deploy_temp/
cp vite.config.ts deploy_temp/
cp tailwind.config.ts deploy_temp/
cp postcss.config.js deploy_temp/
cp drizzle.config.ts deploy_temp/
cp theme.json deploy_temp/

# Criar arquivo zip
cd deploy_temp
zip -r ../deploy.zip ./*
cd ..

# Remover diretório temporário
rm -rf deploy_temp

echo "Arquivo deploy.zip criado com sucesso!"
echo "Faça upload deste arquivo no EasyPanel."