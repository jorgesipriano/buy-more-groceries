import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Settings2 } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  unit: string;
  stock: number;
  onAddToCart: (quantity: number, ingredients?: string[], observation?: string) => void;
  isSnack?: boolean;
}

export function ProductCard({
  name,
  description,
  price,
  imageUrl,
  unit,
  stock,
  onAddToCart,
  isSnack = false
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [observation, setObservation] = useState("");

  const isHotDog = name.toLowerCase().includes("hot dog") || name.toLowerCase().includes("cachorro quente");

  const DEFAULT_INGREDIENTS = [
    "Pão",
    "Salsicha",
    "Molho",
    "Milho",
    "Ervilha",
    "Batata Palha",
    "Queijo Ralado",
    "Maionese",
    "Ketchup",
    "Mostarda"
  ];

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>(DEFAULT_INGREDIENTS);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  const handleAddToCartClick = () => {
    if (isSnack || isHotDog) {
      setShowCustomization(true);
    } else {
      handleAdd();
    }
  };

  const handleCustomizationConfirm = () => {
    setShowCustomization(false);
    handleAdd(isHotDog ? selectedIngredients : undefined, observation);
    setObservation(""); // Reset observation after adding
  };

  const handleAdd = (ingredients?: string[], obs?: string) => {
    setIsAdding(true);
    onAddToCart(quantity, ingredients, obs);
    setTimeout(() => {
      setIsAdding(false);
      setQuantity(1);
    }, 500);
  };

  const incrementQuantity = () => {
    if (quantity < stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-[var(--shadow-hover)]">
      <div className="aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-foreground">{name}</h3>
          {stock < 10 && stock > 0 && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Últimas unidades
            </Badge>
          )}
        </div>
        {description && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-primary">
            R$ {price.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-muted-foreground">/ {unit}</span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 p-4 pt-0">
        <div className="flex items-center gap-2 rounded-lg border bg-background p-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[2rem] text-center font-semibold">{quantity}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={incrementQuantity}
            disabled={quantity >= stock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={handleAddToCartClick}
          disabled={stock === 0 || isAdding}
          className="flex-1 bg-gradient-to-r from-primary to-primary/90 font-semibold transition-all hover:shadow-lg"
        >
          {isAdding ? "Adicionado!" : stock === 0 ? "Sem estoque" : "Adicionar"}
        </Button>
      </CardFooter>

      <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personalizar {name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isHotDog && (
              <div className="grid grid-cols-2 gap-4">
                {DEFAULT_INGREDIENTS.map((ingredient) => (
                  <div key={ingredient} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ingredient-${ingredient}`}
                      checked={selectedIngredients.includes(ingredient)}
                      onCheckedChange={() => toggleIngredient(ingredient)}
                    />
                    <Label htmlFor={`ingredient-${ingredient}`}>{ingredient}</Label>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observation">Observações</Label>
              <Textarea
                id="observation"
                placeholder="Ex: Sem cebola, bem passado..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomization(false)}>Cancelar</Button>
            <Button onClick={handleCustomizationConfirm}>Confirmar e Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}