'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Equipment } from '@/lib/types';
import { Label } from '@/components/ui/label';

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: Equipment;
  onSave?: (data: Partial<Equipment>) => void;
}

export function EquipmentDialog({ open, onOpenChange, equipment, onSave }: EquipmentDialogProps) {
  const [formData, setFormData] = useState<Partial<Equipment>>(equipment || {});

  const handleSave = () => {
    onSave?.(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{equipment ? 'Edit Equipment' : 'Add Equipment'}</DialogTitle>
          <DialogDescription>
            Manage equipment details, pricing, and assignments
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Equipment Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Excavator CAT 320"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Excavators"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Equipment description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Warehouse/Site location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.condition || 'good'}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pricing Type</Label>
            <div className="flex gap-2">
              {['fixed', 'hourly', 'both'].map((type) => (
                <Badge
                  key={type}
                  variant={formData.pricingType === type ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFormData({ ...formData, pricingType: type as any })}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(formData.pricingType === 'fixed' || formData.pricingType === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="fixedRate">Fixed Rate (Daily)</Label>
                <Input
                  id="fixedRate"
                  type="number"
                  value={formData.fixedRate || 0}
                  onChange={(e) => setFormData({ ...formData, fixedRate: Number(e.target.value) })}
                  placeholder="$0.00"
                />
              </div>
            )}
            {(formData.pricingType === 'hourly' || formData.pricingType === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate || 0}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  placeholder="$0.00/hr"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications (comma-separated)</Label>
            <Input
              id="certifications"
              value={formData.certifications?.join(', ') || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  certifications: e.target.value.split(',').map((c) => c.trim()),
                })
              }
              placeholder="e.g., ISO 9001, OSHA Certified"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {equipment ? 'Update' : 'Add'} Equipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
