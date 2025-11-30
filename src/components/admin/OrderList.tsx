import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, CheckCircle, XCircle, Clock, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    total: number;
    status: string;
    payment_method: string;
    items?: OrderItem[];
}

interface OrderItem {
    id: string;
    quantity: number;
    price: number;
    product: {
        name: string;
    };
}

export function OrderList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchOrders();

        // Subscribe to new orders
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from("orders")
                .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            products (
              name
            )
          )
        `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Transform data to match interface
            const formattedOrders = data.map((order: any) => ({
                ...order,
                items: order.order_items.map((item: any) => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    product: item.products
                }))
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast({
                title: "Erro ao carregar pedidos",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("orders")
                .update({ status: newStatus })
                .eq("id", orderId);

            if (error) throw error;

            toast({
                title: "Status atualizado",
                description: `Pedido atualizado para ${getStatusLabel(newStatus)}`,
            });

            // Optimistic update
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                title: "Erro ao atualizar status",
                variant: "destructive",
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-500";
            case "accepted": return "bg-blue-500";
            case "preparing": return "bg-orange-500";
            case "out_for_delivery": return "bg-purple-500";
            case "delivered": return "bg-green-500";
            case "cancelled": return "bg-red-500";
            default: return "bg-gray-500";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "pending": return "Pendente";
            case "accepted": return "Aceito";
            case "preparing": return "Preparando";
            case "out_for_delivery": return "Saiu para Entrega";
            case "delivered": return "Entregue";
            case "cancelled": return "Cancelado";
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Pedidos Recentes</h2>
            <div className="grid gap-4">
                {orders.map((order) => (
                    <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/50 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(order.status)}>
                                        {getStatusLabel(order.status)}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <Select
                                    defaultValue={order.status}
                                    onValueChange={(value) => updateStatus(order.id, value)}
                                >
                                    <SelectTrigger className="w-[180px] h-8">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="accepted">Aceito</SelectItem>
                                        <SelectItem value="preparing">Preparando</SelectItem>
                                        <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
                                        <SelectItem value="delivered">Entregue</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Cliente</h3>
                                    <p className="text-sm"><span className="font-medium">Nome:</span> {order.customer_name}</p>
                                    <p className="text-sm"><span className="font-medium">Tel:</span> {order.customer_phone}</p>
                                    <p className="text-sm"><span className="font-medium">Endereço:</span> {order.customer_address}</p>
                                    <p className="text-sm"><span className="font-medium">Pagamento:</span> {order.payment_method}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Itens</h3>
                                    <div className="space-y-1">
                                        {order.items?.map((item) => (
                                            <div key={item.id} className="text-sm flex justify-between">
                                                <span>{item.quantity}x {item.product.name}</span>
                                                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                                            <span>Total</span>
                                            <span>R$ {order.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {orders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhum pedido encontrado.
                    </div>
                )}
            </div>
        </div>
    );
}
