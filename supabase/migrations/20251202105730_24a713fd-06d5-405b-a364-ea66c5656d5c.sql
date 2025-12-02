-- Adicionar campos para promoções de produtos específicos
ALTER TABLE public.promotions 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
ADD COLUMN special_price numeric,
ADD COLUMN quantity integer DEFAULT 1;

-- Adicionar índice para melhor performance
CREATE INDEX idx_promotions_product_id ON public.promotions(product_id);