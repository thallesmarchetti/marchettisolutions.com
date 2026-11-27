'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Cpu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError('O link expirou ou não é válido. Solicite uma nova redefinição.');
      return;
    }

    setComplete(true);
  }

  return (
    <main className="min-h-screen bg-[#07090e] px-6 py-8 text-white sm:px-10 flex flex-col">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/forgot-password" className="flex items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-white sm:text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <span className="text-xs text-zinc-600">PT</span>
      </div>

      <section className="my-auto w-full max-w-md mx-auto py-12">
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1px] shadow-[0_25px_80px_-15px_rgba(37,99,235,0.3)]">
          <div className="rounded-[23px] bg-[#090b10] p-8 sm:p-10">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-400/20 to-blue-600/20 text-sky-400">
              <Cpu size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Redefinir senha</h1>
            {complete ? (
              <div className="mt-5 space-y-5">
                <p role="status" className="text-sm text-emerald-300">Senha atualizada. Você já pode entrar com a nova senha.</p>
                <Link href="/?view=login" className="inline-block text-sm font-semibold text-sky-400 hover:text-sky-300">Voltar para o login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block text-xs font-medium text-zinc-300" htmlFor="password">Nova senha</label>
                <input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-sky-400" />
                <label className="block text-xs font-medium text-zinc-300" htmlFor="confirmation">Confirme a nova senha</label>
                <input id="confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-sky-400" />
                {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
                <button disabled={isSubmitting} className="w-full rounded-xl bg-white px-4 py-3.5 font-semibold text-zinc-950 transition-colors hover:bg-sky-50 disabled:opacity-60">
                  {isSubmitting ? 'Salvando…' : 'Salvar nova senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      <p className="text-center text-xs text-zinc-600">© 2026 Marchetti Solutions. Todos os direitos reservados.</p>
    </main>
  );
}
