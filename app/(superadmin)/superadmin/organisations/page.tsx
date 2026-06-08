'use client';
import { useState } from 'react';
import { useOrganisations } from '@/hooks/use-superadmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building2, ShieldCheck, ShieldOff } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 border-green-200',
  trial: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  suspended: 'bg-red-500/10 text-red-700 border-red-200',
};

export default function OrganisationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { organisations, total, isLoading, updateStatusMutation } = useOrganisations(search, statusFilter !== 'all' ? statusFilter : '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organisations</h1>
        <p className="text-muted-foreground">{total} organizations registered</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{(organisations as Record<string, unknown>[]).filter(o => o.status === 'active').length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Suspended</p><p className="text-2xl font-bold text-red-600">{(organisations as Record<string, unknown>[]).filter(o => o.status === 'suspended').length}</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-muted rounded" />)}</div>
      ) : (organisations as unknown[]).length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No organizations found</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Sub Status</TableHead>
                <TableHead>Org Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(organisations as Record<string, unknown>[]).map(o => (
                <TableRow key={o.id as string}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{o.name as string}</p>
                      <p className="text-xs text-muted-foreground">{o.slug as string}</p>
                    </div>
                  </TableCell>
                  <TableCell>{(o.plan_name as string) || '—'}</TableCell>
                  <TableCell>{o.user_count as number}</TableCell>
                  <TableCell>{o.equipment_count as number}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{(o.sub_status as string) || '—'}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs capitalize border ${STATUS_COLORS[o.status as string] || ''}`} variant="outline">{o.status as string}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(o.created_at as string), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    {o.status !== 'suspended' ? (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                        onClick={() => { if (confirm(`Suspend ${o.name}?`)) updateStatusMutation.mutate({ id: o.id as string, status: 'suspended' }); }}>
                        <ShieldOff className="h-3 w-3 mr-1" /> Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600"
                        onClick={() => updateStatusMutation.mutate({ id: o.id as string, status: 'active' })}>
                        <ShieldCheck className="h-3 w-3 mr-1" /> Activate
                      </Button>
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
