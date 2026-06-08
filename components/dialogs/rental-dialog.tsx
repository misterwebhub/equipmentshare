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

interface Option { id: string; name: string }

interface RentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental?: any;
  equipment?: Option[];
  companies?: Option[];
  people?: Option[];
  onSave?: (data: any) => void;
}

const toDateInput = (v: any) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
};

export function RentalDialog({
  open, onOpenChange, rental, equipment = [], companies = [], people = [], onSave,
}: RentalDialogProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    setFormData(rental || { pricingModel: 'fixed', status: 'pending' });
  }, [rental, open]);

  const set = (k: string, v: any) => setFormData((f: any) => ({ ...f, [k]: v }));

  const handleSave = () => {
    onSave?.(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{rental ? 'Edit Rental' : 'Create New Rental'}</DialogTitle>
          <DialogDescription>Create or update a rental agreement</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rentalCompany">Renting Company</Label>
              <select
                id="rentalCompany"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.rentalCompanyId || ''}
                onChange={(e) => set('rentalCompanyId', e.target.value)}
              >
                <option value="">Select Company</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedPerson">Assigned Person</Label>
              <select
                id="assignedPerson"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.assignedPersonId || ''}
                onChange={(e) => set('assignedPersonId', e.target.value)}
              >
                <option value="">Select Person</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <select
                id="equipment"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.equipmentIds?.[0] || ''}
                onChange={(e) => set('equipmentIds', [e.target.value])}
              >
                <option value="">Select Equipment</option>
                {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricingModel">Pricing Model</Label>
              <select
                id="pricingModel"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.pricingModel || 'fixed'}
                onChange={(e) => set('pricingModel', e.target.value)}
              >
                <option value="fixed">Fixed Cost</option>
                <option value="hourly">Hourly Rate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={toDateInput(formData.startDate)}
                onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={toDateInput(formData.endDate)}
                onChange={(e) => set('endDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost</Label>
              <Input id="estimatedCost" type="number" value={formData.estimatedCost ?? 0}
                onChange={(e) => set('estimatedCost', Number(e.target.value))} placeholder="$0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hoursUsed">Hours Used (if hourly)</Label>
              <Input id="hoursUsed" type="number" value={formData.hoursUsed ?? 0}
                onChange={(e) => set('hoursUsed', Number(e.target.value))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                value={formData.status || 'pending'}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{rental ? 'Update' : 'Create'} Rental</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
