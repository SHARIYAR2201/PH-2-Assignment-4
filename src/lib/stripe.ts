import Stripe from 'stripe';
import { env } from '../config/env';

export const stripe = new Stripe(env.stripe.secretKey || 'sk_test_placeholder', {
  apiVersion: '2026-06-24.dahlia',
});
