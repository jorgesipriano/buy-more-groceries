import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, Truck, PackageCheck } from "lucide-react";
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
  pending: { label: "Pendente", icon: Clock, color: "bg-yellow-500" },
  accepted: { label: "Aceito", icon: CheckCircle2, color: "bg-blue-500" },
  in_production: { label: "Em Produção", icon: Package, color: "bg-purple-500" },
  ready: { label: "Pronto", icon: PackageCheck, color: "bg-green-500" },
  delivered: { label: "Entregue", icon: Truck, color: "bg-emerald-500" },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-red-500" },
};

const OrderStatus = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setUserEmail(session.user.email);
      fetchUserOrders(session.user.email);
    }
  };

  const fetchUserOrders = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
      setSearched(true);
    }
    setLoading(false);
  };

  const searchOrders = async () => {
    if (!phone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Digite seu telefone para consultar pedidos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro ao buscar pedidos",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } else {
      setOrders(data || []);
      setSearched(true);
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum pedido encontrado",
          description: "Não encontramos pedidos com este telefone",
        });
      }
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

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
            <h1 className="text-3xl font-bold mb-2">
              {userEmail ? "Meus Pedidos" : "Status do Pedido"}
            </h1>
            <p className="text-muted-foreground">
              {userEmail ? `Pedidos associados a ${userEmail}` : "Consulte o status dos seus pedidos"}
            </p>
          </div>

          {!userEmail && (
            <Card>
              <CardHeader>
                <CardTitle>Consultar Pedidos</CardTitle>
                <CardDescription>Digite seu telefone para ver seus pedidos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchOrders()}
                  />
                  <Button onClick={searchOrders} disabled={loading}>
                    {loading ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {searched && orders.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Seus Pedidos</h2>
              {orders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig];
                const StatusIcon = status.icon;

                return (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                          <CardDescription>
                            Realizado em {formatDate(order.created_at)}
                          </CardDescription>
                        </div>
                        <Badge className={`${status.color} text-white gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nome</p>
                          <p className="font-medium">{order.customer_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold text-primary">
                            R$ {order.total.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Entrega Programada</p>
                          <p className="font-medium">
                            {formatDate(order.scheduled_date)} às {order.scheduled_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pagamento</p>
                          <p className="font-medium">{order.payment_method}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Endereço</p>
                        <p className="font-medium">{order.customer_address}</p>
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
