import { createClient } from '../../../lib/supabase-server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { clientId } = await request.json();

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single();

  if (error || !client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const apptDate = new Date(client.appt_date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: client.email,
      subject: 'Reminder: your massage appointment today',
      text: `Hi ${client.name},\n\nThis is a reminder about your massage appointment today (${apptDate}).\n\nFocus area: ${client.problem}\n\nSee you soon!`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Could not send email' }, { status: 500 });
  }

  await supabase.from('clients').update({ reminder_sent_for: client.appt_date }).eq('id', clientId);

  return NextResponse.json({ ok: true });
}
