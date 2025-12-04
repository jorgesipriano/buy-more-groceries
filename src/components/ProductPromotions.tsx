import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductPromotion {
  id: string;
  title: string;
  description: string | null;
  product_id: string;
  special_price: number;
  quantity: number;
  image_url: string | null;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    unit: string;
  };
}

interface ComboAddPayload {
  promotionId: string;
  productId: string;
  productName: string;
  unit: string;
  specialPrice: number;
  quantity: number;
}

interface ProductPromotionsProps {
  onAddComboToCart: (combo: ComboAddPayload) => void;
}

export type { ComboAddPayload };

export function ProductPromotions({ onAddComboToCart }: ProductPromotionsProps) {
  const [promotions, setPromotions] = useState<ProductPromotion[]>([]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase
      .from("promotions")
      .select(`
        *,
        products (
          id,
          name,
          price,
          image_url,
          unit
        )
      `)
      .eq("is_active", true)
      .not("product_id", "is", null);

    if (data) {
      setPromotions(data as any);
    }
  };

  const calculateDiscount = (original: number, special: number, quantity: number) => {
    const originalTotal = original * quantity;
    const discount = ((originalTotal - special) / originalTotal) * 100;
    return Math.round(discount);
  };

  if (promotions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Promoções Especiais</h2>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {promotions.map((promo) => {
          const discount = calculateDiscount(
            promo.products.price,
            promo.special_price,
            promo.quantity
          );
          
          return (
            <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {promo.products.image_url && (
                  <img
                    src={promo.products.image_url}
                    alt={promo.products.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <Badge 
                  className="absolute top-2 right-2 bg-primary text-primary-foreground font-bold"
                >
                  {discount}% OFF
                </Badge>
              </div>
              
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{promo.title}</h3>
                  {promo.description && (
                    <p className="text-sm text-muted-foreground">{promo.description}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium">{promo.products.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted-foreground line-through">
                      {promo.quantity}x por R$ {(promo.products.price * promo.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      R$ {promo.special_price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({promo.quantity} {promo.products.unit})
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    onAddComboToCart({
                      promotionId: promo.id,
                      productId: promo.products.id,
                      productName: promo.title || promo.products.name,
                      unit: promo.products.unit,
                      specialPrice: promo.special_price,
                      quantity: promo.quantity,
                    })
                  }
                  className="w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Adicionar ao Carrinho
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
