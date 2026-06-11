import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

function normaliseEncodedSupabaseHash() {
  if (typeof window === "undefined") return;

  const { pathname, search } = window.location;
  if (!pathname.startsWith("/%23")) return;

  const decodedPath = decodeURIComponent(pathname.slice(1));
  if (!decodedPath.startsWith("#access_token=") && !decodedPath.startsWith("#error=")) return;

  window.history.replaceState(null, "", `/${search}${decodedPath}`);
}

normaliseEncodedSupabaseHash();

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

export const apiConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const demoMode = import.meta.env.VITE_DEMO_MODE === "true" || !supabase;
export const authEmailLinksEnabled = import.meta.env.VITE_AUTH_EMAIL_LINKS_ENABLED === "true";
