// ── Backend settings ────────────────────────────────────────────────────────────────
// Leave these empty and everything still works, saved only in each visitor's browser.
// Fill them in to make comments + corkboard notes shared with everyone, and the newsletter real.
//
// Supabase (free): create a project, run backend/supabase.sql in the SQL editor, then copy
// Project Settings → API → "Project URL" and the "anon / publishable" key. That key is meant to
// be public (it ships to every browser; the SQL policies decide what it can do).
// NEVER put the "service_role" / secret key here.
//
// Buttondown (free): your username from buttondown.com (the part in buttondown.com/<username>).
export const BACKEND = {
  supabaseUrl: "",      // e.g. "https://abcd1234.supabase.co"
  supabaseAnonKey: "",  // e.g. "eyJhbGciOi..." or "sb_publishable_..."
  buttondownUser: ""    // e.g. "jasmita"
};
