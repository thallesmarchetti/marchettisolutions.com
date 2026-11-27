'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Cpu, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    const supabase = createClient();
    const requestedNext = new URLSearchParams(window.location.search).get('next');
    const next = requestedNext === '/admin' ? '/admin' : '/client';
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password&after=${next}`,
    });

    setIsSubmitting(false);
    if (resetError) {
      setError('Não foi possível enviar o e-mail. Confira o endereço e tente novamente.');
      return;
    }

    setMessage('Se houver uma conta para este e-mail, enviaremos um link para redefinir a senha.');
  }

  return (
    <main className="min-h-screen bg-[#07090e] px-6 py-8 text-white sm:px-10 flex flex-col">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/?view=login" className="flex items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-white sm:text-sm">
          <ArrowLeft size={16} /> Voltar para o login
        </Link>
        <span className="text-xs text-zinc-600">PT</span>
      </div>

      <section className="my-auto w-full max-w-md mx-auto py-12">
        <div className="rounded-3xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] p-[1px] shadow-[0_25px_80px_-15px_rgba(37,99,235,0.3)]">
          <div className="rounded-[23px] bg-[#090b10] p-8 sm:p-10">
            <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-400/20 to-blue-600/20 text-sky-400">
              <Cpu size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Esqueceu a senha?</h1>
            <p className="mt-2 text-sm text-zinc-400">Informe o e-mail da sua conta para receber um link de redefinição.</p>
            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="block text-xs font-medium text-zinc-300" htmlFor="email">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 text-zinc-500" size={18} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-sky-400"
                />
              </div>
              {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
              {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
              <button disabled={isSubmitting} className="w-full rounded-xl bg-white px-4 py-3.5 font-semibold text-zinc-950 transition-colors hover:bg-sky-50 disabled:opacity-60">
                {isSubmitting ? 'Enviando…' : 'Enviar link de redefinição'}
              </button>
            </form>
          </div>
        </div>
      </section>
      <p className="text-center text-xs text-zinc-600">© 2026 Marchetti Solutions. Todos os direitos reservados.</p>
    </main>
  );
}
