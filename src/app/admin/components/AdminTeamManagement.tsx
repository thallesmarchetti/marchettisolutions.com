'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2, Users, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type TeamMember = {
  id: string;
  display_name: string;
  email: string;
  role: 'admin' | 'technician';
};

type AdminTeamManagementProps = {
  currentAdmin: Pick<TeamMember, 'id'> | null;
  onNotify: (message: string, type?: string) => void;
};

export default function AdminTeamManagement({ currentAdmin, onNotify }: AdminTeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: '', email: '', password: '', role: 'technician' as TeamMember['role'] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadMembers = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .in('role', ['admin', 'technician'])
      .order('display_name');

    if (error) onNotify('Não foi possível carregar a equipe.', 'error');
    else setMembers(data || []);
    setIsLoading(false);
  }, [onNotify]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  async function handleAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMember, email: newMember.email.trim().toLowerCase() }),
      });
      const result = await response.json();
      if (!response.ok) {
        onNotify(result.error || 'Não foi possível criar o perfil do colaborador.', 'error');
        return;
      }

      setNewMember({ name: '', email: '', password: '', role: 'technician' });
      onNotify(
        result.linkedExisting
          ? 'Perfil de equipe criado para a conta existente. A senha atual foi preservada.'
          : 'Conta e perfil do colaborador criados.',
        'success'
      );
      await loadMembers();
    } catch (error) {
      console.error('Não foi possível criar o perfil do colaborador.', error);
      onNotify('Não foi possível criar o perfil do colaborador. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(member: TeamMember) {
    setIsRemoving(true);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: member.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        onNotify(result.error || 'Não foi possível remover o colaborador.', 'error');
        return;
      }

      setMemberToRemove(null);
      onNotify('Colaborador removido.', 'success');
      await loadMembers();
    } catch (error) {
      console.error('Não foi possível remover o colaborador.', error);
      onNotify('Não foi possível remover o colaborador. Tente novamente.', 'error');
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleUpdateMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingMember) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingMember.id,
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          role: editingMember.role,
          ...(editForm.password ? { password: editForm.password } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        onNotify(result.error || 'Não foi possível atualizar o colaborador.', 'error');
        return;
      }

      setEditingMember(null);
      setEditForm({ name: '', email: '', password: '' });
      onNotify('Dados do colaborador atualizados.', 'success');
      await loadMembers();
    } catch (error) {
      console.error('Não foi possível atualizar o colaborador.', error);
      onNotify('Não foi possível atualizar o colaborador. Tente novamente.', 'error');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section aria-labelledby="admin-team-heading">
      <h3 id="admin-team-heading" className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-3 text-base font-bold text-gray-800 dark:border-slate-800 dark:text-gray-100">
        <Users size={18} className="text-[#2b88c4]" /> Administradores e Técnicos
      </h3>
      <div className="mb-5 space-y-3">
        {isLoading && <p className="text-sm text-gray-500">Carregando equipe…</p>}
        {!isLoading && members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold">{member.display_name || member.email} <span className="text-xs text-gray-500">· {member.role === 'admin' ? 'Administrador' : 'Técnico'}</span></p>
              <p className="text-xs text-gray-500">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingMember(member);
                  setEditForm({ name: member.display_name, email: member.email, password: '' });
                }}
                aria-label={`Editar ${member.display_name || member.email}`}
                title="Editar colaborador"
                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
              >
                <Pencil size={16} />
              </button>
              {member.id !== currentAdmin?.id && (
                <button
                  type="button"
                  onClick={() => setMemberToRemove(member)}
                  aria-label={`Remover ${member.display_name || member.email}`}
                  title="Remover colaborador"
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleAddMember} className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input aria-label="Nome do colaborador" placeholder="Nome" required value={newMember.name} onChange={(event) => setNewMember({ ...newMember, name: event.target.value })} className="rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800" />
        <input aria-label="E-mail do colaborador" type="email" placeholder="E-mail" required value={newMember.email} onChange={(event) => setNewMember({ ...newMember, email: event.target.value })} className="rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800" />
        <input aria-label="Senha inicial" type="password" autoComplete="new-password" placeholder="Senha inicial (opcional p/ conta existente)" value={newMember.password} onChange={(event) => setNewMember({ ...newMember, password: event.target.value })} className="rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800" />
        <select aria-label="Nível de permissão" value={newMember.role} onChange={(event) => setNewMember({ ...newMember, role: event.target.value as TeamMember['role'] })} className="rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800">
          <option value="technician">Técnico</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {isSubmitting ? 'Criando…' : 'Criar perfil'}
        </button>
        <p className="text-xs text-gray-500 md:col-span-2 xl:col-span-5">
          Uma senha inicial é necessária para uma conta nova. Se o e-mail já existir no Supabase Auth sem perfil, a senha atual será mantida.
        </p>
      </form>

      {editingMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-team-member-heading" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h4 id="edit-team-member-heading" className="text-lg font-bold text-gray-900 dark:text-white">Editar colaborador</h4>
              <button type="button" onClick={() => setEditingMember(null)} aria-label="Fechar" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label htmlFor="team-member-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome</label>
                <input id="team-member-name" required value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800" />
              </div>
              <div>
                <label htmlFor="team-member-email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                <input id="team-member-email" type="email" required value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800" />
              </div>
              <div>
                <label htmlFor="team-member-password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nova senha</label>
                <input id="team-member-password" type="password" autoComplete="new-password" value={editForm.password} onChange={(event) => setEditForm({ ...editForm, password: event.target.value })} className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800" />
                <p className="mt-1 text-xs text-gray-500">Deixe em branco para manter a senha atual.</p>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
                <button type="button" onClick={() => setEditingMember(null)} disabled={isUpdating} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-slate-700 dark:text-gray-300">
                  Cancelar
                </button>
                <button type="submit" disabled={isUpdating} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {isUpdating ? 'Salvando…' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {memberToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="remove-team-member-heading" aria-describedby="remove-team-member-description" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h4 id="remove-team-member-heading" className="text-lg font-bold text-gray-900 dark:text-white">Confirmar remoção</h4>
                <p id="remove-team-member-description" className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Tem certeza que deseja excluir <strong>{memberToRemove.display_name || memberToRemove.email}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
              <button type="button" onClick={() => setMemberToRemove(null)} disabled={isRemoving} aria-label="Fechar" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-60 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => setMemberToRemove(null)} disabled={isRemoving} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-60 dark:border-slate-700 dark:text-gray-300">
                Cancelar
              </button>
              <button type="button" onClick={() => void handleRemove(memberToRemove)} disabled={isRemoving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {isRemoving ? 'Excluindo…' : 'Excluir colaborador'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
