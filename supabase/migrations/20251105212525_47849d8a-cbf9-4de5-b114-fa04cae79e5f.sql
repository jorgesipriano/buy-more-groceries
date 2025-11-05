-- Criar tabela de categorias de produtos
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de produtos
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  category_id uuid REFERENCES public.categories(id),
  stock integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de pedidos
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  payment_method text NOT NULL,
  total decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de itens do pedido
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity integer NOT NULL,
  price decimal(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Leitura pública para categorias e produtos
CREATE POLICY "Categorias são visíveis para todos"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Produtos são visíveis para todos"
  ON public.products FOR SELECT
  USING (true);

-- Políticas RLS - Qualquer pessoa pode criar pedidos
CREATE POLICY "Qualquer pessoa pode criar pedidos"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Qualquer pessoa pode ver pedidos"
  ON public.orders FOR SELECT
  USING (true);

-- Políticas RLS - Itens do pedido
CREATE POLICY "Qualquer pessoa pode criar itens de pedido"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Qualquer pessoa pode ver itens de pedido"
  ON public.order_items FOR SELECT
  USING (true);

-- Inserir categorias padrão
INSERT INTO public.categories (name, slug) VALUES
  ('Grãos e Cereais', 'graos-cereais'),
  ('Massas', 'massas'),
  ('Enlatados', 'enlatados'),
  ('Bebidas', 'bebidas'),
  ('Limpeza', 'limpeza'),
  ('Higiene', 'higiene');

-- Inserir produtos de exemplo
INSERT INTO public.products (name, description, price, category_id, stock, unit) VALUES
  -- Grãos e Cereais
  ('Arroz Branco Tipo 1', 'Arroz branco de qualidade premium', 4.99, (SELECT id FROM categories WHERE slug = 'graos-cereais'), 100, 'kg'),
  ('Feijão Preto', 'Feijão preto selecionado', 5.49, (SELECT id FROM categories WHERE slug = 'graos-cereais'), 80, 'kg'),
  ('Feijão Carioca', 'Feijão carioca tipo 1', 4.99, (SELECT id FROM categories WHERE slug = 'graos-cereais'), 90, 'kg'),
  ('Lentilha', 'Lentilha selecionada', 7.99, (SELECT id FROM categories WHERE slug = 'graos-cereais'), 50, 'kg'),
  ('Grão de Bico', 'Grão de bico premium', 8.99, (SELECT id FROM categories WHERE slug = 'graos-cereais'), 45, 'kg'),
  ('Aveia em Flocos', 'Aveia em flocos finos', 6.49, (SELECT id FROM categories WHERE slug = 'graos-cereais'), 60, 'kg'),
  
  -- Massas
  ('Macarrão Espaguete', 'Macarrão espaguete nº8', 3.99, (SELECT id FROM categories WHERE slug = 'massas'), 120, 'pct'),
  ('Macarrão Parafuso', 'Macarrão parafuso', 3.99, (SELECT id FROM categories WHERE slug = 'massas'), 110, 'pct'),
  ('Macarrão Penne', 'Macarrão penne', 4.49, (SELECT id FROM categories WHERE slug = 'massas'), 100, 'pct'),
  ('Macarrão Integral', 'Macarrão integral espaguete', 5.99, (SELECT id FROM categories WHERE slug = 'massas'), 70, 'pct'),
  ('Lasanha', 'Massa para lasanha', 6.49, (SELECT id FROM categories WHERE slug = 'massas'), 50, 'pct'),
  ('Nhoque', 'Nhoque de batata', 7.99, (SELECT id FROM categories WHERE slug = 'massas'), 40, 'pct'),
  
  -- Enlatados
  ('Molho de Tomate', 'Molho de tomate tradicional', 2.99, (SELECT id FROM categories WHERE slug = 'enlatados'), 150, 'un'),
  ('Extrato de Tomate', 'Extrato de tomate concentrado', 3.49, (SELECT id FROM categories WHERE slug = 'enlatados'), 120, 'un'),
  ('Milho Verde', 'Milho verde em conserva', 3.99, (SELECT id FROM categories WHERE slug = 'enlatados'), 100, 'un'),
  ('Ervilha', 'Ervilha em conserva', 3.99, (SELECT id FROM categories WHERE slug = 'enlatados'), 90, 'un'),
  ('Atum', 'Atum em lata', 6.99, (SELECT id FROM categories WHERE slug = 'enlatados'), 80, 'un'),
  ('Sardinha', 'Sardinha em óleo', 5.49, (SELECT id FROM categories WHERE slug = 'enlatados'), 75, 'un'),
  ('Azeitona Verde', 'Azeitona verde em conserva', 4.99, (SELECT id FROM categories WHERE slug = 'enlatados'), 60, 'un'),
  
  -- Bebidas
  ('Refrigerante Cola', 'Refrigerante sabor cola 2L', 5.99, (SELECT id FROM categories WHERE slug = 'bebidas'), 200, 'un'),
  ('Refrigerante Guaraná', 'Refrigerante guaraná 2L', 5.99, (SELECT id FROM categories WHERE slug = 'bebidas'), 180, 'un'),
  ('Suco de Laranja', 'Suco de laranja integral 1L', 7.99, (SELECT id FROM categories WHERE slug = 'bebidas'), 100, 'un'),
  ('Suco de Uva', 'Suco de uva integral 1L', 8.99, (SELECT id FROM categories WHERE slug = 'bebidas'), 90, 'un'),
  ('Água Mineral', 'Água mineral sem gás 1,5L', 2.49, (SELECT id FROM categories WHERE slug = 'bebidas'), 300, 'un'),
  ('Água com Gás', 'Água mineral com gás 1,5L', 2.99, (SELECT id FROM categories WHERE slug = 'bebidas'), 150, 'un'),
  ('Café Torrado', 'Café torrado e moído 500g', 12.99, (SELECT id FROM categories WHERE slug = 'bebidas'), 80, 'pct'),
  ('Chá Preto', 'Chá preto em sachês', 6.49, (SELECT id FROM categories WHERE slug = 'bebidas'), 70, 'cx'),
  
  -- Limpeza
  ('Detergente Líquido', 'Detergente líquido neutro 500ml', 2.49, (SELECT id FROM categories WHERE slug = 'limpeza'), 200, 'un'),
  ('Sabão em Pó', 'Sabão em pó 1kg', 8.99, (SELECT id FROM categories WHERE slug = 'limpeza'), 150, 'pct'),
  ('Água Sanitária', 'Água sanitária 1L', 3.99, (SELECT id FROM categories WHERE slug = 'limpeza'), 180, 'un'),
  ('Desinfetante', 'Desinfetante perfumado 2L', 6.99, (SELECT id FROM categories WHERE slug = 'limpeza'), 120, 'un'),
  ('Esponja de Limpeza', 'Esponja dupla face', 1.99, (SELECT id FROM categories WHERE slug = 'limpeza'), 300, 'un'),
  ('Pano de Limpeza', 'Pano de limpeza multiuso', 3.99, (SELECT id FROM categories WHERE slug = 'limpeza'), 150, 'un'),
  ('Limpador Multiuso', 'Limpador multiuso 500ml', 4.99, (SELECT id FROM categories WHERE slug = 'limpeza'), 100, 'un'),
  
  -- Higiene
  ('Sabonete', 'Sabonete em barra 90g', 2.49, (SELECT id FROM categories WHERE slug = 'higiene'), 250, 'un'),
  ('Shampoo', 'Shampoo 400ml', 9.99, (SELECT id FROM categories WHERE slug = 'higiene'), 100, 'un'),
  ('Condicionador', 'Condicionador 400ml', 9.99, (SELECT id FROM categories WHERE slug = 'higiene'), 95, 'un'),
  ('Pasta de Dente', 'Pasta de dente 90g', 4.99, (SELECT id FROM categories WHERE slug = 'higiene'), 200, 'un'),
  ('Papel Higiênico', 'Papel higiênico folha dupla 12un', 14.99, (SELECT id FROM categories WHERE slug = 'higiene'), 150, 'pct'),
  ('Absorvente', 'Absorvente suave com abas 8un', 5.99, (SELECT id FROM categories WHERE slug = 'higiene'), 120, 'pct'),
  ('Desodorante', 'Desodorante spray 150ml', 8.99, (SELECT id FROM categories WHERE slug = 'higiene'), 140, 'un'),
  ('Sabonete Líquido', 'Sabonete líquido 250ml', 6.99, (SELECT id FROM categories WHERE slug = 'higiene'), 110, 'un'),
  ('Lenço Umedecido', 'Lenço umedecido 50un', 7.99, (SELECT id FROM categories WHERE slug = 'higiene'), 100, 'pct'),
  ('Creme Dental Infantil', 'Creme dental infantil 50g', 5.49, (SELECT id FROM categories WHERE slug = 'higiene'), 80, 'un'),
  ('Fio Dental', 'Fio dental 50m', 4.99, (SELECT id FROM categories WHERE slug = 'higiene'), 150, 'un'),
  ('Sabonete Líquido para Mãos', 'Sabonete líquido antibacteriano 250ml', 7.49, (SELECT id FROM categories WHERE slug = 'higiene'), 90, 'un'),
  ('Álcool em Gel', 'Álcool em gel 70% 500ml', 9.99, (SELECT id FROM categories WHERE slug = 'higiene'), 200, 'un');