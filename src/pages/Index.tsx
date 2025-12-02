import { useState, useEffect } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Cart, CartItem } from "@/components/Cart";
import { CheckoutDialog, CheckoutData } from "@/components/CheckoutDialog";
import { PromoCarousel } from "@/components/PromoCarousel";
import { PromoBanner } from "@/components/PromoBanner";
import { ProductPromotions } from "@/components/ProductPromotions";
import { PromotionShowcase } from "@/components/PromotionShowcase";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, Store, Shield, Search, Package, ClipboardList, Utensils, ShoppingBasket } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";
import { sendOrderNotification } from "@/services/webhook";

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
  const [activeType, setActiveType] = useState<"promotions" | "supermarket" | "snacks">("promotions");

  const SNACK_KEYWORDS = ["lanche", "hambúrguer", "pizza", "hot dog", "cachorro quente", "macarrão", "combo", "sobremesa"];

  const isSnackCategory = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("leite")) return false;
    return SNACK_KEYWORDS.some(keyword => lowerName.includes(keyword));
  };

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

  const addToCart = (productId: string, quantity: number, ingredients?: string[]) => {
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
      // Check if item with same ingredients exists
      const existingWithIngredients = prev.find(
        (item) =>
          item.id === productId &&
          JSON.stringify(item.ingredients?.sort()) === JSON.stringify(ingredients?.sort())
      );

      if (existingWithIngredients) {
        return prev.map((item) =>
          item === existingWithIngredients
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
          ingredients,
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
      // 1. ENVIA PARA O SUPABASE (O que já existia)
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_name: data.customerName,
          customer_email: "cliente@sem-email.com",
          customer_phone: data.customerPhone,
          customer_address: data.customerAddress,
          payment_method: data.paymentMethod,
          total,
        })
        .select()
        .single();
      if (orderError) throw orderError;
      // --- ADIÇÃO: ENVIA PARA O SEU BOT (VM) ---
      // Usando o serviço dedicado para garantir o envio
      const itensFormatados = cartItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        ingredients: item.ingredients
      }));

      const webhookData = {
        id: order.id,
        customer_name: data.customerName,
        customer_email: "cliente@sem-email.com",
        customer_phone: data.customerPhone,
        customer_address: data.customerAddress,
        customer_complement: "",
        payment_method: data.paymentMethod,
        total_price: total,
        items: itensFormatados
      };

      const webhookResult = await sendOrderNotification(webhookData);
      if (!webhookResult.success) {
        console.warn("Webhook notification failed:", webhookResult.message);
      }
      // --- FIM DA ADIÇÃO ---
      // 2. SALVA OS ITENS NO SUPABASE (O que já existia)
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
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Erro ao finalizar pedido",
        description: error.message || "Erro desconhecido. Verifique o console.",
        variant: "destructive",
      });
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const category = categories.find((c) => c.id === product.category_id);
    const isSnack = category ? isSnackCategory(category.name) : false;

    if (activeType === "promotions") return matchesCategory && matchesSearch;
    if (activeType === "snacks") return isSnack && matchesCategory && matchesSearch;
    if (activeType === "supermarket") return !isSnack && matchesCategory && matchesSearch;
    return false;
  });

  const snackCategories = categories.filter((c) => isSnackCategory(c.name));
  const supermarketCategories = categories.filter((c) => !isSnackCategory(c.name));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Buy More Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Buy More
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <NavLink to="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </NavLink>
            )}
            <NavLink to="/order-status">
              <ClipboardList className="h-4 w-4 mr-2" />
              Acompanhar Pedido
            </NavLink>
            <Button
              onClick={() => setCheckoutOpen(true)}
              variant="default"
              className="gap-2"
            >
              <ShoppingBasket className="h-4 w-4" />
              {cartItems.length > 0 && `(${cartItems.length})`}
            </Button>
          </div>
        </div>
      </nav>

      <main className="container py-8">
        <PromoCarousel />

        <div className="mt-8 flex justify-center">
          <Tabs value={activeType} onValueChange={(v: any) => setActiveType(v)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="promotions">Promoções</TabsTrigger>
              <TabsTrigger value="snacks">
                <Utensils className="h-4 w-4 mr-2" />
                Lanches
              </TabsTrigger>
              <TabsTrigger value="supermarket">
                <Store className="h-4 w-4 mr-2" />
                Mercado
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {activeType === "promotions" && (
          <div className="mt-8 space-y-12">
            <PromotionShowcase />
            <ProductPromotions onAddToCart={addToCart} />
          </div>
        )}

        {activeType !== "promotions" && (
          <>
            <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className="whitespace-nowrap"
              >
                <Package className="h-4 w-4 mr-2" />
                Todos
              </Button>
              {(activeType === "snacks" ? snackCategories : supermarketCategories).map(
                (category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                  >
                    {category.name}
                  </Button>
                )
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar produtos..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {!loading && filteredProducts.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      <Cart
        items={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={() => setCheckoutOpen(true)}
      />

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
