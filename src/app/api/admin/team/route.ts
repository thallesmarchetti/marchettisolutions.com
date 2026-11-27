import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error('Supabase admin API is not configured.');
  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof getAdminClient>, email: string) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
}

async function requireAdministrator() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();

  return profile?.role === 'admin' ? authData.user : null;
}

export async function POST(request: NextRequest) {
  const administrator = await requireAdministrator();
  if (!administrator) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = ['client', 'admin', 'technician'].includes(body?.role) ? body.role as string : null;
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!name || !email || !role) return NextResponse.json({ error: 'Informe nome, e-mail e papel válidos.' }, { status: 400 });

  try {
    const adminClient = getAdminClient();
    if (role === 'admin' || role === 'technician') {
      let user: Awaited<ReturnType<typeof findAuthUserByEmail>> = null;
      let linkedExisting = false;
      if (password) {
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: name },
        });

        if (!error && data.user) {
          user = data.user;
        } else if (error) {
          user = await findAuthUserByEmail(adminClient, email);
          if (!user) return NextResponse.json({ error: error.message }, { status: 400 });
          linkedExisting = true;
        } else {
          return NextResponse.json({ error: 'Não foi possível criar a conta do colaborador.' }, { status: 500 });
        }
      } else {
        user = await findAuthUserByEmail(adminClient, email);
        if (!user) {
          return NextResponse.json({ error: 'Informe uma senha inicial para criar uma conta nova.' }, { status: 400 });
        }
        linkedExisting = true;
      }

      if (linkedExisting) {
        const { data: existingProfile, error: profileLookupError } = await adminClient
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();
        if (profileLookupError) {
          console.error('Falha ao consultar perfil do usuário existente.', profileLookupError);
          return NextResponse.json({ error: 'Não foi possível verificar o perfil do usuário.' }, { status: 500 });
        }
        if (existingProfile) {
          return NextResponse.json({ error: 'Este e-mail já possui um perfil no sistema.' }, { status: 409 });
        }

        if (!user.email_confirmed_at) {
          const { error: confirmationError } = await adminClient.auth.admin.updateUserById(user.id, { email_confirm: true });
          if (confirmationError) return NextResponse.json({ error: confirmationError.message }, { status: 400 });
        }
      }

      if (!user) return NextResponse.json({ error: 'Não foi possível criar a conta do colaborador.' }, { status: 500 });

      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: user.id,
        email,
        display_name: name,
        role,
      }, { onConflict: 'id' });
      if (profileError) {
        console.error('Conta criada, mas o perfil da equipe não foi salvo.', profileError);
        return NextResponse.json({ error: 'A conta foi criada, mas não foi possível salvar o perfil.' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, userId: user.id, linkedExisting });
    }

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { display_name: name, phone: typeof body.phone === 'string' ? body.phone : '' },
      redirectTo: `${request.nextUrl.origin}/auth/callback?next=${role === 'client' ? '/client' : '/admin'}`,
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message || 'Falha ao enviar convite.' }, { status: 400 });

    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        display_name: name,
        role,
        ...(role === 'client' && body.clientData && typeof body.clientData === 'object'
          ? { client_data: body.clientData }
          : {}),
      })
      .eq('id', data.user.id);
    if (profileError) return NextResponse.json({ error: 'Convite enviado, mas não foi possível definir o papel.' }, { status: 500 });

    return NextResponse.json({ ok: true, userId: data.user.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao convidar colaborador.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const administrator = await requireAdministrator();
  if (!administrator) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === 'string' ? body.userId : '';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const requestedRole = ['admin', 'technician'].includes(body?.role) ? body.role as 'admin' | 'technician' : null;
  const clientData = body?.clientData && typeof body.clientData === 'object' ? body.clientData : {};
  if (!userId || !name || !email) return NextResponse.json({ error: 'Informe nome, e-mail e usuário válidos.' }, { status: 400 });

  try {
    const adminClient = getAdminClient();
    const { data: existing, error: lookupError } = await adminClient
      .from('profiles')
      .select('email, role')
      .eq('id', userId)
      .maybeSingle();
    if (lookupError) {
      console.error('Falha ao consultar perfil da equipe.', lookupError);
      return NextResponse.json({ error: 'Não foi possível consultar o perfil do usuário.' }, { status: 500 });
    }
    if (!existing) {
      if (!requestedRole) return NextResponse.json({ error: 'Perfil do usuário não encontrado.' }, { status: 404 });

      const { data: authData, error: authLookupError } = await adminClient.auth.admin.getUserById(userId);
      if (authLookupError) {
        console.error('Falha ao consultar usuário no Auth.', authLookupError);
        return NextResponse.json({ error: 'Não foi possível consultar a conta do usuário.' }, { status: 500 });
      }
      if (!authData.user) return NextResponse.json({ error: 'Usuário não encontrado no Auth.' }, { status: 404 });

      const userChanges: { email?: string; password?: string } = {};
      if (authData.user.email?.toLowerCase() !== email) userChanges.email = email;
      if (password) userChanges.password = password;
      if (Object.keys(userChanges).length > 0) {
        const { error } = await adminClient.auth.admin.updateUserById(userId, userChanges);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: userId,
        email,
        display_name: name,
        role: requestedRole,
      }, { onConflict: 'id' });
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
      return NextResponse.json({ ok: true, profileRepaired: true });
    }

    if (existing.role === 'admin' || existing.role === 'technician') {
      const userChanges: { email?: string; password?: string } = {};
      if (existing.email.toLowerCase() !== email) userChanges.email = email;
      if (password) userChanges.password = password;

      if (Object.keys(userChanges).length > 0) {
        const { error } = await adminClient.auth.admin.updateUserById(userId, userChanges);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }

      const { error } = await adminClient
        .from('profiles')
        .update({ display_name: name, email })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }

    if (existing.role !== 'client' || password) {
      return NextResponse.json({ error: 'Este usuário não pode ser editado por esta operação.' }, { status: 400 });
    }

    if (existing.email.toLowerCase() !== email) {
      const { error } = await adminClient.auth.admin.updateUserById(userId, { email });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { error } = await adminClient.from('profiles').update({
      display_name: name,
      phone,
      client_data: clientData,
    }).eq('id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar cliente.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const administrator = await requireAdministrator();
  if (!administrator) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === 'string' ? body.userId : '';
  if (!userId) return NextResponse.json({ error: 'Identificador inválido.' }, { status: 400 });
  if (userId === administrator.id) return NextResponse.json({ error: 'Não é possível remover a própria conta.' }, { status: 400 });

  try {
    const { error } = await getAdminClient().auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao remover colaborador.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
