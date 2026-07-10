# Student Supreme Student Council (SSC) Election Voting System

A complete, browser-only election voting system built with **HTML, CSS, and vanilla JavaScript**, backed by **Supabase** for the database and live updates. No PHP, no Node server, no frameworks — it runs entirely as static files, so it can be hosted for free on **GitHub Pages**.

Students vote using only their **student number** (no password, no account). Results are shown live on a **dashboard** that updates instantly with no page refresh, using Supabase Realtime.

---

## 1. Features

- **No-login voting** — students verify with their student number only.
- **One vote per student**, enforced both in the browser and, more importantly, inside the database itself (so it can't be bypassed).
- **Dynamic candidates and positions** — nothing is hardcoded; add, edit, or remove candidates from Supabase and the site updates automatically.
- **Per-position vote limits** (e.g. "President: pick 1", "Board Members: pick up to 5").
- **Live results dashboard**: total votes, remaining voters, turnout %, per-position rankings with progress bars, a "Leading" badge, and auto-sorting — all updating in real time.
- **Ballot secrecy by design** — the public dashboard can see vote *counts*, but never which student cast which vote (see [Security](#8-security-considerations)).
- Responsive, mobile-friendly design with loading indicators, confirmation dialogs, and success/error messages.

---

## 2. Folder Structure

```
student-election-voting-system/
├── index.html                 # Landing page
├── vote.html                  # Student voting page
├── dashboard.html              # Live results dashboard
├── assets/
│   ├── css/
│   │   ├── style.css          # Shared styles (used by every page)
│   │   ├── vote.css           # Voting page styles
│   │   └── dashboard.css      # Dashboard styles
│   ├── js/
│   │   ├── config.js          # <-- YOU EDIT THIS (Supabase URL + key)
│   │   ├── supabase.js        # Supabase client + data functions
│   │   ├── vote.js            # Voting page logic
│   │   ├── dashboard.js       # Dashboard logic
│   │   ├── validation.js      # Voting rule checks
│   │   └── utils.js           # Shared UI helpers (toasts, modals, loader)
│   └── images/
│       └── placeholder.svg    # Shown when a candidate has no photo
├── sql/
│   ├── 01_schema.sql          # Tables, indexes, views, realtime
│   ├── 02_functions.sql       # The cast_vote() function
│   ├── 03_rls_policies.sql    # Row Level Security policies
│   └── 04_sample_data.sql     # Optional demo positions/candidates/students
├── README.md
├── LICENSE
└── .gitignore
```

---

## 3. How It Works (in plain terms)

Think of Supabase as a database that lives on the internet, which your website talks to directly from the visitor's browser using a public key (like a library card — it lets you read books and use certain approved services, but it doesn't let you rearrange the shelves).

- `positions` and `candidates` tables hold the ballot content. Anyone can *read* them; nobody can edit them except you (from the Supabase dashboard, or an admin tool you build separately).
- `students` holds the voter roll (student numbers + whether they've voted). The public website can only check "does this student number exist, and have they voted?" — it can never read or edit the full table directly.
- `votes` holds one row per candidate selected. Same idea: the public website can only read vote *counts*, never individual ballots.
- All of that write-protection is enforced by **Row Level Security (RLS)** policies and a single database function called `cast_vote()` — even if someone opens their browser's developer console and tries to cheat, the database itself will refuse.

---

## 4. Prerequisites

You don't need to install anything to *run* this project — it's just static files. You only need:

- A free [Supabase](https://supabase.com) account.
- A free [GitHub](https://github.com) account (to host it on GitHub Pages).
- A text editor to open `config.js` (even Notepad works, though [VS Code](https://code.visualstudio.com) is nicer).

---

## 5. Step-by-Step: Connect This Project to Supabase (Beginner Guide)

This section assumes **zero programming background**. Follow it in order.

### Step 1 — Create your Supabase account and project

1. Go to **[supabase.com](https://supabase.com)** and click **Start your project**.
2. Sign up (GitHub sign-in is easiest) and confirm your email if asked.
3. Click **New project**.
4. Fill in:
   - **Name**: anything, e.g. `ssc-election`
   - **Database Password**: click "Generate a password" and **save it somewhere safe** (a notes app is fine — you likely won't need it again, but keep it).
   - **Region**: pick the one closest to your school.
5. Click **Create new project** and wait about a minute while Supabase sets it up.

### Step 2 — Run the database setup scripts

This creates all the tables the website needs.

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `sql/01_schema.sql` from this project (in any text editor), select all the text, copy it, and paste it into the SQL Editor.
4. Click **Run** (bottom right). You should see "Success. No rows returned."
5. Click **New query** again, and repeat steps 3–4 for `sql/02_functions.sql`.
6. Click **New query** again, and repeat for `sql/03_rls_policies.sql`.
7. **Optional but recommended for your first test:** click **New query** one more time and run `sql/04_sample_data.sql`. This adds a few sample positions, candidates, and student numbers so you can try voting immediately.

If any step shows a red error message, read it — it usually means a previous script wasn't run yet, or was pasted incompletely. Re-copy the whole file and try again.

### Step 3 — Get your Project URL and anon key

1. In the left sidebar, click the **gear icon (Project Settings)**.
2. Click **API** (or **API Keys**, depending on Supabase's current layout).
3. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon public** key — a long string of letters and numbers.
4. Keep this browser tab open — you'll copy these in the next step.

> The **anon public** key is meant to be used in a public website's code — that's its job. It is *not* a secret admin password. Never copy the "service_role" key into your website's code, though — that one *is* secret and should never appear in files you upload to GitHub.

### Step 4 — Paste your credentials into the project

1. Open `assets/js/config.js` in your text editor.
2. Replace the placeholder values:

   ```js
   const SUPABASE_CONFIG = {
     url: "https://abcdefghijk.supabase.co",   // paste your Project URL here
     anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6...", // paste your anon public key here
   };
   ```
3. While you're there, you can also set your school's name in `ELECTION_CONFIG` at the bottom of the same file.
4. Save the file.

### Step 5 — Test it on your own computer

You can't just double-click `index.html` — browsers block some features when a page is opened directly from disk. Use a quick local server instead:

- **Easiest option (VS Code):** install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.
- **No VS Code?** If you have Python installed, open a terminal in the project folder and run:
  ```
  python -m http.server 8000
  ```
  then visit `http://localhost:8000` in your browser.

Try the **Vote** page with one of the sample student numbers from `04_sample_data.sql` (e.g. `2023-00101`), and open the **Dashboard** page in another tab to watch the results update live after you submit.

### Step 6 — Put in your real data

Instead of writing code, you add/edit/remove positions, candidates, and students using Supabase's built-in spreadsheet-like editor:

1. In Supabase, click **Table Editor** in the left sidebar.
2. Click the `positions` table. Edit rows or click **Insert row** to add new positions (e.g. "1st Year Representative", max votes = 1).
3. Click the `candidates` table. For each candidate, fill in their name, pick the matching `position_id` (the number shown in the `positions` table), party, course, year level, and a `photo_url` (see below).
4. Click the `students` table. Click **Insert row** for each student number, or use **Insert → Import data from CSV** to upload your whole class list at once (just one column: `student_number`).

**About candidate photos:** the simplest option is to upload each photo somewhere public (e.g. Supabase's **Storage** feature, or any image host) and paste the resulting link into the candidate's `photo_url` field. If left blank, a placeholder silhouette is shown automatically.

### Step 7 — Publish it on GitHub Pages

1. Create a new repository on GitHub (e.g. `ssc-election`).
2. Upload every file and folder from this project into that repository (drag-and-drop works on GitHub's web interface, or use `git push` if you're comfortable with Git).
3. In the repository, go to **Settings → Pages**.
4. Under **Branch**, choose `main` and folder `/ (root)`, then click **Save**.
5. Wait a minute, then GitHub will show you a live URL like `https://yourusername.github.io/ssc-election/`. That's your election site — share the `/vote.html` link with students and the `/dashboard.html` link on a projector or results screen.

### Step 8 — Election day checklist

- [ ] Confirm all candidates show `active = true` in the `candidates` table.
- [ ] Confirm the full voter roll is imported into `students`, all with `has_voted = false`.
- [ ] Do one test vote yourself, then reset it (delete that row from `votes`, and set that student's `has_voted` back to `false` in `students`) before opening voting to everyone.
- [ ] Open `vote.html` on the devices/computers students will use, and `dashboard.html` on the results screen.

---

## 6. Database Schema Reference

| Table | Purpose | Key columns |
|---|---|---|
| `positions` | Election positions (President, Secretary, etc.) | `position_name`, `max_votes`, `display_order` |
| `candidates` | Everyone running for a position | `full_name`, `position_id`, `party_list`, `photo_url`, `active` |
| `students` | The voter roll | `student_number` (primary key), `has_voted`, `voted_at` |
| `votes` | One row per candidate selected | `student_number`, `candidate_id`, `position_id` |

Two additional **views** are used by the website instead of the raw `students`/`votes` tables, so a visitor can never read more than they should:

- `students_lookup` — exposes only `student_number` and `has_voted`.
- `votes_public` — exposes only `candidate_id` and `position_id` (never *who* voted).

## 7. Adding Positions / Candidates / Students Later

No code changes are ever needed — everything is data:

- **Add a position:** insert a row into `positions`. It appears on the ballot automatically, in `display_order`.
- **Add a candidate:** insert a row into `candidates` with the right `position_id`.
- **Retire a candidate without deleting history:** set their `active` column to `false` instead of deleting — their past votes stay intact, they just disappear from the ballot.
- **Add students:** insert rows into `students`, or bulk-import a CSV from the Table Editor.

## 8. Security Considerations

- **Ballot secrecy:** the site's public key can only read `students_lookup` and `votes_public` (see above) — never the raw `students` or `votes` tables — so vote counts are public but individual ballots are not readable from the browser.
- **One vote per student:** enforced inside the `cast_vote()` database function using a row lock, so even two simultaneous submissions from the same student number cannot both succeed — this is stronger than checking in JavaScript alone, which could be bypassed.
- **No passwords stored:** since there's no login system, there are no passwords to leak. The tradeoff is that anyone who knows a valid student number could vote on that student's behalf — if that's a concern for your school, consider adding a second factor (e.g. a one-time code sent by your registrar) as a future improvement.
- **Never commit your `service_role` key** anywhere in this project or any public repository — only the `anon` key belongs in `config.js`.
- **Admin edits** (adding candidates, importing students) are done through the Supabase dashboard directly, which requires your Supabase login — the public site has no admin panel or write access beyond casting a vote.

## 9. Troubleshooting

| Problem | Likely cause |
|---|---|
| Blank page / "Failed to fetch" error | `config.js` still has the placeholder URL/key, or there's a typo in them. |
| "Student number not found" for a real student | The student number wasn't imported into the `students` table, or doesn't match exactly (check for extra spaces). |
| Candidates don't show up | Check `active = true` in the `candidates` table, and that `position_id` matches a real row in `positions`. |
| Dashboard doesn't update live | Confirm `01_schema.sql` ran successfully (it enables Realtime on `votes`, `students`, `candidates`). |
| "permission denied" errors in the browser console | A policy from `03_rls_policies.sql` wasn't applied — re-run that file. |

## 10. Future Improvements

- Admin dashboard (protected by Supabase Auth) for managing candidates/students without using the Supabase Table Editor directly.
- CSV export of results for official records.
- Optional email/SMS one-time codes for stronger identity verification.
- Multi-language support.

---

## 11. License

MIT — see [LICENSE](LICENSE).
