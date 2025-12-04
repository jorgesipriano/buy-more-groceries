import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CheckoutDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (data: CheckoutData) => void;
}

export interface CheckoutData {
  paymentMethod: string;
  scheduledDate: string;
  scheduledTime: string;
}

export function CheckoutDialog({ open, onClose, total, onConfirm }: CheckoutDialogProps) {
  const { toast } = useToast();
  const [availableDates, setAvailableDates] = useState<{ date: string; label: string }[]>([]);
  const [formData, setFormData] = useState<CheckoutData>({
    paymentMethod: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  useEffect(() => {
    generateAvailableDates();
  }, []);

  const generateAvailableDates = () => {
    const dates: { date: string; label: string }[] = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit'
        });
        dates.push({ date: dateStr, label });
      }
    }

    setAvailableDates(dates);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paymentMethod) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Por favor, selecione a forma de pagamento",
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
          <DialogDescription>
            Escolha a forma de pagamento e o agendamento da entrega.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment">Forma de Pagamento *</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data de Entrega</Label>
            <Select
              value={formData.scheduledDate}
              onValueChange={(value) => setFormData({ ...formData, scheduledDate: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a data" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date) => (
                  <SelectItem key={date.date} value={date.date}>
                    {date.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Horário de Entrega</Label>
            <Select
              value={formData.scheduledTime}
              onValueChange={(value) => setFormData({ ...formData, scheduledTime: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10:00">10:00</SelectItem>
                <SelectItem value="15:00">15:00</SelectItem>
              </SelectContent>
            </Select>
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