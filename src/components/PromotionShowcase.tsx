import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percentage: number | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
}

export function PromotionShowcase() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .eq("is_active", true)
      .is("product_id", null)
      .order("created_at", { ascending: false });

    if (data) {
      setPromotions(data);
    }
  };

  if (promotions.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <Sparkles className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
        <div>
          <h3 className="text-xl font-semibold text-muted-foreground">
            Nenhuma promoção ativa no momento
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Fique de olho! Novas promoções chegam em breve
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-7 w-7 text-primary" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Promoções Ativas
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {promotions.map((promo) => (
          <Card 
            key={promo.id} 
            className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50"
          >
            {promo.image_url && (
              <div className="relative h-56 overflow-hidden">
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                {promo.discount_percentage && (
                  <Badge 
                    className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold text-lg px-4 py-2 shadow-lg"
                  >
                    <TrendingDown className="h-4 w-4 mr-1 inline" />
                    {promo.discount_percentage}% OFF
                  </Badge>
                )}
              </div>
            )}
            
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {promo.title}
                </h3>
                {promo.description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {promo.description}
                  </p>
                )}
              </div>

              {(promo.start_date || promo.end_date) && (
                <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <div className="space-y-1">
                    {promo.start_date && (
                      <p>
                        <span className="font-medium">Início:</span>{" "}
                        {format(new Date(promo.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                    {promo.end_date && (
                      <p>
                        <span className="font-medium">Válido até:</span>{" "}
                        {format(new Date(promo.end_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
