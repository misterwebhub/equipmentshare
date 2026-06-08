'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: any;
  onSave?: (data: any) => void;
}

export function CustomerDialog({ open, onOpenChange, customer, onSave }: CustomerDialogProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    setFormData(customer || { category: 'construction', status: 'active', contact: {} });
  }, [customer, open]);

  const handleSave = () => {
    onSave?.(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Company' : 'Add Company'}</DialogTitle>
          <DialogDescription>Manage company information and capabilities</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., BuildRight Construction"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.category || 'construction'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                <option value="construction">Construction</option>
                <option value="events">Events</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="hospitality">Hospitality</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.contact?.email || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact!, email: e.target.value },
                })
              }
              placeholder="contact@company.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.contact?.phone || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contact: { ...formData.contact!, phone: e.target.value },
                  })
                }
                placeholder="555-0100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.status || 'active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.contact?.address || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  contact: { ...formData.contact!, address: e.target.value },
                })
              }
              placeholder="123 Main St, City, State"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <Label>Capabilities</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canRentEquipment || false}
                  onChange={(e) =>
                    setFormData({ ...formData, canRentEquipment: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Can Rent Equipment</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canProvideEquipment || false}
                  onChange={(e) =>
                    setFormData({ ...formData, canProvideEquipment: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Can Provide Equipment</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {customer ? 'Update' : 'Add'} Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
