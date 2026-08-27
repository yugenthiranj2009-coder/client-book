import { createClient } from '../../../lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const { name, problem, appt_date, email } = body;

  if (!name || !problem || !appt_date || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const isPro = profile?.subscription_status === 'active';
  const limit = parseInt(process.env.FREE_TIER_CLIENT_LIMIT || '5', 10);

  if (!isPro) {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count || 0) >= limit) {
      return NextResponse.json({ error: 'Free tier limit reached. Upgrade to add more clients.' }, { status: 403 });
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: user.id, name, problem, appt_date, email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}
