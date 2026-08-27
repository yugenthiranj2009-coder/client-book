import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '../../../lib/supabase-server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: clients, error } = await supabase
    .from('clients')
    .select('*')
    .eq('appt_date', today)
    .is('reminder_sent_for', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const client of clients || []) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: client.email,
        subject: 'Reminder: your massage appointment today',
        text: `Hi ${client.name},\n\nThis is a reminder about your massage appointment today.\n\nFocus area: ${client.problem}\n\nSee you soon!`,
      });
      await supabase.from('clients').update({ reminder_sent_for: today }).eq('id', client.id);
      sent += 1;
    } catch (err) {
      console.error(`Failed to email client ${client.id}`, err);
    }
  }

  return NextResponse.json({ sent, checked: (clients || []).length });
}
