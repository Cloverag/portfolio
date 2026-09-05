#!/usr/bin/env node
/**
 * Regenerates data/github.js from the GitHub API.
 *
 * Zero npm dependencies — it shells out to the `gh` CLI, which is already
 * authenticated on this machine. Run it whenever you want the numbers on the
 * site to catch up with reality:
 *
 *   node scripts/refresh.mjs
 *
 * Output is a plain classic script (window.GITHUB = {...}) rather than JSON so
 * the site still works when opened straight off the filesystem, with no server.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const USER = process.env.GH_USER || 'Cloverag';

/** Repos we actually surface on the site. Anything else is noise. */
const TRACKED = [
  'callosum',
  'rsna-knee',
  'pixelforge',
  'Cloverag',
  'Teleprompter',
  'Global-Renewable-Energy-Data-Analysis-1965-2023-',
  'offensive-security-scripts',
  'Pothole-Detection-System',
  'Delivery-Route-Optimization-System',
];

function gh(args) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const detail = (err.stderr || err.message || '').trim().split('\n')[0];
    throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${detail}`);
  }
}

const ghJSON = (args) => JSON.parse(gh(args));

function profile() {
  const u = ghJSON(['api', `users/${USER}`]);
  return {
    login: u.login,
    name: u.name,
    bio: u.bio,
    followers: u.followers,
    publicRepos: u.public_repos,
    avatar: u.avatar_url,
  };
}

function contributions() {
  const query = `{
    user(login: "${USER}") {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }`;
  const c = ghJSON(['api', 'graphql', '-f', `query=${query}`]).data.user.contributionsCollection;
  const cal = c.contributionCalendar;

  const days = cal.weeks.flatMap((w) => w.contributionDays);

  // The calendar is always a contiguous run of days, so an anchor date plus a
  // flat array of counts carries the same information at a fraction of the size.
  // Assert the contiguity rather than assuming it.
  const DAY_MS = 86400000;
  const start = Date.parse(days[0].date + 'T00:00:00Z');
  days.forEach((d, i) => {
    if (Date.parse(d.date + 'T00:00:00Z') !== start + i * DAY_MS) {
      throw new Error(`contribution calendar is not contiguous at ${d.date}`);
    }
  });

  return {
    total: cal.totalContributions,
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    issues: c.totalIssueContributions,
    repos: c.totalRepositoriesWithContributedCommits,
    from: days[0].date,
    to: days[days.length - 1].date,
    counts: days.map((d) => d.contributionCount),
  };
}

function repos() {
  const all = ghJSON([
    'repo', 'list', USER, '--limit', '100', '--json',
    'name,description,primaryLanguage,stargazerCount,forkCount,updatedAt,url,isFork',
  ]);
  const byName = new Map(all.map((r) => [r.name, r]));

  return TRACKED.flatMap((name) => {
    const r = byName.get(name);
    if (!r) {
      console.warn(`  ! tracked repo not found on GitHub: ${name}`);
      return [];
    }
    let languages = {};
    try {
      languages = ghJSON(['api', `repos/${USER}/${name}/languages`]);
    } catch {
      /* empty repos have no language data — not an error */
    }
    return [{
      name: r.name,
      description: r.description,
      language: r.primaryLanguage?.name ?? null,
      stars: r.stargazerCount,
      forks: r.forkCount,
      updated: r.updatedAt.slice(0, 10),
      url: r.url,
      languages,
    }];
  });
}

/** Bytes-per-language summed across tracked repos, as a share of the total. */
function languageMix(repoList) {
  const bytes = {};
  for (const r of repoList) {
    for (const [lang, n] of Object.entries(r.languages)) {
      bytes[lang] = (bytes[lang] || 0) + n;
    }
  }
  // Notebooks are mostly serialised output, not code. Counting them raw would
  // make Jupyter dwarf everything else and say nothing true.
  delete bytes['Jupyter Notebook'];
  const total = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(bytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, n]) => ({ name, bytes: n, share: +(n / total).toFixed(4) }));
}

console.log(`refreshing github data for ${USER} ...`);
const repoList = repos();
const payload = {
  generatedAt: new Date().toISOString(),
  profile: profile(),
  contributions: contributions(),
  repos: repoList,
  languages: languageMix(repoList),
};

const out = join(ROOT, 'data', 'github.js');
// Pretty-print for reviewability, but keep the 365-element count array on one
// line so a data refresh reads as a one-line diff, not 365 changed lines.
const body = JSON.stringify(payload, null, 2).replace(
  /"counts": \[[\s\S]*?\]/,
  '"counts": [' + payload.contributions.counts.join(',') + ']'
);

writeFileSync(
  out,
  '// GENERATED by scripts/refresh.mjs \u2014 do not edit by hand.\n' +
  `// Snapshot taken ${payload.generatedAt}\n` +
  `window.GITHUB = ${body};\n`
);

const { contributions: c } = payload;
console.log(`  ${payload.repos.length} repos, ${c.total} contributions (${c.from} -> ${c.to})`);
console.log(`  wrote ${out}`);
