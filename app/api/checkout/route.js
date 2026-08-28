import { createClient } from '../../../lib/supabase-server';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    customer_notify: 1,
    total_count: 120,
    quantity: 1,
    notes: { supabase_user_id: user.id },
  });

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: subscription.id })
    .eq('id', user.id);

  return NextResponse.json({ url: subscription.short_url });
}
