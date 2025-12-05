-- Define o fuso horário do banco de dados para America/Sao_Paulo
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Opcional: Se você tiver colunas 'timestamp without time zone' que estão salvando UTC,
-- você pode alterar o default delas assim (exemplo):
-- ALTER TABLE nome_da_tabela ALTER COLUMN created_at SET DEFAULT timezone('America/Sao_Paulo', now());

-- Para verificar a hora atual do banco:
SELECT now();
