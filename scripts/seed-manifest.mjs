/**
 * Canonical one-off demo seed order for remote Supabase.
 * Used by run-all-remote-seeds.mjs and supabase-seed-demo-data.yml (manual only).
 */

export const REMOTE_SEED_FILES = [
  "supabase/seed.sql",
  "supabase/seed-entities.sql",
  "supabase/seed-employees.sql",
  "supabase/seed-access.sql",
  "supabase/seed-locations.sql",
  "supabase/seed-org-structure.sql",
  "supabase/seed-org-structure-bulk.sql",
  "supabase/seed-incidents.sql",
  "supabase/seed-tasks.sql",
  "supabase/seed-task-automation.sql",
  "supabase/seed-ai.sql",
  "supabase/seed-clients-bulk.sql",
];
