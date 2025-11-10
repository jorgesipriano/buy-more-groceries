import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  total: number;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  pending: { label: "Pendente", variant: "outline", icon: Clock },
  accepted: { label: "Aceito", variant: "secondary", icon: CheckCircle },
  in_production: { label: "Em Produção", variant: "default", icon: Package },
  ready: { label: "Pronto", variant: "default", icon: CheckCircle },
  delivered: { label: "Entregue", variant: "secondary", icon: CheckCircle },
  cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle },
};

const MyOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-4">
          <div className="flex items-center gap-4">
            <NavLink to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </NavLink>
            <h1 className="text-2xl font-bold">Meus Pedidos</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
            <Package className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-semibold">Nenhum pedido encontrado</p>
            <p className="text-sm text-muted-foreground">
              Você ainda não realizou nenhum pedido
            </p>
            <NavLink to="/">
              <Button>Fazer um Pedido</Button>
            </NavLink>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;

              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Realizado em {formatDate(order.created_at)}
                        </p>
                      </div>
                      <Badge variant={config.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrega agendada:</span>
                        <span className="font-medium">
                          {formatDate(order.scheduled_date)} às {order.scheduled_time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Endereço:</span>
                        <span className="font-medium">Casa {order.customer_address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone:</span>
                        <span className="font-medium">{order.customer_phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Forma de pagamento:</span>
                        <span className="font-medium capitalize">{order.payment_method}</span>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
