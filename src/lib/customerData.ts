'use client';

import { createClient } from '@/lib/supabase/client';

export type CustomerRecordKind = 'ticket' | 'invoice';
export type CustomerRecord = Record<string, any>;

export async function saveCustomerRecord(kind: CustomerRecordKind, record: CustomerRecord) {
  const supabase = createClient();
  const email = String(record.clientEmail || '').trim().toLowerCase();
  if (!email) return { error: new Error('Este registro precisa estar vinculado ao e-mail de um cliente.') };

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();
  if (profileError || !profile) {
    return { error: profileError || new Error('O cliente ainda não possui uma conta confirmada no portal.') };
  }

  const { error } = await supabase.from('customer_records').upsert({
    owner_id: profile.id,
    kind,
    app_id: String(record.id),
    data: record,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'owner_id,kind,app_id' });
  return { error };
}

export async function updateCustomerRecord(kind: CustomerRecordKind, record: CustomerRecord) {
  const supabase = createClient();
  const { error } = await supabase.from('customer_records')
    .update({ data: record, updated_at: new Date().toISOString() })
    .eq('kind', kind)
    .eq('app_id', String(record.id));
  return { error };
}

export async function deleteCustomerRecord(kind: CustomerRecordKind, recordId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('customer_records')
    .delete()
    .eq('kind', kind)
    .eq('app_id', recordId);
  return { error };
}
