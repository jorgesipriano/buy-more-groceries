import { useState, useEffect, FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Category = Tables<"categories">;

export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: "", slug: "" });
    const { toast } = useToast();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("name");

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast({
                title: "Erro ao carregar categorias",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from("categories")
                    .update(formData)
                    .eq("id", editingCategory.id);
                if (error) throw error;
                toast({ title: "Categoria atualizada com sucesso!" });
            } else {
                const { error } = await supabase
                    .from("categories")
                    .insert([formData]);
                if (error) throw error;
                toast({ title: "Categoria criada com sucesso!" });
            }
            setDialogOpen(false);
            fetchCategories();
        } catch (error) {
            console.error("Error saving category:", error);
            toast({
                title: "Erro ao salvar categoria",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", id);
            if (error) throw error;
            toast({ title: "Categoria excluída com sucesso!" });
            fetchCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
            toast({
                title: "Erro ao excluir categoria",
                variant: "destructive",
            });
        }
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Gerenciar Categorias</h2>
            <Button onClick={() => openDialog()}>
                import {useState, useEffect, FormEvent} from "react";
                import {supabase} from "@/integrations/supabase/client";
                import {
                    Table,
                    TableBody,
                    TableCell,
                    TableHead,
                    TableHeader,
                    TableRow,
} from "@/components/ui/table";
                import {Button} from "@/components/ui/button";
                import {Input} from "@/components/ui/input";
                import {
                    Dialog,
                    DialogContent,
                    DialogHeader,
                    DialogTitle,
                    DialogTrigger,
} from "@/components/ui/dialog";
                import {
                    Select,
                    SelectContent,
                    SelectItem,
                    SelectTrigger,
                    SelectValue,
} from "@/components/ui/select";
                import {Label} from "@/components/ui/label";
                import {useToast} from "@/hooks/use-toast";
                import {Pencil, Trash2, Plus} from "lucide-react";
                import type {Tables} from "@/integrations/supabase/types";

                type Category = Tables<"categories">;

                export function CategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
                const [loading, setLoading] = useState(true);
                const [dialogOpen, setDialogOpen] = useState(false);
                const [editingCategory, setEditingCategory] = useState<Category | null>(null);
                const [formData, setFormData] = useState({name: "", slug: "", type: "supermarket" });
                const {toast} = useToast();

    useEffect(() => {
                    fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const {data, error} = await supabase
                .from("categories")
                .select("*")
                .order("name");

                if (error) throw error;
                setCategories(data || []);
        } catch (error) {
                    console.error("Error fetching categories:", error);
                toast({
                    title: "Erro ao carregar categorias",
                variant: "destructive",
            });
        } finally {
                    setLoading(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
                    e.preventDefault();
                try {
            if (editingCategory) {
                const {error} = await supabase
                .from("categories")
                .update(formData)
                .eq("id", editingCategory.id);
                if (error) throw error;
                toast({title: "Categoria atualizada com sucesso!" });
            } else {
                const {error} = await supabase
                .from("categories")
                .insert([formData]);
                if (error) throw error;
                toast({title: "Categoria criada com sucesso!" });
            }
                setDialogOpen(false);
                fetchCategories();
        } catch (error) {
                    console.error("Error saving category:", error);
                toast({
                    title: "Erro ao salvar categoria",
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
                try {
            const {error} = await supabase
                .from("categories")
                .delete()
                .eq("id", id);
                if (error) throw error;
                toast({title: "Categoria excluída com sucesso!" });
                fetchCategories();
        } catch (error) {
                    console.error("Error deleting category:", error);
                toast({
                    title: "Erro ao excluir categoria",
                variant: "destructive",
            });
        }
    };

    const openDialog = (category?: Category) => {
        if (category) {
                    setEditingCategory(category);
                setFormData({
                    name: category.name,
                slug: category.slug,
                type: category.type || "supermarket"
            });
        } else {
                    setEditingCategory(null);
                setFormData({name: "", slug: "", type: "supermarket" });
        }
                setDialogOpen(true);
    };

                return (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold">Gerenciar Categorias</h2>
                        <Button onClick={() => openDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Categoria
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{category.slug}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDialog(category)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive"
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-4">
                                <p className="font-semibold">Dica para Lanches:</p>
                                <p>Para que a categoria apareça na aba "Lanches", use nomes como:
                                    <strong> Hambúrguer, Pizza, Hot Dog, Lanche, Bebida, Combo, Sobremesa</strong>.
                                </p>
                                <p className="mt-1">Outros nomes aparecerão na aba "Mercado".</p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Slug</Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) =>
                                            setFormData({ ...formData, slug: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit">Salvar</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                );
}
