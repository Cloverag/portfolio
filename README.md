# portfolio

Personal site for Raghav Singh — terminal / engineering-log style.

**No framework, no build step, no images.** `index.html` is the whole site; open
it directly in a browser and it works, no dev server required.

```
index.html            markup + static hero copy
assets/style.css      design tokens, layout, dark + light themes
assets/main.js        rendering, filtering, heatmap, command bar
assets/*.pdf          résumé
data/site.js          ← EDIT THIS to change what the site says
data/github.js        ← GENERATED, do not hand-edit
scripts/refresh.mjs   regenerates data/github.js from the GitHub API
```

## Editing content

Everything you write lives in `data/site.js`: profile, skills, education, and the
project list. Add a project by appending an object to `projects` — the section,
filters, counts, and command-bar autocomplete all pick it up automatically.

One rule, and it is the point of the whole site: **every value in a `metrics`
array must be a number you can pull up live in an interview.** If you can't
source it, leave it out. An empty `metrics: []` renders fine.

## Refreshing the GitHub numbers

```fish
node scripts/refresh.mjs
```

Uses the `gh` CLI (already authenticated on this machine), so it needs no npm
packages and no token in a file. It rewrites `data/github.js` with the
contribution calendar, per-repo language bytes, and repo metadata, and stamps a
snapshot date that the site displays. Change `TRACKED` in that script to control
which repos appear in the activity section.

The contribution calendar is stored as a start date plus a flat array of daily
counts, so a refresh shows up as a one-line diff rather than 365 changed lines.

## Running it

```fish
# simplest — no server needed
xdg-open index.html

# or, if you want a real origin
python3 -m http.server 8000
```

## Deploying to GitHub Pages

```fish
git init
git add -A
git commit -m "portfolio: terminal-style site"
git branch -M main
git remote add origin https://github.com/Cloverag/<repo>.git
git push -u origin main
```

Then Settings → Pages → deploy from `main` / root. There is no build step, so
nothing else needs configuring.

## Keyboard and commands

`/` focus the command bar · `t` toggle theme · `j` / `k` move through projects ·
`?` help · `esc` clear output.

In the command bar: `help`, `ls [track]`, `cd <track>`, `cat <project>`,
`open <project>`, `whoami`, `skills`, `stats`, `contact`, `resume`, `theme`,
`clear`. Tab completes. Typing a bare project name is treated as `cat`.

## Things left to fill in

- `data/site.js` → `renewables.live` is `null`. Paste the public Power BI
  dashboard URL there; it is a stronger artifact than that project's repo.
