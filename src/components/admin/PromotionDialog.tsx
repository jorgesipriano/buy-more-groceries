import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Promotion = Tables<"promotions">;

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion: Promotion | null;
  onSuccess: () => void;
}

export function PromotionDialog({ open, onOpenChange, promotion, onSuccess }: PromotionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    discount_percentage: 0,
    image_url: "",
    is_active: true,
    product_id: "",
    special_price: 0,
    quantity: 1,
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price")
      .order("name");
    if (data) setProducts(data);
  };

  useEffect(() => {
    if (promotion) {
      setFormData({
        title: promotion.title,
        description: promotion.description || "",
        discount_percentage: promotion.discount_percentage || 0,
        image_url: promotion.image_url || "",
        is_active: promotion.is_active ?? true,
        product_id: promotion.product_id || "",
        special_price: promotion.special_price || 0,
        quantity: promotion.quantity || 1,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        discount_percentage: 0,
        image_url: "",
        is_active: true,
        product_id: "",
        special_price: 0,
        quantity: 1,
      });
    }
  }, [promotion, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        product_id: formData.product_id || null,
        special_price: formData.special_price || null,
        discount_percentage: formData.discount_percentage || null,
      };

      if (promotion) {
        const { error } = await supabase
          .from("promotions")
          .update(dataToSave)
          .eq("id", promotion.id);

        if (error) throw error;

        toast({
          title: "Promoção atualizada!",
          description: "A promoção foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("promotions")
          .insert(dataToSave);

        if (error) throw error;

        toast({
          title: "Promoção criada!",
          description: "A promoção foi criada com sucesso.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving promotion:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a promoção.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {promotion ? "Editar Promoção" : "Nova Promoção"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ex: Abacaxi em Promoção"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Descrição da promoção..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product">Produto (opcional)</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Promoção geral (sem produto)</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - R$ {product.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.product_id && (
            <>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  placeholder="Ex: 2 (para 2 unidades)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_price">Preço Promocional (R$)</Label>
                <Input
                  id="special_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.special_price}
                  onChange={(e) => setFormData({ ...formData, special_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Ex: 50.00"
                />
              </div>
            </>
          )}

          {!formData.product_id && (
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="image">URL da Imagem (opcional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="active">Promoção Ativa</Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {promotion ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
