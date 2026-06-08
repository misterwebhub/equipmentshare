'use client';

import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Option { id: string; name: string }

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: any;
  companies?: Option[];
  onSave?: (data: any) => void;
}

export function PersonDialog({ open, onOpenChange, person, companies = [], onSave }: PersonDialogProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    setFormData(person || { role: 'operator', status: 'active' });
  }, [person, open]);

  const set = (k: string, v: any) => setFormData((f: any) => ({ ...f, [k]: v }));

  const handleSave = () => {
    onSave?.(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{person ? 'Edit User' : 'Add User'}</DialogTitle>
          <DialogDescription>Manage user details and role.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={formData.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select id="role" className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.role || 'operator'} onChange={(e) => set('role', e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.status || 'active'} onChange={(e) => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <select id="company" className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              value={formData.companyId || ''} onChange={(e) => set('companyId', e.target.value)}>
              <option value="">Select Company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={formData.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="555-0100" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{person ? 'Update' : 'Add'} User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
