/* ==========================================================================
   MALIZIA — Supabase client
   Fill in your project URL + anon key below (from Supabase Project Settings
   -> API). The anon key is safe to expose in the browser: real security
   comes from the Row Level Security policies defined in schema.sql.
   ========================================================================== */

const SUPABASE_URL = "https://hllcgyjwpoaggqlvfzun.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbGNneWp3cG9hZ2dxbHZmenVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyODE2NTksImV4cCI6MjA5ODg1NzY1OX0.MSQ9NJlN8mFxsXI886kuWcO0u6oRJAMDXFfwmN6HIkE";

let sb = null;
let SUPABASE_READY = false;

try {
  if (
    window.supabase &&
    SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
    SUPABASE_ANON_KEY.indexOf("YOUR-ANON-PUBLIC-KEY") === -1
  ) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    SUPABASE_READY = true;
  }
} catch (e) {
  console.warn("Supabase client not initialised:", e);
}

// Storage bucket name used for product images (see schema.sql)
const PRODUCT_BUCKET = "product-images";

/**
 * Small helper so every page can work in "demo mode" (no Supabase configured
 * yet) using local sample data, and switch to live mode automatically the
 * moment real credentials are added above.
 */
function isDemoMode() {
  return !SUPABASE_READY;
}
