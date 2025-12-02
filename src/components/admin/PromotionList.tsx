import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Promotion = Tables<"promotions">;

interface PromotionListProps {
  onEdit: (promotion: Promotion) => void;
  refreshKey: number;
}

export function PromotionList({ onEdit, refreshKey }: PromotionListProps) {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotions();
  }, [refreshKey]);

  const fetchPromotions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promotions")
      .select(`
        *,
        products (
          name,
          price
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching promotions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as promoções.",
        variant: "destructive",
      });
    } else {
      setPromotions(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta promoção?")) return;

    const { error } = await supabase
      .from("promotions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a promoção.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Promoção excluída!",
        description: "A promoção foi removida com sucesso.",
      });
      fetchPromotions();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (promotions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma promoção cadastrada
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {promotions.map((promotion) => (
        <Card key={promotion.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{promotion.title}</CardTitle>
              <Badge variant={promotion.is_active ? "default" : "secondary"}>
                {promotion.is_active ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {promotion.description || "Sem descrição"}
            </p>
            {promotion.product_id && (promotion as any).products && (
              <div className="bg-accent/20 p-3 rounded-md mb-3">
                <p className="text-sm font-semibold">{(promotion as any).products.name}</p>
                <p className="text-xs text-muted-foreground">
                  {promotion.quantity}x por R$ {promotion.special_price?.toFixed(2)}
                </p>
              </div>
            )}
            {!promotion.product_id && promotion.discount_percentage && (
              <p className="text-xl font-bold text-primary mb-3">
                {promotion.discount_percentage}% OFF
              </p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(promotion)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(promotion.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
