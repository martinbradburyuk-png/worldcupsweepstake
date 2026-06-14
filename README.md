# Family World Cup 2026 — Auto-Updating Tracker

This repo runs your family sweepstake tracker and **updates the scores by itself once a day**.
You set it up once, then it's hands-off (apart from the optional daily "sizzle" paragraph).

There are two halves:
1. **The app** (`src/App.js`) — the tracker the family sees.
2. **The robot** (`scripts/` + `.github/workflows/`) — fetches results each morning and updates the app.

---

## How it works (plain English)

Every morning at 08:30 UK time, GitHub wakes up, asks a free football data service for
the latest World Cup results, writes any new scores into `src/App.js`, and saves the change.
CodeSandbox (linked to this repo) updates the live page within seconds. The family's link
never changes.

The robot **only** edits scores. It never touches the schedule, dates, kick-off times, or
who-owns-which-team — so nothing you've set up can get scrambled.

---

## One-time setup

You'll do this once. Take it slowly; every step is copy-paste.

### Step 1 — Get a free results API key
1. Go to **https://www.football-data.org/client/register**
2. Sign up with your email (free tier is fine — the World Cup is included).
3. They email you an **API token** (a long string of letters and numbers). Keep it handy.

### Step 2 — Put the code on GitHub
1. Create a free account at **https://github.com** if you don't have one.
2. Click the **+** (top right) → **New repository**.
3. Name it e.g. `family-world-cup`, set it to **Public**, click **Create repository**.
4. On the new repo page, click **uploading an existing file**.
5. Drag in **all** the files and folders from this package (keep the folder structure:
   `src/`, `scripts/`, `.github/`, `public/`, `package.json`).
6. Click **Commit changes**.

### Step 3 — Add your API key as a secret
The robot needs your API key, but you must never paste it into the code directly.
GitHub has a safe place for it:
1. In your repo, go to **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. Name: `FOOTBALL_DATA_API_KEY`  (type it exactly).
4. Secret: paste the API token from Step 1.
5. Click **Add secret**.

### Step 4 — Switch the robot on
1. Go to the **Actions** tab in your repo.
2. If prompted, click the green button to enable workflows.
3. You'll see **"Update World Cup Results"**. Click it, then **Run workflow** → **Run workflow**
   to test it once now (don't wait until tomorrow).
4. After a minute, refresh. A green tick means it worked. Click in to read the log if curious.

### Step 5 — Put it online with CodeSandbox
1. Go to **https://codesandbox.io** and sign in (GitHub login is easiest).
2. Click **Create** → **Import from GitHub**.
3. Paste your repo's URL (e.g. `https://github.com/yourname/family-world-cup`).
4. CodeSandbox builds it and gives you a preview. Click **Share** → copy the link.
5. **That link is permanent.** Send it to the family once.

Done. From now on the scores update themselves every morning.

---

## The one manual bit: the daily "sizzle"

The hype paragraph at the top is the only thing not automated (an AI writing match-day
banter unsupervised is asking for trouble). To update it:

1. Open `src/App.js` on GitHub and click the pencil (edit) icon.
2. Find the `SIZZLE` block near the top. Add a new line for today, e.g.:
   ```js
   "Mon 15 Jun": "Your hype text here...",
   ```
3. Change `TODAY_LABEL` to match, e.g. `const TODAY_LABEL = "Mon 15 Jun";`
4. Click **Commit changes**. CodeSandbox updates within seconds.

(Or just ask Claude to write each day's sizzle and paste it in.)

---

## If a score doesn't appear

The robot matches teams by name. If the data service spells a team differently than
`src/App.js` does, that one result is skipped (safely — nothing breaks).
Fix it by adding the spelling to the `NAME_MAP` in `scripts/update-results.mjs`.
For example, if results stop appearing for Turkey, check whether the API calls it
"Türkiye" and ensure that spelling maps to `"Turkey"`.

## Changing the update time
In `.github/workflows/update-results.yml`, the line `cron: "30 7 * * *"` means 07:30 UTC.
GitHub uses UTC always. For 06:00 UK time in summer, use `0 5 * * *`, etc.

## Running it manually any time
Actions tab → "Update World Cup Results" → **Run workflow**. Handy right after a match ends.
