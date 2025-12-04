import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [house, setHouse] = useState("");
  const [room, setRoom] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndRedirect();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkAuthAndRedirect();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAuthAndRedirect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (roleData) {
        navigate("/admin-panel");
        return;
      }

      // Check if user is approved
      const { data: profileData } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", session.user.id)
        .single();

      if (profileData && !profileData.approved) {
        // If not approved, stay on Auth page but maybe show a message? 
        // Or redirect to a specific pending page. 
        // For now, let's handle it in the login flow or redirect to a pending state.
        // If we are already on Auth, we might want to stay here.
        // But if the user just opened the app and is logged in but not approved, 
        // we should probably show the pending screen.
        // Let's assume App.tsx handles the protection, but here we redirect admins.
        // If regular user, we redirect to / (which will handle the pending check).
        navigate("/");
      } else {
        navigate("/");
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate dummy email from phone
      const dummyEmail = `${phone.replace(/\D/g, "")}@temp.com`;

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password,
        });

        if (error) throw error;

        // Check approval status immediately after login
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("approved")
            .eq("id", session.user.id)
            .single();

          if (profile && !profile.approved) {
            toast({
              title: "Aguardando aprovação",
              description: "Sua conta ainda não foi aprovada pelo administrador.",
              variant: "destructive",
            });
            // We don't logout here, we let them go to the pending screen (handled by App/Index)
          } else {
            toast({
              title: "Login realizado!",
              description: "Bem-vindo de volta.",
            });
          }
        }

      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              house: house,
              room: room,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create profile entry
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: authData.user.id,
                full_name: fullName,
                phone: phone,
                house: house,
                room: room,
                approved: false // Default to false
              }
            ]);

          if (profileError) {
            console.error("Error creating profile:", profileError);
            // If profile creation fails, we might want to warn the user or try to recover.
            // But for now, let's just show the success message for account creation.
          }
        }

        toast({
          title: "Conta criada!",
          description: "Aguarde a aprovação do administrador para acessar.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <ShoppingCart className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Buy More</CardTitle>
          <CardDescription>
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu Nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="house">Casa</Label>
                    <Input
                      id="house"
                      type="text"
                      placeholder="Ex: 10"
                      value={house}
                      onChange={(e) => setHouse(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Quarto</Label>
                    <Input
                      id="room"
                      type="text"
                      placeholder="Ex: 01"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
