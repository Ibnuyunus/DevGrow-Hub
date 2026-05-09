import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCategories, type Category } from "@/lib/categories";
import { toast } from "sonner";

export function CategoryManager() {
  const { data: categories } = useCategories();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const add = async () => {
    const name = newName.trim();
    if (name.length < 2) return toast.error("Name must be at least 2 characters");
    setBusy(true);
    const { error } = await supabase.from("categories").insert({ name });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Category added");
    setNewName("");
    refresh();
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const saveEdit = async (id: string) => {
    const name = editName.trim();
    if (name.length < 2) return toast.error("Name must be at least 2 characters");
    setBusy(true);
    const { error } = await supabase.from("categories").update({ name }).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Category updated");
    setEditingId(null);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Projects keep their old label.")) return;
    setBusy(true);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    refresh();
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-card">
      <h2 className="text-sm font-semibold">Manage categories</h2>
      <p className="mt-1 text-xs text-muted-foreground">Admin only — add, rename, or remove categories.</p>

      <div className="mt-3 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          maxLength={40}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <Button type="button" onClick={add} disabled={busy} size="sm" className="bg-hero-gradient text-primary-foreground">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <ul className="mt-4 divide-y divide-border/60">
        {categories?.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2">
            {editingId === c.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={40}
                  className="h-8"
                  autoFocus
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => saveEdit(c.id)} disabled={busy}>
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{c.name}</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => remove(c.id)} disabled={busy}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </li>
        ))}
        {categories?.length === 0 && (
          <li className="py-3 text-center text-xs text-muted-foreground">No categories yet.</li>
        )}
      </ul>
    </div>
  );
}
