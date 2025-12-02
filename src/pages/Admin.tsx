import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Home, Database } from "lucide-react";
import { ProductList } from "@/components/admin/ProductList";
import { ProductDialog } from "@/components/admin/ProductDialog";
import { PromotionList } from "@/components/admin/PromotionList";
import { PromotionDialog } from "@/components/admin/PromotionDialog";
import { OrderList } from "@/components/admin/OrderList";
import { CategoryList } from "@/components/admin/CategoryList";
import { NavLink } from "@/components/NavLink";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Product = Tables<"products">;
type Category = Tables<"categories">;
type Promotion = Tables<"promotions">;

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchCategories();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/admin");
      return;
    }

    setUser(session.user);

    // Check if user is admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão de administrador.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (data) setCategories(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setPromotionDialogOpen(true);
  };

  const handleCreatePromotion = () => {
    setEditingPromotion(null);
    setPromotionDialogOpen(true);
    setPromotionDialogOpen(true);
  };

  const handleSeedPromotions = async () => {
    const promotionsToSeed = [
      {
        title: "Combo Arroz e Feijão",
        description: "O básico que funciona",
        special_price: 40,
        is_active: true,
      },
      {
        title: "Lanche Completo",
        description: "Tudo que você precisa",
        special_price: 50,
        is_active: true,
      },
      {
        title: "Combo Dog + Bebida",
        description: "Cachorro quente com refrigerante",
        special_price: 25,
        is_active: true,
      }
    ];

    try {
      const { error } = await supabase
        .from("promotions")
        .insert(promotionsToSeed);

      if (error) throw error;

      toast({
        title: "Promoções criadas!",
        description: "3 promoções foram adicionadas com sucesso.",
      });
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error("Error seeding promotions:", error);
      toast({
        title: "Erro ao criar promoções",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-primary">Painel Admin - Buy More</h1>
            <nav className="flex gap-6">
              <NavLink to="/">
                <Home className="h-4 w-4 inline mr-1" />
                Loja
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="promotions">Promoções</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderList />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryList />
          </TabsContent>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Gerenciar Produtos</h2>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </div>
            <ProductList onEdit={handleEdit} />
          </TabsContent>

          <TabsContent value="promotions">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Gerenciar Promoções</h2>
              <Button onClick={handleCreatePromotion}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Promoção
              </Button>
              <Button onClick={handleSeedPromotions} variant="secondary" className="ml-2">
                <Database className="h-4 w-4 mr-2" />
                Seed Promoções
              </Button>
            </div>
            <PromotionList onEdit={handleEditPromotion} refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>
      </main>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        categories={categories}
      />

      <PromotionDialog
        open={promotionDialogOpen}
        onOpenChange={setPromotionDialogOpen}
        promotion={editingPromotion}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}
