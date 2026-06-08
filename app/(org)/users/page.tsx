'use client';
import { useState } from 'react';
import { useUsers, UserInviteForm } from '@/hooks/use-users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, UserX } from 'lucide-react';
import { format } from 'date-fns';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/10 text-purple-700 border-purple-200',
  manager: 'bg-blue-500/10 text-blue-700 border-blue-200',
  operator: 'bg-green-500/10 text-green-700 border-green-200',
  viewer: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserInviteForm>({ name: '', email: '', role: 'operator' });

  const { users, isLoading, inviteMutation, updateMutation, deactivateMutation, EMPTY_FORM } = useUsers(search);

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (u: Record<string, unknown>) => {
    setEditingId(u.id as string);
    setForm({ name: (u.name as string) || '', email: (u.email as string) || '', role: (u.role as string) || 'operator' });
    setOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, name: form.name, role: form.role }, { onSuccess: () => setOpen(false) });
    } else {
      inviteMutation.mutate(form, { onSuccess: () => setOpen(false) });
    }
  };

  const isPending = inviteMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">{(users as unknown[]).length} team members</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Invite User</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
      ) : (users as unknown[]).length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No users found</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users as Record<string, unknown>[]).map(u => (
                <TableRow key={u.id as string}>
                  <TableCell className="font-medium">{u.name as string}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email as string}</TableCell>
                  <TableCell><Badge className={`text-xs capitalize border ${ROLE_COLORS[u.role as string] || ''}`} variant="outline">{u.role as string}</Badge></TableCell>
                  <TableCell><Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-xs">{u.status as string}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(u.created_at as string), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(u)}>Edit</Button>
                      {u.status === 'active' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => { if (confirm('Deactivate user?')) deactivateMutation.mutate(u.id as string); }}>
                          <UserX className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit User' : 'Invite User'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" /></div>
            {!editingId && <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" /></div>}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingId && <p className="text-xs text-muted-foreground">A temporary password will be generated for the new user.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || (!editingId && !form.email) || isPending}>
              {isPending ? 'Saving...' : editingId ? 'Update' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
