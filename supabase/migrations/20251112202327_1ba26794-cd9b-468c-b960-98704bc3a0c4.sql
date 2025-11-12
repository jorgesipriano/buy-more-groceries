-- Ensure pg_net extension exists
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Create a minimal log table for webhook attempts (idempotent)
CREATE TABLE IF NOT EXISTS public.webhook_delivery_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  order_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Drop old INSERT trigger on orders (we'll send after items are ready)
DROP TRIGGER IF EXISTS on_order_insert ON public.orders;

-- Keep the existing update function as-is, but (re)create to be safe with pg_net
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

  -- Optional: record attempt
  INSERT INTO public.webhook_delivery_log(event, order_id, endpoint, request_id)
  VALUES ('UPDATE', NEW.id, 'http://64.181.161.17:3002/webhook-atualizar-pedido', request_id);

  RETURN NEW;
END;
$$;

-- Recreate/update trigger for order updates
DROP TRIGGER IF EXISTS on_order_update ON public.orders;
CREATE TRIGGER on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_update();

-- New function: send "novo pedido" once items exist
CREATE OR REPLACE FUNCTION public.notify_new_order_when_items_ready()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  already_sent boolean;
  items jsonb;
  ord public.orders%ROWTYPE;
  request_id bigint;
BEGIN
  -- If we've already sent INSERT event for this order, skip
  SELECT EXISTS (
    SELECT 1 FROM public.webhook_delivery_log
    WHERE event = 'INSERT' AND order_id = NEW.order_id
  ) INTO already_sent;

  IF already_sent THEN
    RETURN NEW;
  END IF;

  -- Load order row
  SELECT * INTO ord FROM public.orders WHERE id = NEW.order_id;
  IF ord.id IS NULL THEN
    RETURN NEW; -- safety
  END IF;

  -- Aggregate items for the order (name + quantity + price)
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

  -- Build body to match your working cURL (note total_price key and items array)
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
    -- capture request id
    request_id := request_id
  );

  -- Record attempt to avoid duplicates
  INSERT INTO public.webhook_delivery_log(event, order_id, endpoint, request_id)
  VALUES ('INSERT', NEW.order_id, 'http://64.181.161.17:3002/webhook-novo-pedido', request_id);

  RETURN NEW;
END;
$$;

-- Create trigger on order_items insert (fires when items are being added)
DROP TRIGGER IF EXISTS on_order_items_insert_new_order ON public.order_items;
CREATE TRIGGER on_order_items_insert_new_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order_when_items_ready();
