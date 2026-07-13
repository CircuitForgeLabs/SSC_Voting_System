/**
 * supabase.js
 * -----------------------------------------------------------------------
 * Creates the shared Supabase client and exposes small, reusable data
 * functions used by both vote.js and dashboard.js. Nothing in here is
 * page-specific; keep page logic out of this file.
 * -----------------------------------------------------------------------
 */

// The Supabase SDK is loaded via <script> tag (see the CDN import in each
// HTML file), which exposes a global `supabase` factory function.
const db = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

const DataAPI = {
  /** All active positions, in display order. */
  async getPositions() {
    const { data, error } = await db
      .from("positions")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data;
  },

  /** All active candidates, in display order. */
  async getCandidates() {
    const { data, error } = await db
      .from("candidates")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data;
  },

  /**
   * Looks up one student by student number, via the `students_lookup`
   * view (exposes only student_number + has_voted — never the full
   * students table) so the anon key can verify eligibility without being
   * able to read anything else. Returns null if not found.
   */
  async findStudent(studentNumber) {
    const { data, error } = await db
      .from("students_lookup")
      .select("*")
      .eq("student_number", studentNumber)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Casts a ballot: inserts one row per selected candidate into `votes`
   * and flips the student's has_voted flag, via a single database
   * function so the operation is atomic (see sql/02_functions.sql).
   */
  async castVote(studentNumber, candidateIds) {
    const { data, error } = await db.rpc("cast_vote", {
      p_student_number: studentNumber,
      p_candidate_ids: candidateIds,
    });
    if (error) throw error;
    return data;
  },

  /** Total number of registered students. */
  async getTotalStudents() {
    const { count, error } = await db
      .from("students_lookup")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },

  /** Number of students who have already voted. */
  async getVotedCount() {
    const { count, error } = await db
      .from("students_lookup")
      .select("*", { count: "exact", head: true })
      .eq("has_voted", true);
    if (error) throw error;
    return count ?? 0;
  },

  /**
   * Vote tallies, read from the `votes_public` view (candidate_id +
   * position_id only — never student_number) so ballots stay secret
   * even though results are public in realtime.
   */
  async getAllVotes() {
    const { data, error } = await db.from("votes_public").select("candidate_id, position_id");
    if (error) throw error;
    return data;
  },

  /** Subscribes to realtime changes on a table. Returns the channel so
   *  the caller can unsubscribe later if needed. */
  subscribeToTable(table, onChange) {
    return db
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, onChange)
      .subscribe();
  },
};
