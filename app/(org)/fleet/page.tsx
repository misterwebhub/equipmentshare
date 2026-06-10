'use client';
import { useState } from 'react';
import { useFleetView } from '@/hooks/use-equipment-units';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Package, CheckCircle2, Clock, Wrench, AlertTriangle, Archive,
  Search, LayoutGrid, List, Filter, ChevronDown, ChevronRight,
  Tag, User, Hash, Activity,
} from 'lucide-react';

/* ─── Status config ─────────────────────────────────────────────────── */
const S: Record<string, {
  label: string; dot: string; bg: string; text: string; border: string;
  bar: string; icon: React.ElementType;
}> = {
  available:   { label: 'Available',    dot: '#22c55e', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/25', bar: 'bg-emerald-500',  icon: CheckCircle2   },
  'rented-out':{ label: 'Rented Out',   dot: '#3b82f6', bg: 'bg-blue-500/10',    text: 'text-blue-500',   border: 'border-blue-500/25',   bar: 'bg-blue-500',     icon: Clock          },
  maintenance: { label: 'Maintenance',  dot: '#f59e0b', bg: 'bg-amber-500/10',   text: 'text-amber-500',  border: 'border-amber-500/25',  bar: 'bg-amber-500',    icon: Wrench         },
  damaged:     { label: 'Damaged',      dot: '#ef4444', bg: 'bg-red-500/10',     text: 'text-red-500',    border: 'border-red-500/25',    bar: 'bg-red-500',      icon: AlertTriangle  },
  retired:     { label: 'Retired',      dot: '#9ca3af', bg: 'bg-gray-500/10',    text: 'text-gray-400',   border: 'border-gray-500/20',   bar: 'bg-gray-400',     icon: Archive        },
};

const STATUS_ORDER = ['available', 'rented-out', 'maintenance', 'damaged', 'retired'];

function StatusChip({ status }: { status: string }) {
  const s = S[status] || S.available;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

/* ─── Utilisation bar ───────────────────────────────────────────────── */
function UtilBar({ units }: { units: Record<string, unknown>[] }) {
  const total = units.length;
  if (!total) return null;
  const counts: Record<string, number> = {};
  for (const u of units) {
    const st = u.status as string;
    counts[st] = (counts[st] || 0) + 1;
  }
  return (
    <div className="flex h-1.5 w-full rounded-full overflow-hidden gap-px">
      {STATUS_ORDER.map(st => {
        const n = counts[st] || 0;
        if (!n) return null;
        return (
          <div
            key={st}
            title={`${n} ${S[st]?.label}`}
            className={`${S[st]?.bar} h-full`}
            style={{ width: `${(n / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

/* ─── Unit card (grid) ──────────────────────────────────────────────── */
function UnitCard({ u }: { u: Record<string, unknown> }) {
  const st = u.status as string;
  const s = S[st] || S.available;
  const Icon = s.icon;
  const booking = u.active_booking_info as string | undefined;
  const customer = u.customer_name as string | undefined;
  return (
    <div className={`group relative rounded-xl border p-3 flex flex-col gap-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${s.bg} ${s.border}`}>
      {/* Status dot */}
      <span className="absolute top-3 right-3 h-2 w-2 rounded-full" style={{ background: s.dot }} />

      {/* SKU */}
      <div className="flex items-center gap-2 pr-4">
        <div className="h-7 w-7 rounded-lg bg-background/60 flex items-center justify-center shrink-0">
          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="font-mono text-sm font-bold text-foreground tracking-wide truncate">
          {u.sku_code as string}
        </span>
      </div>

      {/* Status badge */}
      <span className={`self-start inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
        <Icon className="h-2.5 w-2.5" />
        {s.label}
      </span>

      {/* Customer if rented */}
      {customer && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{customer}</span>
        </div>
      )}

      {/* Notes */}
      {!customer && u.notes && (
        <p className="text-[10px] text-muted-foreground truncate">{u.notes as string}</p>
      )}
    </div>
  );
}

/* ─── Unit row (list) ───────────────────────────────────────────────── */
function UnitRow({ u, equip }: { u: Record<string, unknown>; equip: string }) {
  const st = u.status as string;
  const s = S[st] || S.available;
  return (
    <div className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors text-sm">
      <div className="col-span-3 font-mono font-semibold text-foreground flex items-center gap-2">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.dot }} />
        {u.sku_code as string}
      </div>
      <div className="col-span-3 text-muted-foreground truncate">{equip}</div>
      <div className="col-span-2">
        <StatusChip status={st} />
      </div>
      <div className="col-span-3 text-muted-foreground text-xs truncate">
        {(u.customer_name as string) || (u.notes as string) || '—'}
      </div>
      <div className="col-span-1 text-xs text-muted-foreground text-right">
        {u.active_booking_info ? (
          <span className="text-blue-400 font-medium">Booked</span>
        ) : '—'}
      </div>
    </div>
  );
}

/* ─── Equipment group card ──────────────────────────────────────────── */
function EquipGroup({
  eid, group, view, filterStatus,
}: {
  eid: string;
  group: { name: string; category: string; color: string; units: Record<string, unknown>[] };
  view: 'grid' | 'list';
  filterStatus: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleUnits = filterStatus === 'all'
    ? group.units
    : group.units.filter(u => u.status === filterStatus);

  if (visibleUnits.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const u of group.units) {
    const st = u.status as string;
    counts[st] = (counts[st] || 0) + 1;
  }

  const utilPct = group.units.length
    ? Math.round(((counts['rented-out'] || 0) / group.units.length) * 100)
    : 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Group header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Color dot + name */}
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${group.color}22` }}
        >
          <Package className="h-4 w-4" style={{ color: group.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">{group.name}</span>
            {group.category && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <Tag className="h-2.5 w-2.5" />{group.category}
              </span>
            )}
          </div>
          {/* Util bar */}
          <div className="mt-1.5 w-48">
            <UtilBar units={group.units} />
          </div>
        </div>

        {/* Stats strip */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {STATUS_ORDER.map(st => {
            const n = counts[st] || 0;
            if (!n) return null;
            const sc = S[st];
            return (
              <div key={st} className="flex items-center gap-1 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ background: sc.dot }} />
                <span className={sc.text + ' font-semibold'}>{n}</span>
                <span className="text-muted-foreground">{sc.label}</span>
              </div>
            );
          })}
        </div>

        {/* Utilisation pill */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{utilPct}%</span>
            <span className="text-[10px] text-muted-foreground">utilised</span>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {group.units.length} units
          </span>
          {collapsed
            ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* Units body */}
      {!collapsed && (
        <>
          {view === 'grid' ? (
            <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 border-t border-border/50 pt-4">
              {visibleUnits.map(u => (
                <UnitCard key={u.id as string} u={u} />
              ))}
            </div>
          ) : (
            <div className="border-t border-border/50">
              {/* List header */}
              <div className="grid grid-cols-12 px-4 py-2 bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-3">SKU Code</div>
                <div className="col-span-3">Equipment</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Customer / Notes</div>
                <div className="col-span-1 text-right">Booking</div>
              </div>
              {visibleUnits.map(u => (
                <UnitRow key={u.id as string} u={u} equip={group.name} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────── */
export default function FleetPage() {
  const { data, isLoading } = useFleetView();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const units = (data?.units ?? []) as Record<string, unknown>[];
  const summary = (data?.summary ?? {}) as Record<string, number>;

  /* Group by equipment */
  const grouped: Record<string, { name: string; category: string; color: string; units: Record<string, unknown>[] }> = {};
  for (const u of units) {
    const eid = u.equipment_id as string;
    if (!grouped[eid]) {
      grouped[eid] = {
        name: u.equipment_name as string,
        category: (u.category_name as string) || '',
        color: (u.category_color as string) || 'oklch(0.70 0.28 270)',
        units: [],
      };
    }
    grouped[eid].units.push(u);
  }

  /* Search filter */
  const filteredGroups = Object.entries(grouped).filter(([, g]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q) ||
      g.units.some(
        u =>
          (u.sku_code as string)?.toLowerCase().includes(q) ||
          (u.customer_name as string)?.toLowerCase().includes(q),
      )
    );
  });

  const STAT_CARDS = [
    { key: 'total',       label: 'Total Units',  value: summary.total ?? 0,       dot: '#a78bfa', icon: Package      },
    { key: 'available',   label: 'Available',    value: summary.available ?? 0,   dot: '#22c55e', icon: CheckCircle2 },
    { key: 'rented-out',  label: 'Rented Out',   value: summary.rented_out ?? 0,  dot: '#3b82f6', icon: Clock        },
    { key: 'maintenance', label: 'Maintenance',  value: summary.maintenance ?? 0, dot: '#f59e0b', icon: Wrench       },
    { key: 'damaged',     label: 'Damaged',      value: summary.damaged ?? 0,     dot: '#ef4444', icon: AlertTriangle},
    { key: 'retired',     label: 'Retired',      value: summary.retired ?? 0,     dot: '#9ca3af', icon: Archive      },
  ];

  const totalUnits = summary.total || 1;
  const utilPct = Math.round(((summary.rented_out || 0) / totalUnits) * 100);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fleet Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.total ?? 0} physical units across {Object.keys(grouped).length} equipment models
          </p>
        </div>
        {/* Overall utilisation badge */}
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'oklch(0.70 0.28 270 / 0.15)' }}>
            <Activity className="h-4 w-4" style={{ color: 'oklch(0.70 0.28 270)' }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground leading-none">Fleet Utilisation</p>
            <p className="text-lg font-bold text-foreground leading-tight">{utilPct}%</p>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STAT_CARDS.map(({ key, label, value, dot, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={`group relative rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
              filterStatus === key
                ? 'border-[var(--active-border)] shadow-md ring-1 ring-offset-0'
                : 'border-border bg-card hover:border-border/80'
            }`}
            style={
              filterStatus === key
                ? ({ '--active-border': dot, 'borderColor': dot, 'ringColor': dot + '40' } as React.CSSProperties)
                : {}
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{label}</p>
              </div>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: dot + '20' }}>
                <Icon className="h-4 w-4" style={{ color: dot }} />
              </div>
            </div>
            {/* bottom bar */}
            {key !== 'total' && (
              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ background: dot, width: `${Math.round((value / (summary.total || 1)) * 100)}%` }} />
              </div>
            )}
            {filterStatus === key && (
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 h-9 bg-card"
            placeholder="Search by SKU, equipment, customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {filterStatus !== 'all' && (
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs"
            onClick={() => setFilterStatus('all')}>
            <Filter className="h-3.5 w-3.5" />
            {S[filterStatus]?.label ?? filterStatus}
            <span className="text-muted-foreground">×</span>
          </Button>
        )}

        {/* View toggle */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setView('grid')}
            className={`px-3 h-9 flex items-center gap-1.5 text-sm transition-colors ${view === 'grid' ? 'text-white' : 'text-muted-foreground hover:bg-muted/60'}`}
            style={view === 'grid' ? { background: 'oklch(0.70 0.28 270)' } : {}}>
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 h-9 flex items-center gap-1.5 text-sm transition-colors ${view === 'list' ? 'text-white' : 'text-muted-foreground hover:bg-muted/60'}`}
            style={view === 'list' ? { background: 'oklch(0.70 0.28 270)' } : {}}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted/40 border border-border" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-20 text-center">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-foreground">No units found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? 'Try a different search term' : 'Add SKU units to your equipment to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(([eid, group]) => (
            <EquipGroup
              key={eid}
              eid={eid}
              group={group}
              view={view}
              filterStatus={filterStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
