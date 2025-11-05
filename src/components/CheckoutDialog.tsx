import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Smartphone, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (data: CheckoutData) => void;
}

export interface CheckoutData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
}

export function CheckoutDialog({ open, onClose, total, onConfirm }: CheckoutDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CheckoutData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "pix",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone || !formData.customerAddress) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    onConfirm(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Finalizar Pedido</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="Digite seu nome"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="(00) 00000-0000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço de Entrega *</Label>
            <Input
              id="address"
              value={formData.customerAddress}
              onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              placeholder="Rua, número, complemento"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Forma de Pagamento *</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50">
                <RadioGroupItem value="pix" id="pix" />
                <Label htmlFor="pix" className="flex flex-1 cursor-pointer items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  PIX
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50">
                <RadioGroupItem value="cartao" id="cartao" />
                <Label htmlFor="cartao" className="flex flex-1 cursor-pointer items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Cartão de Crédito/Débito
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50">
                <RadioGroupItem value="dinheiro" id="dinheiro" />
                <Label htmlFor="dinheiro" className="flex flex-1 cursor-pointer items-center gap-2">
                  <Banknote className="h-4 w-4 text-primary" />
                  Dinheiro
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total:</span>
              <span className="text-2xl text-primary">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-gradient-to-r from-secondary to-secondary/90 text-lg font-semibold hover:shadow-lg"
          >
            Confirmar Pedido
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}