// Aligned with backend MySQL schema

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'operator' | 'viewer';
export type OrgStatus = 'active' | 'suspended' | 'trial';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';
export type EquipmentStatus = 'available' | 'rented_out' | 'maintenance' | 'damaged' | 'retired';
export type BookingStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'overdue';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DamageLevel = 'none' | 'minor' | 'moderate' | 'severe';
export type PricingModel = 'fixed' | 'hourly';

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_equipment: number;
  max_users: number;
  max_customers: number;
  features: string | string[];
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  logo_url?: string;
  status: OrgStatus;
  plan_id: string;
  plan_name?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  org_name?: string;
  plan_id: string;
  plan_name?: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  is_manual: boolean;
  notes?: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Category {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  color?: string;
  equipment_count?: number;
  created_at: string;
}

export interface Equipment {
  id: string;
  org_id: string;
  category_id?: string;
  category_name?: string;
  name: string;
  description?: string;
  serial_number?: string;
  status: EquipmentStatus;
  condition?: string;
  location?: string;
  pricing_model: PricingModel;
  daily_rate?: number;
  hourly_rate?: number;
  purchase_price?: number;
  purchase_date?: string;
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  status: 'active' | 'inactive';
  total_bookings?: number;
  total_spent?: number;
  created_at: string;
}

export interface Booking {
  id: string;
  org_id: string;
  equipment_id: string;
  equipment_name?: string;
  customer_id: string;
  customer_name?: string;
  user_id?: string;
  user_name?: string;
  start_date: string;
  end_date: string;
  pricing_model: PricingModel;
  daily_rate?: number;
  hourly_rate?: number;
  estimated_hours?: number;
  total_amount?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  status: BookingStatus;
  notes?: string;
  created_at: string;
}

export interface Penalty {
  id: string;
  org_id: string;
  booking_id: string;
  equipment_name?: string;
  customer_name?: string;
  type: 'late_return' | 'damage' | 'other';
  amount: number;
  description?: string;
  status: 'pending' | 'paid' | 'waived';
  created_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  org_id: string;
  equipment_id: string;
  equipment_name?: string;
  title: string;
  description?: string;
  scheduled_date: string;
  completed_date?: string;
  cost?: number;
  status: MaintenanceStatus;
  notes?: string;
  created_at: string;
}

export interface ConditionReport {
  id: string;
  org_id: string;
  equipment_id: string;
  equipment_name?: string;
  reported_by: string;
  reporter_name?: string;
  damage_level: DamageLevel;
  description: string;
  repair_required: boolean;
  repair_cost?: number;
  photos?: string[];
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  type: 'booking' | 'maintenance' | 'block';
  title: string;
  start_date: string;
  end_date: string;
  status?: string;
  equipment_name?: string;
  customer_name?: string;
}

export interface DashboardStats {
  total_equipment: number;
  available_equipment: number;
  active_bookings: number;
  month_revenue: number;
  pending_penalties: number;
  maintenance_alerts: number;
  recent_bookings: Booking[];
  upcoming_maintenance: MaintenanceSchedule[];
}
