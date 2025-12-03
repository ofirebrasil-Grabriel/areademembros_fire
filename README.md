# Desafio FIRE 15 Dias

## Configuração do Banco de Dados (Supabase)

Para que o aplicativo funcione com as credenciais inseridas, você deve criar a estrutura do banco de dados.

1.  Acesse o Painel do seu projeto no Supabase.
2.  No menu lateral, clique em **SQL Editor**.
3.  Clique em **New Query**.
4.  Copie todo o conteúdo do arquivo `db/schema.sql` deste projeto.
5.  Cole no editor do Supabase e clique em **RUN**.

Isso criará:
*   Tabelas de usuários, desafios, tarefas e progresso.
*   Políticas de segurança (quem pode ver o quê).
*   Gatilhos (Triggers) para criar perfil automaticamente ao se cadastrar.

## Acesso Admin

### Acesso
O sistema utiliza autenticação via Supabase. Certifique-se de ter as credenciais configuradas no `.env`. (Com banco de dados)
1.  Cadastre-se normalmente na tela de login.
2.  Vá no painel do Supabase -> Table Editor -> `profiles`.
3.  Encontre seu usuário e mude a coluna `role` para `admin`.
4.  Faça login novamente ou recarregue a página.
