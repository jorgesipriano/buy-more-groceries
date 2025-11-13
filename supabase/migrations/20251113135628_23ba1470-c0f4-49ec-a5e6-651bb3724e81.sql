-- Corrigir search_path na função notify_new_order
CREATE OR REPLACE FUNCTION public.notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;