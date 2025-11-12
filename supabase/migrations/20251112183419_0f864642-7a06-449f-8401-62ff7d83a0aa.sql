-- Habilitar extensão pg_net para webhooks
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar função para notificar webhook quando pedido for atualizado
CREATE OR REPLACE FUNCTION notify_order_update()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT extensions.http_post(
    url := 'http://64.181.161.17:3002/webhook-atualizar-pedido',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer SEU_TOKEN_AQUI"}'::jsonb,
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'orders',
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que dispara a função em UPDATE
CREATE TRIGGER order_update_webhook
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_update();