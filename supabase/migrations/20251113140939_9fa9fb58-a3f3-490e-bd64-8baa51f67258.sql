-- Garantir que os webhooks disparem e o payload inclua payment_method
-- 1) Atualiza a função de novo pedido para enviar payment_method
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
        'payment_method', ord.payment_method,
        'total_price', ord.total,
        'items', items
      )
    )
  );

  INSERT INTO public.webhook_delivery_log(event, order_id, endpoint, request_id)
  VALUES ('INSERT', NEW.order_id, 'http://64.181.161.17:3002/webhook-novo-pedido', NULL);

  RETURN NEW;
END;
$function$;

-- 2) Recria os gatilhos necessários (idempotente)
DROP TRIGGER IF EXISTS on_order_items_insert_new_order ON public.order_items;
CREATE TRIGGER on_order_items_insert_new_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_order_when_items_ready();

DROP TRIGGER IF EXISTS on_orders_update ON public.orders;
CREATE TRIGGER on_orders_update
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_update();