'use client';
import { useState } from 'react';
import { usePenalties } from '@/hooks/use-penalties';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, AlertTriangle } from 'lucide-react';
import { useOrgFormat } from '@/lib/org-format';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  paid:     'bg-green-500/10 text-green-700 border-green-200',
  invoiced: 'bg-blue-500/10 text-blue-700 border-blue-200',
  waived:   'bg-gray-500/10 text-gray-700 border-gray-200',
};

export default function PenaltiesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { penalties, isLoading, waiveMutation, markPaidMutation } = usePenalties(statusFilter !== 'all' ? statusFilter : '');
  const { formatCurrency, formatDate } = useOrgFormat();

  const filtered = (penalties as Record<string, unknown>[]).filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.equipment_name as string)?.toLowerCase().includes(q) || (p.customer_name as string)?.toLowerCase().includes(q);
  });

  const totalPending = (penalties as Record<string, unknown>[]).filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount ?? 0), 0);
  const totalPaid = (penalties as Record<string, unknown>[]).filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Penalties</h1>
        <p className="text-muted-foreground">Late returns, damage, and other charges</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Penalties</p><p className="text-2xl font-bold">{(penalties as unknown[]).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Pending Amount</p><p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Collected</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search penalties..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No penalties found</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id as string}>
                  <TableCell className="font-medium">{(p.equipment_name as string) || '—'}</TableCell>
                  <TableCell>{(p.customer_name as string) || '—'}</TableCell>
                  <TableCell className="capitalize">{(p.type as string)?.replace('_', ' ')}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(p.created_at as string)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs capitalize border ${STATUS_COLORS[p.status as string] || ''}`} variant="outline">{p.status as string}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => { if (confirm('Mark as paid?')) markPaidMutation.mutate(p.id as string); }}>
                          Paid
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          onClick={() => { if (confirm('Waive this penalty?')) waiveMutation.mutate({ id: p.id as string, reason: '' }); }}>
                          Waive
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
