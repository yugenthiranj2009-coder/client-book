import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '../../../lib/supabase-server';

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = createAdminClient();

  async function setStatusBySubscription(subId, status) {
    await supabase.from('profiles').update({ subscription_status: status }).eq('stripe_customer_id', subId);
  }

  const entity = event.payload?.subscription?.entity;

  switch (event.event) {
    case 'subscription.activated':
    case 'subscription.charged':
      if (entity) await setStatusBySubscription(entity.id, 'active');
      break;
    case 'subscription.cancelled':
    case 'subscription.completed':
    case 'subscription.halted':
      if (entity) await setStatusBySubscription(entity.id, 'free');
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
