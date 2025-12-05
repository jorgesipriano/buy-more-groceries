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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface Profile {
    id: string;
    full_name: string;
    phone: string;
    approved: boolean;
    created_at: string;
    updated_at: string;
}

export function UserList() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error("Error fetching profiles:", error);
            toast({
                title: "Erro ao carregar usuários",
                description: "Verifique se a tabela 'profiles' foi criada.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleApproval = async (profile: Profile) => {
        try {
            const newStatus = !profile.approved;
            const { error } = await supabase
                .from("profiles")
                .update({ approved: newStatus })
                .eq("id", profile.id);

            if (error) throw error;

            setProfiles(profiles.map(p =>
                p.id === profile.id ? { ...p, approved: newStatus } : p
            ));

            toast({
                title: newStatus ? "Usuário aprovado!" : "Aprovação revogada",
                description: `${profile.full_name || "Usuário"} agora está ${newStatus ? "ativo" : "pendente"}.`,
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Erro ao atualizar status",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return <div>Carregando usuários...</div>;
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gerenciar Usuários</h2>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {profiles.map((profile) => (
                            <TableRow key={profile.id}>
                                <TableCell className="font-medium">{profile.full_name || "Sem nome"}</TableCell>
                                <TableCell>{profile.phone || "-"}</TableCell>
                                <TableCell>
                                    <Badge variant={profile.approved ? "default" : "secondary"}>
                                        {profile.approved ? "Aprovado" : "Pendente"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant={profile.approved ? "destructive" : "default"}
                                        size="sm"
                                        onClick={() => toggleApproval(profile)}
                                    >
                                        {profile.approved ? (
                                            <>
                                                <X className="h-4 w-4 mr-2" />
                                                Revogar
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Aprovar
                                            </>
                                        )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {profiles.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Nenhum usuário encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
