import { createClient } from '../../lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('appt_date', { ascending: true });

  const limit = parseInt(process.env.FREE_TIER_CLIENT_LIMIT || '5', 10);
  const isPro = profile?.subscription_status === 'active';

  return (
    <DashboardClient
      initialClients={clients || []}
      isPro={isPro}
      limit={limit}
      userEmail={user.email}
    />
  );
}
