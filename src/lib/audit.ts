import { createClient } from '@/lib/supabase/client';

export type AuditDetails = Record<string, unknown>;

export function logAuditEvent(action: string, details: AuditDetails = {}): void {
  if (typeof window === 'undefined') return;

  const supabase = createClient();
  void supabase.auth.getUser().then(async ({ data }) => {
    if (!data.user) return;
    const { error } = await supabase.from('audit_events').insert({
      actor_id: data.user.id,
      action,
      details,
    });
    if (error) console.error('Não foi possível registrar evento de auditoria.', error.message);
  }).catch((error: unknown) => {
    console.error('Não foi possível registrar evento de auditoria.', error);
  });
}
