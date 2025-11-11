import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Cart, CartItem } from "@/components/Cart";
import { CheckoutDialog, CheckoutData } from "@/components/CheckoutDialog";
import { PromoCarousel } from "@/components/PromoCarousel";
import { PromoBanner } from "@/components/PromoBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Store, Shield, Search, Package } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  stock: number;
  unit: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Index = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();
      
      setIsAdmin(!!data);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .single()
          .then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const addToCart = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          unit: product.unit,
        },
      ];
    });

    toast({
      title: "Adicionado ao carrinho!",
      description: `${quantity}x ${product.name}`,
    });
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Item removido",
      description: "Produto removido do carrinho",
    });
  };

  const handleCheckout = async (data: CheckoutData) => {
    try {
      const total = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: data.customerName,
          customer_phone: data.customerPhone,
          customer_address: data.customerAddress,
          payment_method: data.paymentMethod,
          total,
          scheduled_date: scheduledDateTime.toISOString(),
          scheduled_time: data.scheduledTime,
          status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Pedido realizado com sucesso!",
        description: "Seu pedido foi registrado e está sendo processado.",
      });

      setCartItems([]);
      setCheckoutOpen(false);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <PromoBanner />
      
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Buy More" className="h-12 w-auto" />
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <NavLink to="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Button>
                </NavLink>
              )}
              <NavLink to="/order-status">
                <Button variant="outline" size="sm">
                  <Package className="h-4 w-4 mr-1" />
                  Meus Pedidos
                </Button>
              </NavLink>
              <Cart
                items={cartItems}
                onUpdateQuantity={updateCartQuantity}
                onRemoveItem={removeFromCart}
                onCheckout={() => setCheckoutOpen(true)}
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-3">
            <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Todos
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        <div className="mb-8">
          <PromoCarousel />
        </div>

        <h2 className="mb-6 text-3xl font-bold">Nossos Produtos</h2>

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description || undefined}
                price={product.price}
                imageUrl={product.image_url || undefined}
                unit={product.unit}
                stock={product.stock}
                onAddToCart={(quantity) => addToCart(product.id, quantity)}
              />
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground">
              Tente selecionar outra categoria
            </p>
          </div>
        )}
      </main>

      <CheckoutDialog
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total}
        onConfirm={handleCheckout}
      />
    </div>
  );
};

export default Index;