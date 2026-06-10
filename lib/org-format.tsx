'use client';
/**
 * OrgFormat — org-level locale & formatting context
 *
 * Provides formatCurrency(), formatDate(), formatNumber() helpers
 * derived from the org's saved preferences (currency, date_format,
 * number_format, timezone).  Wrap the (org) layout with <OrgFormatProvider>.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useOrgProfile } from '@/hooks/use-settings';

/* ── types ────────────────────────────────────────────────────────── */
interface OrgFormatCtx {
  currency:     string;
  dateFormat:   string;
  numberFormat: string;
  timezone:     string;
  /** Format a monetary amount using org currency + number locale */
  formatCurrency: (amount: number | string | null | undefined) => string;
  /** Format a date string / Date using org date_format + timezone */
  formatDate: (date: string | Date | null | undefined, includeTime?: boolean) => string;
  /** Format a plain number using org number locale */
  formatNumber: (n: number | string | null | undefined, decimals?: number) => string;
}

const OrgFormatContext = createContext<OrgFormatCtx>({
  currency:     'USD',
  dateFormat:   'MM/DD/YYYY',
  numberFormat: 'en-US',
  timezone:     'America/New_York',
  formatCurrency: (v) => `$${Number(v ?? 0).toFixed(2)}`,
  formatDate:    (v) => v ? String(v).slice(0, 10) : '—',
  formatNumber:  (v) => String(Number(v ?? 0)),
});

/* ── date formatter ───────────────────────────────────────────────── */
function buildDateFormatter(dateFormat: string, timezone: string) {
  return function formatDate(
    raw: string | Date | null | undefined,
    includeTime = false,
  ): string {
    if (!raw) return '—';
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) return '—';

    try {
      if (dateFormat === 'MMM D, YYYY') {
        const opts: Intl.DateTimeFormatOptions = {
          year: 'numeric', month: 'short', day: 'numeric',
          timeZone: timezone,
          ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
        };
        return new Intl.DateTimeFormat('en-US', opts).format(d);
      }

      // Get year / month / day in the org timezone
      const parts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        timeZone: timezone,
      }).formatToParts(d);
      const p: Record<string, string> = {};
      parts.forEach(({ type, value }) => { p[type] = value; });

      let out: string;
      switch (dateFormat) {
        case 'DD/MM/YYYY': out = `${p.day}/${p.month}/${p.year}`; break;
        case 'YYYY-MM-DD': out = `${p.year}-${p.month}-${p.day}`;  break;
        default:           out = `${p.month}/${p.day}/${p.year}`;  // MM/DD/YYYY
      }

      if (includeTime) {
        const timeParts = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit', minute: '2-digit', timeZone: timezone,
        }).format(d);
        out += ` ${timeParts}`;
      }
      return out;
    } catch {
      return d.toLocaleDateString('en-US');
    }
  };
}

/* ── provider ─────────────────────────────────────────────────────── */
export function OrgFormatProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useOrgProfile();
  const p = profile as Record<string, unknown> | undefined;

  const currency     = (p?.currency     as string) || 'USD';
  const dateFormat   = (p?.date_format  as string) || 'MM/DD/YYYY';
  const numberFormat = (p?.number_format as string) || 'en-US';
  const timezone     = (p?.timezone     as string) || 'America/New_York';

  const ctx = useMemo<OrgFormatCtx>(() => {
    const formatDate = buildDateFormatter(dateFormat, timezone);

    const formatCurrency = (amount: number | string | null | undefined): string => {
      const n = Number(amount ?? 0);
      try {
        return new Intl.NumberFormat(numberFormat, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(n);
      } catch {
        return `${currency} ${n.toFixed(2)}`;
      }
    };

    const formatNumber = (
      n: number | string | null | undefined,
      decimals = 0,
    ): string => {
      try {
        return new Intl.NumberFormat(numberFormat, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(Number(n ?? 0));
      } catch {
        return String(Number(n ?? 0).toFixed(decimals));
      }
    };

    return { currency, dateFormat, numberFormat, timezone, formatCurrency, formatDate, formatNumber };
  }, [currency, dateFormat, numberFormat, timezone]);

  return <OrgFormatContext.Provider value={ctx}>{children}</OrgFormatContext.Provider>;
}

/** Use this hook in any (org) page to get formatting helpers. */
export function useOrgFormat() {
  return useContext(OrgFormatContext);
}
