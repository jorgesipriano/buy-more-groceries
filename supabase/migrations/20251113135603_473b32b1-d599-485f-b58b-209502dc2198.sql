-- Criar trigger para novos pedidos quando os itens são inseridos
DROP TRIGGER IF EXISTS on_order_items_insert_new_order ON public.order_items;

CREATE TRIGGER on_order_items_insert_new_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_order_when_items_ready();

-- Criar trigger para atualizações de pedidos
DROP TRIGGER IF EXISTS on_order_update ON public.orders;

CREATE TRIGGER on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_update();