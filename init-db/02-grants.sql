-- Garantir que o usuário tenha todas as permissões necessárias
GRANT ALL PRIVILEGES ON DATABASE comissoes TO comissoes_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO comissoes_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO comissoes_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO comissoes_user;