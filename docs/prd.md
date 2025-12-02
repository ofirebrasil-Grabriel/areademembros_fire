# **Documento de Requisitos do Produto (PRD) – Versão Final**

**Nome do Projeto:** **Desafio FIRE 15 Dias**

## **1. Visão Geral (Overview)**

O **Desafio FIRE 15 Dias** é uma plataforma de assinatura (membership site) que entrega um programa de educação financeira dividido em 15 etapas diárias. O produto tem como alvo pessoas físicas que desejam organizar suas finanças, aprender o método **FIRE** e criar hábitos de independência financeira.

Essa área de membros permitirá que os clientes:

- **Acessem conteúdos diários** com mensagens motivacionais, conceitos teóricos, tarefas práticas, recursos complementares (planilhas, PDFs, áudios, vídeos) e reflexões guiadas;
- **Marquem o progresso** dia a dia, com controle de desbloqueio sequencial (o Dia 2 só libera após a conclusão do Dia 1);
- **Gerenciem suas anotações**, acompanhem métricas de progresso e interajam com a comunidade (fórum/grupo de discussão);
- **Recebam notificações e e‑mails** automatizados de lembrete, conquistas e eventos ao vivo;
- **Tenham uma experiência responsiva e segura**, com autenticação via e‑mail/senha ou Google e com dados isolados por usuário.

O projeto também contempla um **painel administrativo** para que o gestor configure os desafios, suba materiais, gerencie usuários e visualize métricas do curso.

## **2. Metas (Objectives)**

