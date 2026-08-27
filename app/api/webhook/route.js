import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '../../../lib/supabase-server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  async function setStatusByCustomer(customerId, status) {
    await supabase.from('profiles').update({ subscription_status: status }).eq('stripe_customer_id', customerId);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      if (session.customer) await setStatusByCustomer(session.customer, 'active');
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      const status = sub.status === 'active' || sub.status === 'trialing' ? 'active' : sub.status;
      await setStatusByCustomer(sub.customer, status);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await setStatusByCustomer(sub.customer, 'free');
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
