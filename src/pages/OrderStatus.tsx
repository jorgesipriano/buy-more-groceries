import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, Truck, PackageCheck, Loader2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  payment_method: string;
  total: number;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

const statusConfig = {
  pending: { label: "Pendente", icon: Clock, color: "bg-yellow-500", description: "Aguardando confirmação" },
  accepted: { label: "Aceito", icon: CheckCircle2, color: "bg-blue-500", description: "Pedido confirmado" },
  in_production: { label: "Em Produção", icon: Package, color: "bg-purple-500", description: "Preparando seu pedido" },
  ready: { label: "Pronto", icon: PackageCheck, color: "bg-green-500", description: "Pronto para entrega" },
  delivered: { label: "Entregue", icon: Truck, color: "bg-emerald-500", description: "Pedido entregue" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-500", description: "Pedido cancelado" },
};

const OrderStatus = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPhone, setUserPhone] = useState<string | null>(null);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    setLoading(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast({
        title: "Faça login",
        description: "Entre na sua conta para ver seus pedidos",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Get user's phone from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", session.user.id)
      .single();

    if (profile?.phone) {
      setUserPhone(profile.phone);
      
      // Fetch orders by phone
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_phone", profile.phone)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching orders:", error);
        toast({
          title: "Erro ao buscar pedidos",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
      } else {
        setOrders(ordersData || []);
      }
    }
    
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 relative z-10">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
            {userPhone && (
              <p className="text-muted-foreground">
                Telefone: {userPhone}
              </p>
            )}
          </div>

          {orders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-4">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <h3 className="text-xl font-semibold text-muted-foreground">
                    Nenhum pedido encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Faça seu primeiro pedido e acompanhe aqui!
                  </p>
                </div>
                <Button onClick={() => navigate("/")} className="mt-4">
                  Fazer Pedido
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Pedido #{order.id.slice(0, 8).toUpperCase()}
                          </CardTitle>
                          <CardDescription>
                            {formatDateTime(order.created_at)}
                          </CardDescription>
                        </div>
                        <Badge className={`${status.color} text-white gap-1 px-3 py-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status description */}
                      <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                        <StatusIcon className={`h-8 w-8 ${status.color.replace('bg-', 'text-')}`} />
                        <div>
                          <p className="font-medium">{status.label}</p>
                          <p className="text-sm text-muted-foreground">{status.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-primary text-lg">
                            R$ {order.total.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pagamento</p>
                          <p className="font-medium">{order.payment_method}</p>
                        </div>
                        {order.scheduled_date && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Entrega Programada</p>
                            <p className="font-medium">
                              {formatDate(order.scheduled_date)} às {order.scheduled_time || "-"}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderStatus;
