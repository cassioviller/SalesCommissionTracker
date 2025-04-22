-- Inserir dados de exemplo se a tabela estiver vazia

-- Verificar se já existem propostas
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM sales_proposals) = 0 THEN
    -- Inserir propostas de exemplo
    INSERT INTO sales_proposals (proposta, valorTotal, valorPago, percentComissao, valorComissaoPaga)
    VALUES
      ('Proposta Cliente A', 15000.00, 10000.00, 5.00, 500.00),
      ('Proposta Cliente B', 25000.00, 25000.00, 3.50, 875.00),
      ('Proposta Cliente C', 8000.00, 2000.00, 4.00, 80.00),
      ('Proposta Cliente D', 32000.00, 16000.00, 6.00, 960.00),
      ('Proposta Cliente E', 18500.00, 18500.00, 2.50, 462.50);
    
    RAISE NOTICE 'Dados de exemplo inseridos com sucesso.';
  ELSE
    RAISE NOTICE 'Tabela já contém dados, pulando inserção de exemplos.';
  END IF;
END
$$;