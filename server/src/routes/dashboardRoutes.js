import { Router } from 'express';
import { list } from '../store.js';
import { authenticate, tenantScope } from '../auth.js';

const router = Router();
router.use(authenticate);

/** GET /api/dashboard/stats — KPIs for the caller's org. */
router.get('/stats', (req, res) => {
  const org = tenantScope(req);
  const equipment = list('equipment', org);
  const rentals = list('rentals', org);
  const maintenance = list('maintenance', org);

  res.json({
    totalEquipment: equipment.length,
    availableEquipment: equipment.filter((e) => e.status === 'available').length,
    inUseEquipment: equipment.filter((e) => e.status === 'in-use' || e.status === 'rented-out').length,
    activeRentals: rentals.filter((r) => r.status === 'active').length,
    pendingRentals: rentals.filter((r) => r.status === 'pending').length,
    overdueRentals: rentals.filter((r) => r.status === 'overdue').length,
    revenue: rentals.reduce((s, r) => s + (r.actualCost || r.estimatedCost || 0), 0),
    maintenanceAlerts: equipment.filter((e) => e.status === 'maintenance' || e.status === 'damaged').length,
    scheduledMaintenance: maintenance.filter((m) => m.status === 'scheduled').length,
  });
});

export default router;
