-- Enable the pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_order_update ON public.orders;
DROP TRIGGER IF EXISTS on_order_insert ON public.orders;
DROP TRIGGER IF EXISTS order_update_webhook ON public.orders;
DROP TRIGGER IF EXISTS order_insert_webhook ON public.orders;

-- Drop existing functions with CASCADE
DROP FUNCTION IF EXISTS public.notify_order_update() CASCADE;
DROP FUNCTION IF EXISTS public.notify_new_order() CASCADE;

-- Function to notify new orders using pg_net
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'http://64.181.161.17:3002/webhook-novo-pedido',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer Jj@@9590"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'orders',
      'record', row_to_json(NEW)
    )
  ) INTO request_id;
  
  RETURN NEW;
END;
$$;

-- Function to notify order updates using pg_net
CREATE OR REPLACE FUNCTION public.notify_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
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
$$;

-- Create trigger for new orders
CREATE TRIGGER on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order();

-- Create trigger for order updates
CREATE TRIGGER on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_update();