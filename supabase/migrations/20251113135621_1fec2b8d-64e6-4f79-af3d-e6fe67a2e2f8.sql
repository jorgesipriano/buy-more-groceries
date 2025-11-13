-- Habilitar RLS na tabela webhook_delivery_log
ALTER TABLE public.webhook_delivery_log ENABLE ROW LEVEL SECURITY;

-- Permitir apenas que o sistema insira logs (não os usuários)
CREATE POLICY "Sistema pode inserir logs de webhook"
  ON public.webhook_delivery_log
  FOR INSERT
  WITH CHECK (false);

-- Corrigir search_path nas funções de webhook
CREATE OR REPLACE FUNCTION public.notify_order_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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

  INSERT INTO public.webhook_delivery_log(event, order_id, endpoint, request_id)
  VALUES ('UPDATE', NEW.id, 'http://64.181.161.17:3002/webhook-atualizar-pedido', request_id);

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_order_when_items_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  already_sent boolean;
  items jsonb;
  ord public.orders%ROWTYPE;
  request_id bigint;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.webhook_delivery_log
    WHERE event = 'INSERT' AND order_id = NEW.order_id
  ) INTO already_sent;

  IF already_sent THEN
    RETURN NEW;
  END IF;

  SELECT * INTO ord FROM public.orders WHERE id = NEW.order_id;
  IF ord.id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'quantity', oi.quantity,
          'name', p.name,
          'price', oi.price
        )
      )
      FROM public.order_items oi
      LEFT JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.order_id
    ), '[]'::jsonb
  ) INTO items;

  PERFORM net.http_post(
    url := 'http://64.181.161.17:3002/webhook-novo-pedido',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer Jj@@9590"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'orders',
      'record', jsonb_build_object(
        'id', ord.id,
        'customer_name', ord.customer_name,
        'customer_phone', ord.customer_phone,
        'total_price', ord.total,
        'items', items
      )
    ),
    request_id := request_id
  );

  INSERT INTO public.webhook_delivery_log(event, order_id, endpoint, request_id)
  VALUES ('INSERT', NEW.order_id, 'http://64.181.161.17:3002/webhook-novo-pedido', request_id);

  RETURN NEW;
END;
$function$;