1. **Desbloqueio sequencial e gamificação:** garantir que o sistema libere cada dia do desafio somente após o usuário concluir todas as tarefas do dia anterior. O progresso deve ser registrado no banco e exibido de forma clara.
2. **Gestão de conteúdos completa:** permitir que o administrador crie/edite cada dia (títulos, textos, tarefas, reflexões, compromissos), faça upload de materiais complementares e veja versões anteriores. Isso vai exigir uma boa camada de gerenciamento de conteúdos, com possibilidade de versionamento[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Content%20Management).
3. **Experiência de usuário responsiva e intuitiva:** o painel de membros deve oferecer navegação fluida em qualquer dispositivo, com progress trackers e rótulos descritivos para orientar o usuário[memberpress.com](https://memberpress.com/blog/membership-site-retention/#:~:text=The%20moment%20someone%20signs%20up,first%20peek%20behind%20the%20paywall).
4. **Engajamento e retenção:** implementar notificações (in‑app e e‑mail), comunidade e mini‑eventos para estimular o engajamento contínuo, conforme recomendações de especialistas em membership sites[memberpress.com](https://memberpress.com/blog/membership-site-retention/#:~:text=4.%20Re,Based%20Challenge).
5. **Segurança e privacidade:** adotar Row‑Level Security (RLS) no Supabase para isolar dados de cada usuário[supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=When%20you%20need%20granular%20authorization,RLS). Cada consulta só deve retornar linhas com `auth.uid()` correspondente. Utilizar criptografia para dados sensíveis e registro de auditoria para ações administrativas[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Audit).
6. **Administração eficiente:** disponibilizar painel administrativo robusto com controle de usuários, papéis e permissões (RBAC)[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=1), gestão de desafios, tarefas e recursos, painel de métricas, busca e filtros[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Viewing%20Data), ações em massa e logs.

## **3. Stack Tecnológica e Integrações**

- **Frontend:** React com Vite (ou Next.js) e Tailwind/Chakra/UI customizadas, hospedado na Hostinger (build estático). Caso a plataforma seja construída no Google Studio (Google Sites), deve-se gerar componentes HTML/CSS/JS compatíveis com a ferramenta.
- **Autenticação & Banco de dados:** Supabase self‑hostado (PostgreSQL). Ele oferece Auth, Row‑Level Security e Storage. RLS deve ser habilitado em todas as tabelas para garantir que cada usuário acesse somente seus próprios registros[supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=When%20you%20need%20granular%20authorization,RLS).
- **Armazenamento de arquivos:** Supabase Storage, com buckets separados por dia (`day‑01`, `day‑02` …) para planilhas, PDFs, áudios e vídeos.
- **Automação de e‑mails:** n8n self‑hostado, integrando com serviço de SMTP (ex.: Gmail, SendGrid). O backend chamará o webhook n8n para enviar e‑mails transacionais (boas‑vindas, redefinição de senha, lembretes) conforme eventos.
- **Integração com Hotmart:** Edge Function (Supabase Functions) para receber webhooks de pagamento confirmado, criar/ativar usuários e atualizar status.
- **Ferramentas de monitoramento:** logs e dashboard via Supabase e ferramentas analíticas para acompanhar métricas de uso.
- **UI/Design:** Identidade visual FIRE (cores #011627, #203342, #D9DBE4, #F7F7FF e #FF6600; logotipo com chama).

## **4. Páginas e Funcionalidades Essenciais**

### 4.1 Área de Membros (usuário final)

1. **Login e cadastro:**
    - Formulário de login por e‑mail/senha e integração OAuth com Google.
    - Página de redefinição de senha via e‑mail.
    - Mensagens de erros amigáveis e feedback de sucesso.
2. **Onboarding inicial:**
    - Primeira vez: página de boas‑vindas com vídeo explicativo e checklist sobre como usar a plataforma[memberpress.com](https://memberpress.com/blog/membership-site-retention/#:~:text=1).
    - Após onboarding: redirecionar direto ao painel de progresso.
3. **Dashboard principal:**
    - Cartão de progresso global (ex.: “3 de 15 dias concluídos”) com barra de progresso.
    - Lista/grade dos 15 dias com status (concluído, atual, bloqueado) e navegação para cada dia.
    - Seção de notificações (recados, webinars, conquistas).
4. **Página do Dia:**
    - Cabeçalho com título, número do dia e duração estimada.
    - Seções: mensagem matinal, conceito FIRE, resumo do desafio, checklist de tarefas (passos), materiais complementares, resultado esperado, reflexão guiada com espaço para notas pessoais, compromisso do dia e teaser do próximo dia.
    - Botões de navegação (“Dia anterior”, “Próximo dia”), com bloqueio até que todas as tarefas do dia atual estejam marcadas.
    - Exibir e permitir download dos materiais do Supabase Storage por tipo (planilha, PDF, áudio, vídeo, link externo).
5. **Biblioteca de Conteúdo (opcional):** lista de todos os materiais extras organizados por categorias (planilhas, PDFs, áudios, vídeos), com busca e filtros[memberdev.com](https://memberdev.com/essential-features-for-online-membership-communities/#:~:text=,Content%20favoriting%20%28bookmarking).
6. **Comunidade e suporte:**
    - Integração com fórum, grupo de WhatsApp/Discord ou comentários embutidos. Permite interação entre participantes.
    - Página de FAQ e formulário de suporte.
7. **Perfil e configurações:**
    - Tela de perfil com dados pessoais, preferências de notificação e histórico de progresso.
    - Opção de desativar/ativar e-mails e ver Termos de Uso e Política de Privacidade.

### 4.2 Painel Administrativo (admin)

1. **Autenticação e permissões:**
    - Login separado para administradores.
    - Papéis `admin` e `superadmin`. O RBAC deve restringir operações com base no papel[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=1).
2. **Gestão de usuários:**
    - Lista de usuários com filtros (status, data, e-mail) e pesquisa[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Viewing%20Data).
    - Possibilidade de ativar/bloquear usuários, resetar senhas e alterar papéis. Ações em massa para facilitar bloqueios/ativação[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=6,Notifications%20and%20Alerts).
    - Tela de detalhes do usuário com registro de progresso, materiais acessados e logs.
3. **Gestão de desafios (Dias):**
    - Tabela com os 15 dias, permitindo criar/editar/remover dias.
    - Edição completa de cada dia: texto, tarefas (CRUD com ordenação por drag‑and‑drop), recursos (upload, edição, exclusão) e campos extras (reflexões, compromissos, prévia).
    - Versões de conteúdo para restaurar edições anteriores[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Content%20Management).
4. **Gestão de recursos:**
    - Upload de PDFs, planilhas, áudios e vídeos para o bucket do Supabase e associação com o dia correspondente.
    - Definição de tipo (`pdf`, `sheet`, `audio`, `video`, `link`), descrição e badge (ex.: obrigatório, complementar, em breve).
5. **Painel de métricas:**
    - Dashboard com gráficos mostrando número de usuários ativos, taxa de conclusão de cada dia, downloads de materiais e engajamento[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=3).
    - Atualização em tempo real ou via refresh manual[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=2.%20Real).
    - Exportar dados para CSV/Excel.
6. **Workflows e automações:**
    - Configuração de webhooks (Hotmart, n8n) e e‑mails transacionais.
    - Criação de fluxos automatizados (ex.: notificar admin quando um usuário completar o desafio)[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=4,and%20automations).
7. **Configurações gerais:**
    - Campos para definir chaves de API (Google OAuth, SMTP, Hotmart) e URLs.
    - Gerenciamento de textos padrão, templates de e‑mail e políticas de privacidade.
    - Ferramentas de auditoria e logs de ações dos administradores[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Audit).

## **5. Modelo de Dados (Data Model)**

Utilizar PostgreSQL no Supabase. Todas as tabelas devem ter `id` do tipo UUID ou `bigint` (a depender da preferência) e timestamps (`created_at`, `updated_at`). RLS habilitado em cada tabela. A seguir, modelo sugerido:

### **Tabela: profiles (Usuários)**

- `id`: UUID (PK, FK → auth.users)
- `name`: TEXT
- `email`: TEXT UNIQUE
- `status`: ENUM (`PENDING`, `ACTIVE`, `BLOCKED`) – controla acesso.
- `hotmart_id`: TEXT (opcional, identifica compra)
- `created_at`, `updated_at`: TIMESTAMPTZ

### **Tabela: user_roles**

- `id`: UUID (PK)
- `user_id`: UUID (FK → profiles)
- `role`: ENUM (`admin`, `member`, `superadmin`)
- UNIQUE (`user_id`, `role`)

### **Tabela: challenges**

- `id`: UUID (PK)
- `day`: INTEGER UNIQUE (1–15)
- `title`: TEXT
- `description`: TEXT – resumo do dia.
- `duration_minutes`: INTEGER
- `morning_message`: TEXT
- `fire_concept`: TEXT
- `challenge_summary`: TEXT
- `result_expected`: TEXT
- `reflection_questions`: TEXT
- `commitment`: TEXT
- `tomorrow_preview`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

### **Tabela: challenge_tasks**

- `id`: UUID (PK)
- `challenge_id`: UUID (FK → challenges)
- `title`: TEXT
- `description`: TEXT (opcional)
- `order_index`: INTEGER
- `created_at`: TIMESTAMPTZ

### **Tabela: challenge_resources**

- `id`: UUID (PK)
- `challenge_id`: UUID (FK → challenges)
- `title`: TEXT
- `description`: TEXT
- `type`: TEXT CHECK (IN ('pdf','sheet','audio','video','link','community')) – extensível.
- `url`: TEXT
- `badge`: TEXT
- `created_at`: TIMESTAMPTZ

### **Tabela: user_progress**

- `id`: UUID (PK)
- `user_id`: UUID (FK → profiles)
- `challenge_id`: UUID (FK → challenges)
- `task_id`: UUID (FK → challenge_tasks)
- `completed`: BOOLEAN DEFAULT FALSE
- `completed_at`: TIMESTAMPTZ
- UNIQUE (`user_id`, `task_id`)

### **Tabela (opcional): user_notes**

- `id`: UUID (PK)
- `user_id`: UUID (FK → profiles)
- `challenge_id`: UUID (FK → challenges)
- `note`: TEXT
- `created_at`, `updated_at`: TIMESTAMPTZ

### **Tabela (admin): audit_logs**

- `id`: UUID (PK)
- `user_id`: UUID (FK → profiles)
- `action`: TEXT
- `entity_type`: TEXT
- `entity_id`: UUID
- `details`: JSONB
- `created_at`: TIMESTAMPTZ

Cada tabela deve ter RLS ativado. Por exemplo, `profiles` permite que o usuário consulte apenas seu próprio registro, enquanto `user_progress` permite ver apenas progresso do próprio usuário. RLS é recomendada pelo Supabase para garantir acesso seguro e multi‑tenant[antstack.com](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/#:~:text=Understanding%20Multi)[antstack.com](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/#:~:text=How%20does%20RLS%20help%3F).

## **6. Segurança e Compliance**

1. **Row‑Level Security (RLS):** habilitar RLS nas tabelas para isolar dados de cada usuário/administrador. O Supabase recomenda ativar RLS para garantir acesso seguro aos dados[supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security#:~:text=When%20you%20need%20granular%20authorization,RLS). Cada política deve verificar `auth.uid()` contra o `user_id` da tabela.
2. **RBAC (Role‑Based Access Control):** criar papéis (`member`, `admin`, `superadmin`) com permissões específicas. O uso de RBAC e permissões granulares é fundamental para restringir ações administrativas[dronahq.com](https://www.dronahq.com/admin-panel-features/#:~:text=1).
3. **Criptografia:** armazenar tokens de API (Google OAuth, SMTP, Hotmart) e segredos de forma criptografada (por exemplo, no Supabase Vault). Não armazenar senhas em texto plano.
4. **Auditoria:** registrar ações de administradores em `audit_logs` para possibilitar rastreamento de mudanças e garantir conformidade[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Audit).
5. **Validação de entradas:** sanitizar e validar inputs em client e server, evitando injeções e dados inválidos[aspirity.com](https://aspirity.com/blog/good-admin-panel-design#:~:text=Sometimes%2C%20editing%20forms%20consist%20of,the%20changes%20a%20little%20later).
6. **Conformidade legal:** garantir aderência a LGPD (tratamento de dados pessoais) e boas práticas de segurança. Utilizar TLS/HTTPS para todas as comunicações.

## **7. Considerações Finais**

O **Desafio FIRE 15 Dias** une educação financeira, gamificação e comunidade em uma plataforma moderna de assinatura. O uso de Supabase com RLS oferece segregação de dados e segurança, enquanto o painel admin providencia controle completo de conteúdo, usuários e métricas. A área de membros deve priorizar experiência do usuário, progressão clara e acesso a materiais de forma organizada. Implementando automações de e‑mails, notificações e uma comunidade ativa, a plataforma tem potencial de oferecer alto valor aos participantes e possibilitar melhorias contínuas no produto.