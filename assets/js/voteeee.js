/**
 * vote.js
 * -----------------------------------------------------------------------
 * Controls the student voting page:
 * 1. Student number entry + verification screen
 * 2. Ballot screen (candidates loaded from Supabase, grouped by position)
 * 3. Review + confirm + submit
 * 4. "Thank you" locked screen
 * -----------------------------------------------------------------------
 */

const VoteApp = {
  student: null, // the verified student row
  positions: [],
  candidates: [],
  selections: new Map(), // position_id -> Set<candidate_id>

  els: {},

  init() {
    this.els = {
      lookupForm: document.getElementById("lookup-form"),
      studentNumberInput: document.getElementById("student-number"),
      lookupSection: document.getElementById("section-lookup"),
      ballotSection: document.getElementById("section-ballot"),
      thankyouSection: document.getElementById("section-thankyou"),
      ballotContainer: document.getElementById("ballot-container"),
      submitBtn: document.getElementById("submit-vote-btn"),
      studentBadge: document.getElementById("student-badge"),
    };

    this.els.lookupForm.addEventListener("submit", (e) => this.handleLookup(e));
    this.els.submitBtn.addEventListener("click", () => this.handleSubmit());
  },

  async handleLookup(event) {
    event.preventDefault();
    const raw = this.els.studentNumberInput.value.trim();

    if (!Validation.isValidStudentNumberFormat(raw)) {
      Utils.showDialog("Please enter a valid student number.", "error");
      return;
    }

    Utils.setLoading(true, "Verifying student number...");
    try {
      const student = await DataAPI.findStudent(raw);

      if (!student) {
        Utils.showDialog("Student number not found. Please check and try again.", "error");
        return;
      }
      if (student.has_voted) {
        Utils.showDialog("This student number has already voted.", "error");
        return;
      }

      this.student = student;
      await this.loadBallot();
    } catch (err) {
      console.error(err);
      Utils.showDialog("Something went wrong while verifying. Please try again.", "error");
    } finally {
      Utils.setLoading(false);
    }
  },

  async loadBallot() {
    Utils.setLoading(true, "Loading candidates...");
    try {
      const [positions, candidates] = await Promise.all([
        DataAPI.getPositions(),
        DataAPI.getCandidates(),
      ]);
      this.positions = positions;
      this.candidates = candidates;
      this.selections = new Map(positions.map((p) => [p.id, new Set()]));

      this.renderBallot();
      this.els.studentBadge.textContent = `Student No. ${this.student.student_number}`;
      this.els.lookupSection.classList.add("is-hidden");
      this.els.ballotSection.classList.remove("is-hidden");
    } catch (err) {
      console.error(err);
      Utils.showDialog("Could not load the ballot. Please refresh and try again.", "error");
    } finally {
      Utils.setLoading(false);
    }
  },

  renderBallot() {
    const byPosition = Utils.groupBy(this.candidates, (c) => c.position_id);
    this.els.ballotContainer.innerHTML = this.positions
      .map((position) => {
        const candidates = byPosition[position.id] || [];
        const limitLabel =
          position.max_votes === 1 ? "Select 1" : `Select up to ${position.max_votes}`;

        return `
          <fieldset class="position-block" data-position-id="${position.id}">
            <legend>
              <span class="position-block__name">${Utils.escapeHTML(position.position_name)}</span>
              <span class="position-block__limit">${limitLabel}</span>
            </legend>
            <div class="candidate-grid">
              ${candidates
                .map(
                  (c) => `
                <label class="candidate-card" data-candidate-id="${c.id}">
                  <input type="checkbox" name="position-${position.id}" value="${c.id}" class="candidate-card__input" />
                  <img class="candidate-card__photo" src="${c.photo_url || "assets/images/placeholder.svg"}" alt="${Utils.escapeHTML(c.full_name)}" loading="lazy" />
                  <div class="candidate-card__body">
                    <h4>${Utils.escapeHTML(c.full_name)}</h4>
                    <p class="candidate-card__party">${Utils.escapeHTML(c.party_list || "Independent")}</p>
                    <p class="candidate-card__meta">${Utils.escapeHTML(c.course || "")} ${c.year_level ? "· " + Utils.escapeHTML(c.year_level) : ""}</p>
                  </div>
                  <span class="candidate-card__check" aria-hidden="true"></span>
                </label>
              `
                )
                .join("")}
            </div>
          </fieldset>
        `;
      })
      .join("");

    this.els.ballotContainer.addEventListener("change", (e) => this.handleSelectionChange(e));
  },

  handleSelectionChange(event) {
    const input = event.target;
    if (!input.matches(".candidate-card__input")) return;

    const positionBlock = input.closest(".position-block");
    const positionId = Number(positionBlock.dataset.positionId);
    const candidateId = Number(input.value);
    const position = this.positions.find((p) => p.id === positionId);
    const chosen = this.selections.get(positionId);

    if (input.checked) {
      if (chosen.size >= position.max_votes) {
        input.checked = false;
        Utils.showDialog(
          `You can only select ${position.max_votes} candidate(s) for ${position.position_name}.`,
          "error"
        );
        return;
      }
      chosen.add(candidateId);
    } else {
      chosen.delete(candidateId);
    }

    input.closest(".candidate-card").classList.toggle("candidate-card--selected", input.checked);
  },

  async handleSubmit() {
    const result = Validation.validateSelections(this.positions, this.selections);
    if (!result.valid) {
      Utils.showDialog(result.message, "error");
      return;
    }

    const confirmed = await Utils.confirmDialog(
      "Confirm your vote",
      "Once submitted, your vote cannot be changed. Are you sure you want to submit?",
      "Submit vote"
    );
    if (!confirmed) return;

    const candidateIds = Validation.flattenSelections(this.selections);

    Utils.setLoading(true, "Submitting your vote...");
    try {
      await DataAPI.castVote(this.student.student_number, candidateIds);
      this.els.ballotSection.classList.add("is-hidden");
      this.els.thankyouSection.classList.remove("is-hidden");
    } catch (err) {
      console.error(err);
      Utils.showDialog(
        "We could not submit your vote. If you already voted, this ballot is locked.",
        "error"
      );
    } finally {
      Utils.setLoading(false);
    }
  },
};

document.addEventListener("DOMContentLoaded", () => VoteApp.init());
