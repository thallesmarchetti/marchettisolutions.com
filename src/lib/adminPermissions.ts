const TECHNICIAN_VIEWS = ['chamados', 'clientes'] as const;

export function isSuperAdminRole(role?: string | null): boolean {
  const normalized = role?.trim().toLowerCase();
  return normalized === 'super admin' || normalized === 'super_admin' || normalized === 'admin';
}

export function canAccessAdminView(role: string | null | undefined, view: string): boolean {
  return isSuperAdminRole(role) || TECHNICIAN_VIEWS.includes(view as (typeof TECHNICIAN_VIEWS)[number]);
}

export function getDefaultAdminView(role?: string | null): string {
  return isSuperAdminRole(role) ? 'dashboard' : 'chamados';
}
