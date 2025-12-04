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
    const [formData, setFormData] = useState({ name: "", slug: "", type: "market" });
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

    const generateSlug = (name: string, type: string) => {
        const baseSlug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        const prefix = type === "snack" ? "snack-" : "market-";
        // If it already has a prefix, don't add it again (unless type changed)
        if (baseSlug.startsWith("snack-") || baseSlug.startsWith("market-")) {
            // Remove existing prefix if it doesn't match the new type
            const cleanSlug = baseSlug.replace(/^(snack-|market-)/, "");
            return `${prefix}${cleanSlug}`;
        }
        return `${prefix}${baseSlug}`;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const slug = generateSlug(formData.name, formData.type);
            const dataToSave = {
                name: formData.name,
                slug: slug,
            };

            if (editingCategory) {
                const { error } = await supabase
                    .from("categories")
                    .update(dataToSave)
                    .eq("id", editingCategory.id);
                if (error) throw error;
                toast({ title: "Categoria atualizada com sucesso!" });
            } else {
                const { error } = await supabase
                    .from("categories")
                    .insert([dataToSave]);
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
    };

    const openDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            const type = category.slug.startsWith("snack-") ? "snack" : "market";
            setFormData({
                name: category.name,
                slug: category.slug,
                type: type
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", slug: "", type: "market" });
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
                            <TableHead>Tipo</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.map((category) => (
                            <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell>
                                    {category.slug.startsWith("snack-") ? "Lanche" : "Mercado"}
                                </TableCell>
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="market">Mercado</SelectItem>
                                    <SelectItem value="snack">Lanche</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                            <Label htmlFor="slug">Slug (Gerado automaticamente)</Label>
                            <Input
                                id="slug"
                                value={generateSlug(formData.name, formData.type)}
                                disabled
                                className="bg-muted"
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
