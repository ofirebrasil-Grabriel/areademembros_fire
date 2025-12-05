-- Adiciona a coluna lead_id na tabela profiles para vincular usuários aos leads (e consequentemente aos pedidos)
ALTER TABLE profiles ADD COLUMN lead_id bigint;

-- Adiciona a chave estrangeira para garantir que o lead_id exista na tabela leads
ALTER TABLE profiles 
    ADD CONSTRAINT profiles_lead_id_fkey 
    FOREIGN KEY (lead_id) 
    REFERENCES leads(id);

-- Cria um índice para melhorar a performance de buscas por lead_id
CREATE INDEX idx_profiles_lead_id ON profiles(lead_id);
