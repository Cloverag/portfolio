/* ============================================================================
   Raghav Singh — portfolio
   One classic script, no modules, no dependencies. Reads window.SITE (content)
   and window.GITHUB (generated snapshot) and renders the page from them.

   Classic scripts rather than ES modules on purpose: this way index.html can be
   opened straight off the filesystem with no server and still work.
   ========================================================================= */
(function () {
  'use strict';

  var SITE = window.SITE;
  var GH = window.GITHUB;

  if (!SITE) { console.error('data/site.js did not load'); return; }

  // ------------------------------------------------------------- helpers

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function fill(sel, kids) {
    var host = $(sel);
    if (!host) return null;
    host.textContent = '';
    kids.forEach(function (k) { if (k) host.appendChild(k); });
    return host;
  }

  var fmt = function (n) { return typeof n === 'number' ? n.toLocaleString('en-US') : n; };

  // ---------------------------------------------------------------- theme

  var root = document.documentElement;
  var themeLabel = $('#theme-label');

  function paintThemeLabel() {
    if (themeLabel) themeLabel.textContent = root.dataset.theme === 'dark' ? 'light' : 'dark';
  }

  function toggleTheme() {
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    paintThemeLabel();
    return next;
  }

  paintThemeLabel();
  var themeBtn = $('#theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // ----------------------------------------------------------- 00 whoami

  var p = SITE.profile;

  $('#hero-role').textContent = p.role;
  $('#hero-thesis').textContent = p.thesis;
  $('#contact-location').textContent = p.location;
  if (p.resume) $('#resume-link').setAttribute('href', p.resume);

  // Hero numbers come from the generated snapshot, never from hand-typed copy.
  if (GH) {
    var c = GH.contributions;
    fill('#hero-stats', [
      stat(fmt(c.total), 'contributions, last 12 months'),
      stat(fmt(c.commits), 'commits'),
      stat(fmt(c.pullRequests), 'pull requests'),
      stat(String(c.repos), 'repositories contributed to'),
      stat(String(GH.profile.publicRepos), 'public repositories')
    ]);
  }

  function stat(v, k) {
    return el('div', { class: 'stat' }, [
      el('span', { class: 'stat__v', text: v }),
      el('span', { class: 'stat__k', text: k })
    ]);
  }

  // ----------------------------------------------------------- 01 skills

  fill('#skills-grid', SITE.skills.map(function (g) {
    return el('div', { class: 'skills__group' }, [
      el('h3', { text: g.group }),
      el('ul', {}, g.items.map(function (i) { return el('li', { text: i }); }))
    ]);
  }));

  var skillCount = SITE.skills.reduce(function (n, g) { return n + g.items.length; }, 0);
  $('#skills-meta').textContent = skillCount + ' entries · ' + SITE.skills.length + ' groups';

  var edu = p.education;
  fill('#education', [
    el('dt', { text: 'degree' }), el('dd', { text: edu.degree }),
    el('dt', { text: 'institute' }), el('dd', { text: edu.school }),
    el('dt', { text: 'dates' }), el('dd', { text: edu.span }),
    el('dt', { text: 'coursework' }), el('dd', { text: edu.coursework.join(' · ') })
  ]);

  fill('#now', p.now.map(function (line) { return el('li', { text: line }); }));

  // --------------------------------------------------------- 02 projects

  var trackById = {};
  SITE.tracks.forEach(function (t) { trackById[t.id] = t; });

  var activeTrack = 'all';
  var rows = {};           // project id -> { root, button, body }
  var order = [];          // project ids in DOM order
  var cursor = -1;         // index into `order`, for j/k navigation

  function statusTag(s) {
    var label = { active: 'active', shipped: 'shipped', wip: 'in progress' }[s] || s;
    return el('span', { class: 'tag tag--' + s, text: label });
  }

  function buildRow(proj, index) {
    var track = trackById[proj.track];
    var bodyId = 'body-' + proj.id;

    var button = el('button', {
      class: 'proj__row',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': bodyId
    }, [
      el('span', { class: 'proj__dir', text: String(index + 1).padStart(2, '0') }),
      el('span', { class: 'proj__main' }, [
        el('span', { class: 'proj__name' }, [
          document.createTextNode(proj.name),
          el('span', { class: 'proj__slash', text: '/' })
        ]),
        el('span', { class: 'proj__blurb', text: proj.blurb })
      ]),
      el('span', { class: 'proj__aside' }, [
        el('span', { class: 'proj__star', title: proj.featured ? 'featured' : null,
                     text: proj.featured ? '\u2605' : '' }),
        el('span', { class: 'proj__track', text: track ? track.dir : '' }),
        el('span', { class: 'proj__year', text: proj.year }),
        statusTag(proj.status),
        el('span', { class: 'proj__caret', text: '›' })
      ])
    ]);

    var body = el('div', { class: 'proj__body', id: bodyId, hidden: true }, [
      el('div', {}, [].concat(
        [el('h3', { class: 'sr', text: proj.title })],
        proj.detail.map(function (d) { return el('p', { class: 'proj__detail', text: d }); }),
        proj.metrics && proj.metrics.length
          ? [el('div', { class: 'metrics' }, proj.metrics.map(function (m) {
              return el('div', { class: 'metric' }, [
                el('span', { class: 'metric__v', text: m.v }),
                el('span', { class: 'metric__k', text: m.k })
              ]);
            }))]
          : [],
        [el('ul', { class: 'stack' }, proj.stack.map(function (s) { return el('li', { text: s }); }))],
        [el('div', { class: 'proj__links' }, [
          proj.repo ? el('a', { class: 'chip', href: 'https://github.com/' + proj.repo, rel: 'noopener', text: 'repo ↗' }) : null,
          proj.live ? el('a', { class: 'chip chip--solid', href: proj.live, rel: 'noopener', text: 'live demo ↗' }) : null,
          proj.note ? el('span', { class: 'proj__note', text: proj.note }) : null
        ])]
      ))
    ]);

    var wrapper = el('article', { class: 'proj', 'data-track': proj.track, 'data-id': proj.id }, [button, body]);
    button.addEventListener('click', function () { toggle(proj.id); });

    rows[proj.id] = { root: wrapper, button: button, body: body, proj: proj };
    return wrapper;
  }

  function toggle(id, force) {
    var r = rows[id];
    if (!r) return false;
    var open = force === undefined ? r.body.hidden : force;
    r.body.hidden = !open;
    r.button.setAttribute('aria-expanded', String(open));
    return open;
  }

  fill('#project-list', SITE.projects.map(buildRow));
  SITE.projects.forEach(function (proj) { order.push(proj.id); });

  // --- filters

  function matches(proj, id) {
    if (id === 'all') return true;
    if (id === 'featured') return !!proj.featured;
    return proj.track === id;
  }

  function countFor(id) {
    return SITE.projects.filter(function (x) { return matches(x, id); }).length;
  }

  function makeFilter(id, label) {
    return el('button', {
      class: 'filter',
      type: 'button',
      'data-track': id,
      'aria-pressed': String(id === activeTrack),
      onclick: function () { setTrack(id); }
    }, [
      document.createTextNode(label + ' '),
      el('span', { class: 'filter__n', text: countFor(id) })
    ]);
  }

  var countEl = el('span', { class: 'filters__count' });
  fill('#filters', [].concat(
    [makeFilter('all', 'all'), makeFilter('featured', '\u2605 featured')],
    SITE.tracks.map(function (t) { return makeFilter(t.id, t.dir); }),
    [countEl]
  ));

  function setTrack(id) {
    activeTrack = id;
    var shown = 0;
    SITE.projects.forEach(function (proj) {
      var match = matches(proj, id);
      rows[proj.id].root.hidden = !match;
      if (match) shown++;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.filter'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.track === id));
    });
    order = SITE.projects
      .filter(function (proj) { return matches(proj, id); })
      .map(function (proj) { return proj.id; });
    cursor = -1;
    countEl.textContent = shown + ' of ' + SITE.projects.length + ' shown';
    $('#projects-empty').hidden = shown > 0;
    return shown;
  }

  setTrack('all');

  function focusProject(id, expand) {
    var r = rows[id];
    if (!r) return false;
    if (r.root.hidden) setTrack('all');
    if (expand) toggle(id, true);
    r.button.focus({ preventScroll: true });
    r.root.scrollIntoView({ behavior: 'smooth', block: 'center' });
    cursor = order.indexOf(id);
    return true;
  }

  /** Resolve a user-typed token to a project: exact id/name first, then prefix. */
  function findProject(q) {
    if (!q) return null;
    var t = q.toLowerCase().replace(/\/$/, '');
    var list = SITE.projects;
    var exact = list.filter(function (x) { return x.id === t || x.name.toLowerCase() === t; });
    if (exact.length) return exact[0];
    var partial = list.filter(function (x) {
      return x.id.indexOf(t) === 0 || x.name.toLowerCase().indexOf(t) === 0 ||
             x.title.toLowerCase().indexOf(t) !== -1;
    });
    return partial.length ? partial[0] : null;
  }

  // --------------------------------------------------------- 03 activity

  if (GH) renderActivity(GH);

  function renderActivity(gh) {
    var c = gh.contributions;

    // -- heatmap
    var counts = c.counts;
    var start = new Date(c.from + 'T00:00:00Z');
    var pad = start.getUTCDay();                       // blanks before the first day
    var cols = Math.ceil((pad + counts.length) / 7);

    // Thresholds from the data itself. A fixed scale would be meaningless when a
    // single 127-commit day sits next to a lot of 1-3 commit days.
    var nonZero = counts.filter(function (n) { return n > 0; }).sort(function (a, b) { return a - b; });
    var q = function (f) { return nonZero.length ? nonZero[Math.floor(nonZero.length * f)] : 1; };
    var t1 = q(0.25), t2 = q(0.5), t3 = q(0.75);

    var level = function (n) {
      if (n <= 0) return 0;
      if (n <= t1) return 1;
      if (n <= t2) return 2;
      if (n <= t3) return 3;
      return 4;
    };

    var cells = [];
    for (var i = 0; i < pad; i++) {
      cells.push(el('span', { class: 'heatmap__cell', style: 'visibility:hidden' }));
    }
    counts.forEach(function (n, idx) {
      var d = new Date(start.getTime() + idx * 86400000);
      var iso = d.toISOString().slice(0, 10);
      cells.push(el('span', {
        class: 'heatmap__cell',
        'data-l': level(n),
        title: (n === 1 ? '1 contribution' : n + ' contributions') + ' on ' + iso
      }));
    });
    fill('#heatmap', cells);
    $('#heatmap').setAttribute('aria-label',
      fmt(c.total) + ' contributions between ' + c.from + ' and ' + c.to);

    // -- month rail, labelled only where the month changes
    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var months = [], prev = -1;
    for (var col = 0; col < cols; col++) {
      var dayIdx = Math.max(0, col * 7 - pad);
      var m = new Date(start.getTime() + dayIdx * 86400000).getUTCMonth();
      months.push(el('span', { text: m !== prev ? MONTHS[m] : '' }));
      prev = m;
    }
    fill('#heatmap-months', months);

    var busiest = Math.max.apply(null, counts);
    $('#heatmap-caption').textContent =
      fmt(c.total) + ' contributions · ' + nonZero.length + ' active days · busiest ' + busiest;

    $('#snapshot-meta').textContent = 'snapshot ' + gh.generatedAt.slice(0, 10);

    // -- language mix
    fill('#langs', gh.languages.filter(function (l) { return l.share >= 0.001; }).map(function (l) {
      var pct = (l.share * 100).toFixed(1) + '%';
      return el('div', { class: 'lang' }, [
        el('span', { class: 'lang__n', text: l.name }),
        el('span', { class: 'lang__bar' }, [
          el('span', { class: 'lang__fill', style: 'width:' + Math.max(l.share * 100, 0.6) + '%' })
        ]),
        el('span', { class: 'lang__p', text: pct })
      ]);
    }));

    // -- repositories
    var blurbByRepo = {};
    SITE.projects.forEach(function (proj) {
      if (proj.repo) blurbByRepo[proj.repo.split('/')[1].toLowerCase()] = proj.blurb;
    });

    fill('#repos', gh.repos.map(function (r) {
      return el('a', { class: 'repo', href: r.url, rel: 'noopener' }, [
        el('span', { class: 'repo__n', text: r.name }),
        el('span', { class: 'repo__d', text:
          (r.description || blurbByRepo[r.name.toLowerCase()] || '—') +
          (r.language ? '  ·  ' + r.language : '') +
          (r.stars ? '  ·  ★' + r.stars : '') +
          '  ·  updated ' + r.updated })
      ]);
    }));
  }

  // ----------------------------------------------------------- page size

  window.addEventListener('load', function () {
    var footSize = $('#foot-size');
    if (!footSize || !window.performance || !performance.getEntriesByType) return;
    // transferSize is always 0 over file://, which would print a confidently
    // wrong number. Say nothing rather than say something unsourceable.
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    try {
      var bytes = performance.getEntriesByType('navigation')
        .concat(performance.getEntriesByType('resource'))
        .reduce(function (n, e) { return n + (e.transferSize || 0); }, 0);
      if (bytes > 0) footSize.textContent = Math.round(bytes / 1024) + ' KB transferred';
    } catch (e) { /* not supported: the line just stays empty */ }
  });

  // ------------------------------------------------------- command line

  var out = $('#cli-out');
  var input = $('#cli-in');
  var form = $('#cli-form');
  var history = [];
  var histIdx = -1;

  function print(text, cls) {
    out.appendChild(el('p', { class: cls || null, text: text }));
    out.scrollTop = out.scrollHeight;
  }

  /* Built as DOM nodes, never as HTML strings: usage text like `cat <project>`
     would otherwise be parsed as a tag and vanish from the output. */
  function printStrong(text, rest) {
    out.appendChild(el('p', {}, [el('b', { text: text }), rest ? document.createTextNode(rest) : null]));
    out.scrollTop = out.scrollHeight;
  }

  /* One grid for the whole listing. A grid per row would size its own columns,
     so long names would never line up with short ones. */
  function printTable(pairs) {
    var kids = [];
    pairs.forEach(function (pair) {
      kids.push(el('b', { text: pair[0] }));
      kids.push(el('span', { text: pair[1] }));
    });
    out.appendChild(el('div', { class: 'table' }, kids));
    out.scrollTop = out.scrollHeight;
  }

  function printEcho(line) {
    out.appendChild(el('p', { class: 'echo', text: 'raghav@iiitn:~$ ' + line }));
    out.scrollTop = out.scrollHeight;
  }

  function goto(hash) {
    var target = $(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  var COMMANDS = {
    help: {
      usage: 'help',
      about: 'this list',
      run: function () {
        print('available commands:');
        printTable(Object.keys(COMMANDS).map(function (name) {
          return [COMMANDS[name].usage, COMMANDS[name].about];
        }));
        print('shortcuts: / focus · t theme · j/k move through projects · ? help · esc clear');
      }
    },
    ls: {
      usage: 'ls [track]',
      about: 'list projects, optionally within one track',
      run: function (args) {
        var track = args[0] ? args[0].replace(/\/$/, '') : null;
        if (track && !trackById[track]) {
          print('ls: no such track: ' + track + '. try: ' +
            SITE.tracks.map(function (t) { return t.id; }).join(', '), 'err');
          return;
        }
        printTable(SITE.projects
          .filter(function (x) { return !track || x.track === track; })
          .map(function (x) {
            return [x.name, trackById[x.track].dir + '   ' + x.year + '   ' + x.status];
          }));
      }
    },
    cd: {
      usage: 'cd <track>',
      about: 'filter the list (ai, sys, data, sec, featured, or ..)',
      run: function (args) {
        var t = (args[0] || '').replace(/\/$/, '');
        if (t === '..' || t === '' || t === '~') { setTrack('all'); print('showing all projects'); goto('#projects'); return; }
        if (t !== 'featured' && !trackById[t]) { print('cd: no such track: ' + t, 'err'); return; }
        var n = setTrack(t);
        print('filtered to ' + (t === 'featured' ? 'featured' : trackById[t].dir) +
              ' — ' + n + ' project' + (n === 1 ? '' : 's'));
        goto('#projects');
      }
    },
    cat: {
      usage: 'cat <project>',
      about: 'expand a project and jump to it',
      run: function (args) {
        var proj = findProject(args[0]);
        if (!proj) { print('cat: ' + (args[0] || '') + ': no such project', 'err'); return; }
        focusProject(proj.id, true);
        printStrong(proj.title);
        print(proj.blurb);
        proj.metrics.forEach(function (m) { print('  ' + m.v + '  ' + m.k); });
      }
    },
    open: {
      usage: 'open <project>',
      about: 'open a project’s live demo or repository',
      run: function (args) {
        var proj = findProject(args[0]);
        if (!proj) { print('open: ' + (args[0] || '') + ': no such project', 'err'); return; }
        var url = proj.live || (proj.repo ? 'https://github.com/' + proj.repo : null);
        if (!url) { print('open: ' + proj.name + ' has no public link (' + (proj.note || 'private') + ')', 'err'); return; }
        window.open(url, '_blank', 'noopener');
        print('opening ' + url);
      }
    },
    whoami: {
      usage: 'whoami',
      about: 'the short version',
      run: function () {
        printStrong(p.name);
        print(p.role);
        print(p.thesis);
        goto('#whoami');
      }
    },
    stats: {
      usage: 'stats',
      about: 'github numbers from the latest snapshot',
      run: function () {
        if (!GH) { print('stats: no snapshot loaded', 'err'); return; }
        var c = GH.contributions;
        print('  ' + fmt(c.total) + ' contributions  (' + c.from + ' → ' + c.to + ')');
        print('  ' + fmt(c.commits) + ' commits, ' + c.pullRequests + ' PRs, ' + c.issues + ' issues');
        print('  ' + c.repos + ' repositories contributed to, ' + GH.profile.publicRepos + ' public');
        print('  snapshot taken ' + GH.generatedAt.slice(0, 10));
        goto('#activity');
      }
    },
    skills: { usage: 'skills', about: 'jump to the skills section', run: function () {
      printTable(SITE.skills.map(function (g) { return [g.group, g.items.join(', ')]; }));
      goto('#skills');
    } },
    contact: { usage: 'contact', about: 'how to reach me', run: function () {
      print('  email     ' + p.email);
      print('  github    ' + p.github);
      print('  linkedin  ' + p.linkedin);
      goto('#contact');
    } },
    resume: { usage: 'resume', about: 'open the resume pdf', run: function () {
      window.open(p.resume, '_blank', 'noopener');
      print('opening ' + p.resume);
    } },
    theme: { usage: 'theme', about: 'switch between dark and light', run: function () {
      print('theme: ' + toggleTheme());
    } },
    clear: { usage: 'clear', about: 'clear this output', run: function () { out.textContent = ''; } }
  };

  function execute(line) {
    var parts = line.trim().split(/\s+/);
    var name = (parts.shift() || '').toLowerCase();
    if (!name) return;

    printEcho(line);

    if (name === 'sudo') { print('nice try. this shell has no root — everything here is already public.'); return; }
    if (name === '?') { COMMANDS.help.run([]); return; }

    var cmd = COMMANDS[name];
    if (!cmd) {
      // If it names a project, treat it as `cat`. Saves typing the verb.
      var proj = findProject(name);
      if (proj) { COMMANDS.cat.run([name]); return; }
      print(name + ': command not found. type help.', 'err');
      return;
    }
    cmd.run(parts);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var line = input.value;
    if (!line.trim()) return;
    history.unshift(line);
    histIdx = -1;
    input.value = '';
    execute(line);
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { input.value = ''; input.blur(); return; }
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      histIdx = Math.min(histIdx + 1, history.length - 1);
      input.value = history[histIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      histIdx = Math.max(histIdx - 1, -1);
      input.value = histIdx === -1 ? '' : history[histIdx];
    } else if (e.key === 'Tab') {
      // Complete against command names, then project names.
      var v = input.value.trim().toLowerCase();
      if (!v) return;
      var pool = Object.keys(COMMANDS).concat(SITE.projects.map(function (x) { return x.name; }));
      var hit = pool.filter(function (n) { return n.toLowerCase().indexOf(v) === 0; });
      if (hit.length === 1) { e.preventDefault(); input.value = hit[0] + ' '; }
      else if (hit.length > 1) { e.preventDefault(); print(hit.join('  ')); }
    }
  });

  // ------------------------------------------------------------ copy button

  Array.prototype.forEach.call(document.querySelectorAll('.copy'), function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.dataset.copy;
      var done = function (ok) {
        btn.textContent = ok ? 'copied \u2713' : 'select it';
        btn.classList.toggle('is-done', ok);
        setTimeout(function () { btn.textContent = 'copy'; btn.classList.remove('is-done'); }, 1600);
      };
      // navigator.clipboard is undefined on insecure origins (plain http, file://).
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
      } else {
        done(false);
      }
    });
  });

  // -------------------------------------------------------- global keys

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === '/') { e.preventDefault(); input.focus(); return; }
    if (e.key === '?') { e.preventDefault(); input.focus(); COMMANDS.help.run([]); return; }
    if (e.key === 't') { toggleTheme(); return; }
    if (e.key === 'Escape') { out.textContent = ''; return; }

    if (e.key === 'j' || e.key === 'k') {
      if (!order.length) return;
      e.preventDefault();
      cursor = e.key === 'j'
        ? Math.min(cursor + 1, order.length - 1)
        : Math.max(cursor - 1, 0);
      focusProject(order[cursor], false);
    }
  });

  // --------------------------------------------------------- scrollspy

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topbar nav a'));
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var seen = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting; });
      // The topmost visible section wins, so scrolling up and down agree.
      var current = sections.filter(function (s) { return seen[s.id]; })[0];
      navLinks.forEach(function (a) {
        a.setAttribute('aria-current', String(current && a.getAttribute('href') === '#' + current.id));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  // Deep link: /#projects?p=callosum style is overkill; #callosum is enough.
  if (location.hash) {
    var deep = findProject(location.hash.slice(1));
    if (deep && !$(location.hash)) focusProject(deep.id, true);
  }
})();
