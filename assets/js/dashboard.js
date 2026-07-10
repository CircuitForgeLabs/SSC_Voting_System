/**
 * dashboard.js
 * -----------------------------------------------------------------------
 * Live election dashboard. Loads positions, candidates, and votes, tallies
 * results client-side, renders ranked cards + progress bars, and re-tallies
 * automatically whenever Supabase Realtime reports a change to `votes` or
 * `students`.
 * -----------------------------------------------------------------------
 */

const Dashboard = {
  positions: [],
  candidates: [],
  votes: [],
  totalStudents: 0,
  votedCount: 0,

  els: {},

  init() {
    this.els = {
      totalVotesCast: document.getElementById("stat-total-votes"),
      remainingVoters: document.getElementById("stat-remaining"),
      turnout: document.getElementById("stat-turnout"),
      turnoutBar: document.getElementById("turnout-bar"),
      resultsContainer: document.getElementById("results-container"),
      lastUpdated: document.getElementById("last-updated"),
    };

    this.loadAll();
    DataAPI.subscribeToTable("votes", () => this.loadAll());
    DataAPI.subscribeToTable("students", () => this.loadAll());
    DataAPI.subscribeToTable("candidates", () => this.loadAll());
  },

  async loadAll() {
    try {
      const [positions, candidates, votes, totalStudents, votedCount] = await Promise.all([
        DataAPI.getPositions(),
        DataAPI.getCandidates(),
        DataAPI.getAllVotes(),
        DataAPI.getTotalStudents(),
        DataAPI.getVotedCount(),
      ]);
      this.positions = positions;
      this.candidates = candidates;
      this.votes = votes;
      this.totalStudents = totalStudents;
      this.votedCount = votedCount;

      this.renderStats();
      this.renderResults();
      this.els.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    } catch (err) {
      console.error(err);
      Utils.showDialog("Could not refresh dashboard data.", "error");
    }
  },

  renderStats() {
    const remaining = Math.max(this.totalStudents - this.votedCount, 0);
    const turnout = this.totalStudents > 0 ? (this.votedCount / this.totalStudents) * 100 : 0;

    Utils.animateCount(this.els.totalVotesCast, this.votedCount);
    Utils.animateCount(this.els.remainingVoters, remaining);
    this.els.turnout.textContent = `${turnout.toFixed(1)}%`;
    this.els.turnoutBar.style.width = `${turnout.toFixed(1)}%`;
  },

  tallyVotesByCandidate() {
    const counts = new Map();
    for (const vote of this.votes) {
      counts.set(vote.candidate_id, (counts.get(vote.candidate_id) || 0) + 1);
    }
    return counts;
  },

  renderResults() {
    const counts = this.tallyVotesByCandidate();
    const candidatesByPosition = Utils.groupBy(this.candidates, (c) => c.position_id);

    this.els.resultsContainer.innerHTML = this.positions
      .map((position) => {
        const candidates = (candidatesByPosition[position.id] || [])
          .map((c) => ({ ...c, votes: counts.get(c.id) || 0 }))
          .sort((a, b) => b.votes - a.votes);

        const maxVotes = candidates.length ? candidates[0].votes : 0;
        const totalPositionVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

        return `
          <section class="result-block">
            <h3 class="result-block__title">${Utils.escapeHTML(position.position_name)}</h3>
            <ol class="rank-list">
              ${candidates
                .map((c, i) => {
                  const share = totalPositionVotes > 0 ? (c.votes / totalPositionVotes) * 100 : 0;
                  const isLeader = i === 0 && c.votes > 0 && c.votes === maxVotes;
                  return `
                  <li class="rank-item ${isLeader ? "rank-item--leader" : ""}">
                    <span class="rank-item__place">${i + 1}</span>
                    <img class="rank-item__photo" src="${c.photo_url || "assets/images/placeholder.svg"}" alt="" />
                    <div class="rank-item__info">
                      <div class="rank-item__name-row">
                        <span class="rank-item__name">${Utils.escapeHTML(c.full_name)}</span>
                        ${isLeader ? '<span class="leader-badge">Leading</span>' : ""}
                      </div>
                      <div class="rank-item__bar-track">
                        <div class="rank-item__bar-fill" style="width:${share.toFixed(1)}%"></div>
                      </div>
                    </div>
                    <span class="rank-item__votes">${c.votes.toLocaleString()}</span>
                  </li>
                `;
                })
                .join("")}
            </ol>
          </section>
        `;
      })
      .join("");
  },
};

document.addEventListener("DOMContentLoaded", () => Dashboard.init());
