'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RentalDialog } from '@/components/dialogs/rental-dialog';
import { resource } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit2, Calendar } from 'lucide-react';

const rentalsApi = resource<any>('rentals');
const equipmentApi = resource<any>('equipment');
const customersApi = resource<any>('customers');
const peopleApi = resource<any>('people');

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  active: 'bg-status-available/10 text-status-available',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  overdue: 'bg-status-damaged/10 text-status-damaged',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const fmtDate = (v: any) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export default function RentalsPage() {
  const { toast } = useToast();
  const [rentals, setRentals] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<any>(undefined);

  const load = () => {
    setLoading(true);
    Promise.all([rentalsApi.list(), equipmentApi.list(), customersApi.list(), peopleApi.list()])
      .then(([r, e, c, p]) => { setRentals(r); setEquipment(e); setCompanies(c); setPeople(p); })
      .catch((err) => toast({ title: 'Error loading rentals', description: err.message, variant: 'destructive' }))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const eqName = (id?: string) => equipment.find((e) => e.id === id)?.name;
  const coName = (id?: string) => companies.find((c) => c.id === id)?.name;
  const peName = (id?: string) => people.find((p) => p.id === id)?.name;

  const filtered = rentals.filter((rental) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      rental.id?.toLowerCase().includes(term) ||
      eqName(rental.equipmentIds?.[0])?.toLowerCase().includes(term) ||
      coName(rental.rentalCompanyId)?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || rental.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = Array.from(new Set(rentals.map((r) => r.status).filter(Boolean)));

  const save = async (data: any) => {
    try {
      if (selected) {
        await rentalsApi.update(selected.id, data);
        toast({ title: 'Rental updated' });
      } else {
        await rentalsApi.create(data);
        toast({ title: 'Rental created' });
      }
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AppShell title="Rentals">
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end justify-between">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium text-foreground">Search Rentals</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by ID, equipment, or company..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button className="self-end bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setSelected(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Rental
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner className="h-8 w-8 text-primary" /></div>
        ) : (
          <>
            <Card className="overflow-hidden border-border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Rental ID</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Equipment</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Renting Company</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Assigned Person</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Date Range</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Pricing</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Cost</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Status</th>
                      <th className="px-6 py-3 text-left font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((rental) => (
                      <tr key={rental.id} className="border-b border-border transition-colors hover:bg-secondary/50">
                        <td className="px-6 py-4 font-medium text-foreground">{rental.id}</td>
                        <td className="px-6 py-4 text-muted-foreground">{eqName(rental.equipmentIds?.[0]) || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{coName(rental.rentalCompanyId) || '—'}</td>
                        <td className="px-6 py-4 text-muted-foreground">{peName(rental.assignedPersonId) || 'Unassigned'}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar className="h-4 w-4" />
                            {fmtDate(rental.startDate)} - {fmtDate(rental.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize text-muted-foreground">{rental.pricingModel}</td>
                        <td className="px-6 py-4 font-medium text-foreground">${rental.actualCost || rental.estimatedCost || 0}</td>
                        <td className="px-6 py-4"><Badge className={statusColors[rental.status] || ''}>{rental.status}</Badge></td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setSelected(rental); setDialogOpen(true); }}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {filtered.length === 0 && (
              <Card className="border-border p-12 text-center"><p className="text-muted-foreground">No rentals found matching your filters.</p></Card>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Active Rentals</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{filtered.filter((r) => r.status === 'active').length}</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="mt-2 text-3xl font-bold text-foreground">${filtered.reduce((s, r) => s + (r.actualCost || r.estimatedCost || 0), 0).toLocaleString()}</p>
              </Card>
              <Card className="border-border bg-card p-6">
                <p className="text-sm font-medium text-muted-foreground">Pending Rentals</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{filtered.filter((r) => r.status === 'pending').length}</p>
              </Card>
            </div>
          </>
        )}
      </div>

      <RentalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rental={selected}
        equipment={equipment}
        companies={companies}
        people={people}
        onSave={save}
      />
    </AppShell>
  );
}
