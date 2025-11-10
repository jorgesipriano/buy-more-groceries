-- Adicionar campos de agendamento e atualizar status
ALTER TABLE orders 
  ALTER COLUMN customer_email DROP NOT NULL,
  ADD COLUMN scheduled_date timestamp with time zone,
  ADD COLUMN scheduled_time text,
  DROP CONSTRAINT IF EXISTS orders_status_check;

-- Atualizar constraint de status para incluir mais opções
ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'accepted', 'in_production', 'ready', 'delivered', 'cancelled'));

-- Atualizar valores padrão
ALTER TABLE orders 
  ALTER COLUMN status SET DEFAULT 'pending';