'use client';
import { useFleetView } from '@/hooks/use-equipment-units';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, Package, CheckCircle, Clock, Wrench, AlertTriangle, Archive } from 'lucide-react';

const STATUS_STYLES: Record<string, { badge: string; icon: React.ElementType; color: string }> = {
  available:   { badge: 'bg-green-500/10 text-green-400 border-green-500/30',  icon: CheckCircle,    color: 'text-green-400' },
  'rented-out':{ badge: 'bg-blue-500/10  text-blue-400  border-blue-500/30',   icon: Clock,          color: 'text-blue-400'  },
  maintenance: { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',icon: Wrench,        color: 'text-yellow-400'},
  damaged:     { badge: 'bg-red-500/10   text-red-400   border-red-500/30',    icon: AlertTriangle,  color: 'text-red-400'   },
  retired:     { badge: 'bg-gray-500/10  text-gray-400  border-gray-500/30',   icon: Archive,        color: 'text-gray-400'  },
};

export default function FleetPage() {
  const { data, isLoading } = useFleetView();
  const units = (data?.units ?? []) as Record<string, unknown>[];
  const summary = (data?.summary ?? {}) as Record<string, number>;

  // Group by equipment
  const grouped: Record<string, { name: string; category: string; color: string; units: Record<string, unknown>[] }> = {};
  for (const u of units) {
    const eid = u.equipment_id as string;
    if (!grouped[eid]) {
      grouped[eid] = {
        name: u.equipment_name as string,
        category: u.category_name as string || '',
        color: u.category_color as string || '#3b82f6',
        units: [],
      };
    }
    grouped[eid].units.push(u);
  }

  const summaryCards = [
    { label: 'Total Units',   value: summary.total,       color: 'text-foreground',  bg: 'bg-muted/60',          icon: Package },
    { label: 'Available',     value: summary.available,   color: 'text-green-400',   bg: 'bg-green-500/10',      icon: CheckCircle },
    { label: 'Rented Out',    value: summary.rented_out,  color: 'text-blue-400',    bg: 'bg-blue-500/10',       icon: Clock },
    { label: 'Maintenance',   value: summary.maintenance, color: 'text-yellow-400',  bg: 'bg-yellow-500/10',     icon: Wrench },
    { label: 'Damaged',       value: summary.damaged,     color: 'text-red-400',     bg: 'bg-red-500/10',        icon: AlertTriangle },
    { label: 'Retired',       value: summary.retired,     color: 'text-gray-400',    bg: 'bg-gray-500/10',       icon: Archive },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
          <Layers className="h-6 w-6 text-violet-400" />
          Fleet View
        </h1>
        <p className="text-muted-foreground text-sm">All physical units across all equipment models</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {summaryCards.map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className={`rounded-xl ${bg} border border-border/30 p-3 text-center`}>
            <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No SKU units found. Add units to your equipment to see them here.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([eid, group]) => (
            <Card key={eid} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ background: group.color }} />
                  {group.name}
                  {group.category && <span className="text-xs font-normal text-muted-foreground">{group.category}</span>}
                  <span className="ml-auto text-xs font-normal text-muted-foreground">{group.units.length} units</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {group.units.map((u) => {
                    const st = u.status as string;
                    const styles = STATUS_STYLES[st] || STATUS_STYLES.available;
                    const Icon = styles.icon;
                    return (
                      <div key={u.id as string}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${styles.badge}`}
                        title={u.active_booking_info ? String(u.active_booking_info) : u.notes ? String(u.notes) : st}>
                        <Icon className="h-3 w-3" />
                        {u.sku_code as string}
                        {u.active_booking_info && (
                          <span className="ml-1 font-normal font-sans opacity-80 max-w-28 truncate">
                            {(u.customer_name as string) || ''}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Mini summary for this equipment */}
                <div className="mt-3 flex gap-3 text-xs text-muted-foreground">
                  {(['available','rented-out','maintenance','damaged'] as const).map(s => {
                    const cnt = group.units.filter(u => u.status === s).length;
                    if (!cnt) return null;
                    return <span key={s} className={STATUS_STYLES[s]?.color}>{cnt} {s}</span>;
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
