import { createClient } from '@supabase/supabase-js';

export const AUTH_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://gngzxxivnsanbmqizdgo.supabase.co';
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_ec793prvOcdrz_76wd8k8A_bEaKYKdU';

const runtime = globalThis as typeof globalThis & {
  __gulfInvoiceAuth?: ReturnType<typeof createClient>;
};

export const auth =
  runtime.__gulfInvoiceAuth ??
  (runtime.__gulfInvoiceAuth = createClient(AUTH_URL, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }));
