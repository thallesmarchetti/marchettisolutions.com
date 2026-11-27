import { NextResponse, type NextRequest } from 'next/server';
import { getAuthCallbackDestination } from '@/lib/authCallbackDestination.mjs';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const after = requestUrl.searchParams.get('after');
  const destination = getAuthCallbackDestination(next, after);

  if (!code) {
    return NextResponse.redirect(new URL('/?auth=link-error', requestUrl.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL('/?auth=link-error', requestUrl.origin));
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
