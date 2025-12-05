-- Script para converter colunas de timestamp com fuso (timestamptz) para sem fuso (timestamp)
-- Isso fará com que o banco respeite o timezone configurado (America/Sao_Paulo)

-- 1. app_config
ALTER TABLE app_config 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 2. challenge_reflections
ALTER TABLE challenge_reflections 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 3. challenge_resources
ALTER TABLE challenge_resources 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 4. challenge_tasks
ALTER TABLE challenge_tasks 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 5. challenges
ALTER TABLE challenges 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 6. eventos_tracking
ALTER TABLE eventos_tracking 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 7. leads
ALTER TABLE leads 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 8. orders
ALTER TABLE orders 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 9. pedidos
ALTER TABLE pedidos 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 10. profiles
ALTER TABLE profiles 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- 11. user_notes
ALTER TABLE user_notes 
  ALTER COLUMN updated_at TYPE timestamp without time zone USING updated_at::timestamp without time zone;

-- 12. user_progress
ALTER TABLE user_progress 
  ALTER COLUMN completed_at TYPE timestamp without time zone USING completed_at::timestamp without time zone;

-- 13. user_reflection_answers
ALTER TABLE user_reflection_answers 
  ALTER COLUMN updated_at TYPE timestamp without time zone USING updated_at::timestamp without time zone;

-- 14. webhook_events
ALTER TABLE webhook_events 
  ALTER COLUMN created_at TYPE timestamp without time zone USING created_at::timestamp without time zone;

-- Atualizar os defaults para usar 'now()' simples (que respeita o timezone do banco)
ALTER TABLE app_config ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE challenge_reflections ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE challenge_resources ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE challenge_tasks ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE challenges ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE eventos_tracking ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE leads ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE pedidos ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE profiles ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE user_notes ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE user_progress ALTER COLUMN completed_at SET DEFAULT now();
ALTER TABLE user_reflection_answers ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE webhook_events ALTER COLUMN created_at SET DEFAULT now();
