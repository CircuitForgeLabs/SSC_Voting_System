/**
 * validation.js
 * -----------------------------------------------------------------------
 * Pure functions that check voting rules. Kept separate from vote.js so
 * the rules are easy to find, read, and unit-test on their own.
 * -----------------------------------------------------------------------
 */

const Validation = {
  /** A student number must be non-empty and contain no spaces. */
  isValidStudentNumberFormat(value) {
    return typeof value === "string" && value.trim().length > 0 && !/\s/.test(value.trim());
  },

  /**
   * Checks that every position has been voted on, and that the number
   * of selections per position does not exceed its max_votes.
   * `selections` is a Map<position_id, Set<candidate_id>>.
   * Returns { valid: boolean, message?: string }.
   */
  validateSelections(positions, selections) {
    for (const position of positions) {
      const chosen = selections.get(position.id) || new Set();

      if (chosen.size === 0) {
        return {
          valid: false,
          message: `Please select at least one candidate for ${position.position_name}.`,
        };
      }

      if (chosen.size > position.max_votes) {
        return {
          valid: false,
          message: `You may select at most ${position.max_votes} candidate(s) for ${position.position_name}.`,
        };
      }
    }
    return { valid: true };
  },

  /** Flattens the selections map into a plain array of candidate IDs. */
  flattenSelections(selections) {
    const ids = [];
    for (const set of selections.values()) ids.push(...set);
    return ids;
  },
};
