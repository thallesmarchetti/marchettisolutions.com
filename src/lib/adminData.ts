'use client';

import { createClient } from '@/lib/supabase/client';

export const ADMIN_DATA_KEYS = [
  'marchetti_admin_read_notifs',
  'marchetti_exchange_history',
  'marchetti_contracts',
  'marchetti_entries',
  'marchetti_services',
  'marchetti_settings',
] as const;

export type AdminDataKey = (typeof ADMIN_DATA_KEYS)[number];

export async function saveAdminData(key: AdminDataKey, value: unknown) {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: new Error('Sessão administrativa expirada.') };

  const { error } = await supabase.from('admin_data').upsert({
    key,
    value,
    updated_by: authData.user.id,
    updated_at: new Date().toISOString(),
  },
  { onConflict: 'key' }
);
  if (error) console.error(`Não foi possível salvar ${key} no banco.`, error.message);
  return { error };
}

export function setAdminData(key: AdminDataKey, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  void saveAdminData(key, value);
}

export async function loadAdminData() {
  const supabase = createClient();
  const { data, error } = await supabase.from('admin_data').select('key, value');
  if (error) return { data: [], error };
  return {
    data: (data || []).filter((row) => ADMIN_DATA_KEYS.includes(row.key as AdminDataKey)),
    error: null,
  };
}
