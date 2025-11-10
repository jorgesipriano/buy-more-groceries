-- Create promotions/combos table
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Promotions are visible to everyone
CREATE POLICY "Promoções são visíveis para todos"
ON public.promotions
FOR SELECT
USING (is_active = true);

-- Admins can manage promotions
CREATE POLICY "Admins can insert promotions"
ON public.promotions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promotions"
ON public.promotions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promotions"
ON public.promotions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add more default categories
INSERT INTO public.categories (name, slug) VALUES
  ('Bebidas', 'bebidas'),
  ('Sacolão', 'sacolao'),
  ('Açougue', 'acougue')
ON CONFLICT DO NOTHING;