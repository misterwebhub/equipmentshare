'use client';
import { useState } from 'react';
import { useCategoriesModule, CategoryForm } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function CategoriesPage() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({ name: '', icon: 'Package', color: '#3b82f6', description: '', parent_id: '' });

  const { categories, isLoading, createMutation, updateMutation, deleteMutation, EMPTY_FORM } = useCategoriesModule();

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (c: Record<string, unknown>) => {
    setEditingId(c.id as string);
    setForm({ name: (c.name as string) || '', icon: (c.icon as string) || 'Package', color: (c.color as string) || '#3b82f6', description: (c.description as string) || '', parent_id: (c.parent_id as string) || '' });
    setOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, form }, { onSuccess: () => setOpen(false) });
    } else {
      createMutation.mutate(form, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your equipment by type</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="pt-6"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>)}
        </div>
      ) : (categories as unknown[]).length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No categories yet. Add your first one.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(categories as Record<string, unknown>[]).map((c) => (
            <Card key={c.id as string}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: (c.color as string) || '#3b82f6' }} />
                    <CardTitle className="text-base">{c.name as string}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete this category?')) deleteMutation.mutate(c.id as string); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {c.description && <p className="text-sm text-muted-foreground mb-2">{c.description as string}</p>}
                <Badge variant="secondary" className="text-xs">{(c.equipment_count as number) ?? 0} equipment</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Heavy Equipment" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button key={color} className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }} onClick={() => setForm(p => ({ ...p, color }))} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || isPending}>{isPending ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
