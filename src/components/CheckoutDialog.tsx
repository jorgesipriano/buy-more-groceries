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
  orderType?: "snacks" | "supermarket" | "promotions";
}

export interface CheckoutData {
  paymentMethod: string;
  scheduledDate: string;
  scheduledTime: string;
}

// Horários por tipo
const SNACK_TIMES = ["19:30", "21:00"];
const MARKET_TIMES = ["10:00", "15:00"];

export function CheckoutDialog({ open, onClose, total, onConfirm, orderType = "supermarket" }: CheckoutDialogProps) {
  const { toast } = useToast();
  const [availableDates, setAvailableDates] = useState<{ date: string; label: string; isToday: boolean }[]>([]);
  const [formData, setFormData] = useState<CheckoutData>({
    paymentMethod: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  const isSnackOrder = orderType === "snacks";
  const availableTimes = isSnackOrder ? SNACK_TIMES : MARKET_TIMES;

  useEffect(() => {
    generateAvailableDates();
  }, []);

  // Reset time when date changes (for today validation)
  useEffect(() => {
    setFormData(prev => ({ ...prev, scheduledTime: "" }));
  }, [formData.scheduledDate]);

  const generateAvailableDates = () => {
    const dates: { date: string; label: string; isToday: boolean }[] = [];
    const now = new Date();
    const today = new Date(now);
    
    // Check if today is a weekday
    const todayDayOfWeek = today.getDay();
    if (todayDayOfWeek !== 0 && todayDayOfWeek !== 6) {
      const todayStr = today.toISOString().split('T')[0];
      dates.push({ 
        date: todayStr, 
        label: "Hoje", 
        isToday: true 
      });
    }

    // Add next 7 days (excluding weekends)
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
        dates.push({ date: dateStr, label, isToday: false });
      }
    }

    setAvailableDates(dates);
  };

  const getAvailableTimesForDate = () => {
    const selectedDateInfo = availableDates.find(d => d.date === formData.scheduledDate);
    
    if (!selectedDateInfo?.isToday) {
      return availableTimes;
    }

    // Filter times that are still available today
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    return availableTimes.filter(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      // Add 30 min buffer for preparation
      return timeInMinutes > currentTimeInMinutes + 30;
    });
  };

  const filteredTimes = getAvailableTimesForDate();

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

    if (!formData.scheduledDate) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione a data de entrega",
        variant: "destructive",
      });
      return;
    }

    if (!formData.scheduledTime) {
      toast({
        title: "Horário obrigatório",
        description: "Por favor, selecione o horário de entrega",
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
            {isSnackOrder 
              ? "Horários de entrega para Lanches: 19:30 e 21:00"
              : "Horários de entrega para Mercado: 10:00 e 15:00"
            }
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
            <Label htmlFor="date">Data de Entrega *</Label>
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
            <Label htmlFor="time">Horário de Entrega *</Label>
            <Select
              value={formData.scheduledTime}
              onValueChange={(value) => setFormData({ ...formData, scheduledTime: value })}
              disabled={!formData.scheduledDate}
            >
              <SelectTrigger>
                <SelectValue placeholder={formData.scheduledDate ? "Selecione o horário" : "Selecione uma data primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {filteredTimes.length > 0 ? (
                  filteredTimes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-time" disabled>
                    Nenhum horário disponível para hoje
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {formData.scheduledDate && filteredTimes.length === 0 && (
              <p className="text-xs text-destructive">
                Todos os horários de hoje já passaram. Selecione outra data.
              </p>
            )}
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
            disabled={filteredTimes.length === 0 && !!formData.scheduledDate}
          >
            Confirmar Pedido
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}