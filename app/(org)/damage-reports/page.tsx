'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useOrgFormat } from '@/lib/org-format';

interface ConditionReport {
  id: string;
  equipment_name: string;
  unit_sku?: string;
  damage_level: string;
  description: string;
  status: string;
  repair_cost: number;
  reporter_name?: string;
  created_at: string;
}

const DAMAGE_COLORS: Record<string, string> = {
  minor: 'oklch(0.80 0.22 90)',
  moderate: 'oklch(0.68 0.26 30)',
  severe: 'oklch(0.65 0.30 20)',
};

export default function DamageReportsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['damage-reports'],
    queryFn: async () => {
      // Only fetch reports with actual damage (exclude 'none')
      const [minor, moderate, severe] = await Promise.all([
        api.get('/condition-reports?damage_level=minor'),
        api.get('/condition-reports?damage_level=moderate'),
        api.get('/condition-reports?damage_level=severe'),
      ]);
      return [
        ...(severe.data.data || []),
        ...(moderate.data.data || []),
        ...(minor.data.data || []),
      ] as ConditionReport[];
    },
  });

  const reports = data || [];
  const totalCost = reports.reduce((s, r) => s + (Number(r.repair_cost) || 0), 0);
  const severeCount = reports.filter(r => r.damage_level === 'severe').length;
  const { formatCurrency, formatDate } = useOrgFormat();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Damage Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">All equipment damage incidents</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Damage Reports', value: reports.length, color: 'oklch(0.68 0.26 30)' },
          { label: 'Severe Incidents', value: severeCount, color: 'oklch(0.65 0.30 20)' },
          { label: 'Total Repair Cost', value: formatCurrency(totalCost), color: 'oklch(0.76 0.22 155)' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Equipment</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Damage Level</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Repair Cost</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Reported By</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
                ) : isError ? (
                  <tr><td colSpan={8} className="p-8 text-center text-destructive">Failed to load damage reports. Please refresh the page.</td></tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">No damage reports found</p>
                    </td>
                  </tr>
                ) : reports.map((r) => (
                  <tr key={r.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="p-3 font-medium">{r.equipment_name}</td>
                    <td className="p-3">
                      {r.unit_sku ? (
                        <span className="text-xs px-2 py-1 rounded font-mono" style={{ background: 'oklch(0.70 0.28 270 / 0.15)', color: 'oklch(0.70 0.28 270)' }}>
                          {r.unit_sku}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge className="text-xs capitalize" style={{ background: `${DAMAGE_COLORS[r.damage_level]}20`, color: DAMAGE_COLORS[r.damage_level], border: `1px solid ${DAMAGE_COLORS[r.damage_level]}40` }}>
                        {r.damage_level}
                      </Badge>
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground">{r.description || '—'}</td>
                    <td className="p-3 font-medium" style={{ color: r.repair_cost > 0 ? 'oklch(0.68 0.26 30)' : undefined }}>
                      {r.repair_cost > 0 ? formatCurrency(r.repair_cost) : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs capitalize">
                        {(r.status ?? '').replace('_', ' ') || '—'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.reporter_name || 'System'}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
