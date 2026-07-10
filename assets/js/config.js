/**
 * config.js
 * -----------------------------------------------------------------------
 * PASTE YOUR SUPABASE CREDENTIALS HERE.
 * You get both values from your Supabase project:
 * Project Settings -> API -> "Project URL" and "anon public" key.
 *
 * This is the ONLY file you need to edit to connect the site to your
 * own Supabase project.
 * -----------------------------------------------------------------------
 */

const SUPABASE_CONFIG = {
  url: "https://bsafwvivdsnoqirgvoun.supabase.co",
  anonKey: "sb_publishable_0OiG8AYGsO9JzDJX8Ey4Zg_R8RPmGUA",
};

// Election display settings (safe to customize)
const ELECTION_CONFIG = {
  schoolName: "Global Academy of Technology and Entrepreneurship Inc.",
  electionTitle: "Supreme Student Council Election",
  electionYear: new Date().getFullYear(),
};
