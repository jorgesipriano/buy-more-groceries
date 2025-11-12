-- Atualizar função para usar o token de autorização correto
CREATE OR REPLACE FUNCTION notify_order_update()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT extensions.http_post(
    url := 'http://64.181.161.17:3002/webhook-atualizar-pedido',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer Jj@@9590"}'::jsonb,
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