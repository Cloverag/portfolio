/* ============================================================================
   Knowledge graph of the work.

   Raghav's flagship project is a graph + vector retrieval engine, so the
   portfolio renders itself as a knowledge graph rather than claiming to know
   how to build one. Nodes are projects and the technologies shared between
   them; an edge means "this project uses this".

   Technologies used by exactly one project are excluded. All 53 would drown
   the 15 projects in 45 dangling leaves and say nothing about how the work
   relates — the expanded project row already lists every stack item.

   Layout is Fruchterman-Reingold with a weak centering pull, run to
   convergence once and then frozen so hovering is stable rather than a
   moving target. Canvas, no dependencies.
   ========================================================================= */
(function () {
  'use strict';

  var SITE = window.SITE;
  var host = document.getElementById('graph');
  if (!SITE || !host) return;

  var canvas = document.getElementById('graph-canvas');
  var legend = document.getElementById('graph-legend');
  var ctx = canvas.getContext('2d');

  // ------------------------------------------------------------ build model

  var usedBy = {};
  SITE.projects.forEach(function (p) {
    p.stack.forEach(function (tech) {
      (usedBy[tech] = usedBy[tech] || []).push(p.id);
    });
  });

  var hubs = Object.keys(usedBy).filter(function (t) { return usedBy[t].length > 1; });

  var nodes = [];
  var index = {};

  SITE.projects.forEach(function (p) {
    index[p.id] = nodes.length;
    nodes.push({
      id: p.id, label: p.name, kind: 'project',
      track: p.track, featured: !!p.featured, deg: 0
    });
  });

  hubs.forEach(function (tech) {
    index['tech:' + tech] = nodes.length;
    nodes.push({ id: 'tech:' + tech, label: tech, kind: 'tech', tech: tech, deg: 0 });
  });

  var edges = [];
  hubs.forEach(function (tech) {
    usedBy[tech].forEach(function (pid) {
      var a = index[pid], b = index['tech:' + tech];
      edges.push([a, b]);
      nodes[a].deg++; nodes[b].deg++;
    });
  });

  // adjacency, for the hover highlight
  var near = nodes.map(function () { return {}; });
  edges.forEach(function (e) { near[e[0]][e[1]] = 1; near[e[1]][e[0]] = 1; });

  // ---------------------------------------------------------------- layout

  var W = 1000, H = 620;                 // simulation space; mapped to canvas later
  var AREA = W * H;
  var k = Math.sqrt(AREA / nodes.length) * 0.88;

  // Deterministic seeding — the same graph every load, so the page does not
  // reshuffle itself between visits.
  var seed = 7;
  function rand() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

  nodes.forEach(function (n, i) {
    var a = (i / nodes.length) * Math.PI * 2;
    n.x = W / 2 + Math.cos(a) * (140 + rand() * 190);
    n.y = H / 2 + Math.sin(a) * (110 + rand() * 150);
  });

  function settle(iterations) {
    var temp = W * 0.10;
    var cool = temp / (iterations + 1);

    for (var step = 0; step < iterations; step++) {
      nodes.forEach(function (n) { n.dx = 0; n.dy = 0; });

      // repulsion, every pair (23 nodes — the naive loop is nothing)
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
          var f = (k * k) / d;
          var ux = dx / d, uy = dy / d;
          a.dx += ux * f; a.dy += uy * f;
          b.dx -= ux * f; b.dy -= uy * f;
        }
      }

      // attraction along edges
      edges.forEach(function (e) {
        var a = nodes[e[0]], b = nodes[e[1]];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        var f = (d * d) / k;
        var ux = dx / d, uy = dy / d;
        a.dx -= ux * f; a.dy -= uy * f;
        b.dx += ux * f; b.dy += uy * f;
      });

      // The graph has three disconnected components. Without a centering pull
      // they drift apart forever, since nothing but repulsion acts between them.
      nodes.forEach(function (n) {
        n.dx += (W / 2 - n.x) * 0.012;
        n.dy += (H / 2 - n.y) * 0.012;
      });

      nodes.forEach(function (n) {
        var d = Math.sqrt(n.dx * n.dx + n.dy * n.dy) || 0.01;
        var lim = Math.min(d, temp);
        n.x += (n.dx / d) * lim;
        n.y += (n.dy / d) * lim;
        n.x = Math.max(40, Math.min(W - 40, n.x));
        n.y = Math.max(30, Math.min(H - 30, n.y));
      });

      temp -= cool;
    }
  }

  settle(600);

  // normalise to [0,1] so the canvas can be any size
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach(function (n) {
    minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
  });
  nodes.forEach(function (n) {
    n.nx = (n.x - minX) / (maxX - minX || 1);
    n.ny = (n.y - minY) / (maxY - minY || 1);
  });

  // ----------------------------------------------------------------- paint

  var theme = {};
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    var get = function (name) { return cs.getPropertyValue(name).trim(); };
    theme = {
      accent: get('--accent'),
      fg:     get('--fg'),
      dim:    get('--fg-dim'),
      faint:  get('--fg-faint'),
      line:   get('--line'),
      raised: get('--bg-raised'),
      ok:     get('--ok')
    };
  }
  readTheme();

  var w = 0, h = 0, dpr = 1, pad = 54;
  var hover = -1;

  function layout() {
    var rect = canvas.getBoundingClientRect();
    w = rect.width; h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pad = w < 560 ? 44 : 92;
    nodes.forEach(function (n) {
      n.px = pad + n.nx * (w - pad * 2);
      n.py = pad * 0.7 + n.ny * (h - pad * 1.4);
    });
  }

  function radius(n) {
    if (n.kind === 'tech') return 3.6 + Math.min(n.deg, 6) * 0.8;
    return n.featured ? 7 : 5.4;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var lit = hover >= 0;
    var small = w < 560;

    // edges
    edges.forEach(function (e) {
      var a = nodes[e[0]], b = nodes[e[1]];
      var on = !lit || e[0] === hover || e[1] === hover;
      ctx.strokeStyle = on ? theme.accent : theme.line;
      ctx.globalAlpha = on ? (lit ? 0.55 : 0.22) : 0.14;
      ctx.lineWidth = on && lit ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(a.px, a.py);
      ctx.lineTo(b.px, b.py);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    nodes.forEach(function (n, i) {
      var on = !lit || i === hover || near[hover][i];
      var r = radius(n);

      ctx.globalAlpha = on ? 1 : 0.2;

      if (n.kind === 'project') {
        ctx.fillStyle = i === hover ? theme.accent : (n.featured ? theme.accent : theme.dim);
        ctx.beginPath(); ctx.arc(n.px, n.py, r, 0, 6.2832); ctx.fill();
        if (!n.featured && i !== hover) {
          ctx.fillStyle = theme.raised;
          ctx.beginPath(); ctx.arc(n.px, n.py, r - 2, 0, 6.2832); ctx.fill();
        }
      } else {
        ctx.strokeStyle = i === hover ? theme.accent : theme.faint;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.px, n.py, r, 0, 6.2832); ctx.stroke();
      }

      n._on = on;
      n._r = r;
      n._i = i;
    });
    ctx.globalAlpha = 1;

    drawLabels(lit, small);
  }

  /* Labels are placed in a second pass, because two things can only be fixed
     once every position is known: a label near an edge must align inward
     rather than run off the canvas, and labels that would overlap have to be
     pushed apart. Projects are placed first so a technology name is the one
     that yields. */
  function drawLabels(lit, small) {
    // Seed the obstacle list with the node circles themselves. Resolving
    // labels only against other labels pushes them straight onto a node.
    var placed = nodes.map(function (n) {
      return { x: n.px - n._r - 2, y: n.py - n._r - 2, w: n._r * 2 + 4, h: n._r * 2 + 4 };
    });

    var order = nodes.slice().sort(function (a, b) {
      if ((a.kind === 'project') !== (b.kind === 'project')) return a.kind === 'project' ? -1 : 1;
      return a.py - b.py;
    });

    order.forEach(function (n) {
      if (n.kind === 'tech' && small && !(lit && n._on)) return;

      var isProj = n.kind === 'project';
      ctx.font = (isProj ? '600 11px ' : '10px ') + 'ui-monospace, monospace';
      var tw = ctx.measureText(n.label).width;
      var th = 13;

      // Align inward near the edges so the text stays inside the frame.
      var align = 'center', x = n.px;
      if (n.px - tw / 2 < 6) { align = 'left'; x = Math.max(6, n.px - n._r - 2); }
      else if (n.px + tw / 2 > w - 6) { align = 'right'; x = Math.min(w - 6, n.px + n._r + 2); }

      var left = align === 'center' ? x - tw / 2 : align === 'left' ? x : x - tw;
      var y = n.py + n._r + 4;

      // Nudge down past anything already occupying the box.
      for (var guard = 0; guard < 8; guard++) {
        var clash = placed.some(function (b) {
          return left < b.x + b.w + 3 && left + tw + 3 > b.x &&
                 y < b.y + b.h + 1 && y + th + 1 > b.y;
        });
        if (!clash) break;
        y += th + 2;
      }

      placed.push({ x: left, y: y, w: tw, h: th });

      ctx.globalAlpha = n._on ? 1 : 0.2;
      ctx.fillStyle = n._i === hover ? theme.accent : isProj ? theme.fg : theme.faint;
      ctx.textAlign = align;
      ctx.textBaseline = 'top';
      ctx.fillText(n.label, x, y);
    });

    ctx.globalAlpha = 1;
  }

  function hit(mx, my) {
    var best = -1, bestD = 22 * 22;
    nodes.forEach(function (n, i) {
      var dx = mx - n.px, dy = my - n.py;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  // ----------------------------------------------------------- interaction

  canvas.addEventListener('mousemove', function (ev) {
    var r = canvas.getBoundingClientRect();
    var i = hit(ev.clientX - r.left, ev.clientY - r.top);
    if (i !== hover) {
      hover = i;
      canvas.style.cursor = i >= 0 ? 'pointer' : 'default';
      describe(i);
      draw();
    }
  });

  canvas.addEventListener('mouseleave', function () {
    hover = -1; describe(-1); draw();
  });

  canvas.addEventListener('click', function (ev) {
    var r = canvas.getBoundingClientRect();
    var i = hit(ev.clientX - r.left, ev.clientY - r.top);
    if (i < 0) return;
    var n = nodes[i];
    // The graph is navigation, not ornament: a project opens, a technology
    // filters the list to everything built with it.
    if (n.kind === 'project') window.PORTFOLIO.openProject(n.id);
    else window.PORTFOLIO.filterByTech(n.tech);
  });

  function describe(i) {
    if (i < 0) {
      legend.textContent = nodes.length + ' nodes · ' + edges.length +
        ' edges · hover to trace, click to open';
      return;
    }
    var n = nodes[i];
    if (n.kind === 'tech') {
      legend.textContent = n.label + ' — shared by ' + usedBy[n.tech].length +
        ' projects: ' + usedBy[n.tech].join(', ');
    } else {
      var links = Object.keys(near[i]).map(function (j) { return nodes[j].label; });
      legend.textContent = n.label + ' — ' +
        (links.length ? 'connected through ' + links.join(', ') : 'shares no technology with the others');
    }
  }

  // -------------------------------------------------------------- lifecycle

  function refresh() { layout(); draw(); }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 120);
  });

  /* Canvas pixels do not cascade, so every route into a new palette has to be
     observed explicitly:
       - the toggle button, which stamps data-theme on <html>
       - the OS switching light/dark while the page is open, which changes
         nothing in the DOM at all and would otherwise leave the canvas
         painting the previous theme's colours onto the new background. */
  function repaint() { readTheme(); draw(); }

  window.addEventListener('portfolio:themechange', repaint);

  new MutationObserver(repaint).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme']
  });

  var scheme = matchMedia('(prefers-color-scheme: dark)');
  if (scheme.addEventListener) scheme.addEventListener('change', repaint);
  else if (scheme.addListener) scheme.addListener(repaint);

  refresh();
  describe(-1);

  // A canvas is opaque to assistive tech. The same relationships are emitted
  // as real text so the section is not a dead end without sight or a mouse.
  var sr = document.getElementById('graph-text');
  if (sr) {
    sr.appendChild(el('p', 'The work shares ' + hubs.length +
      ' technologies across ' + SITE.projects.length + ' projects.'));
    var ul = document.createElement('ul');
    hubs.forEach(function (t) {
      ul.appendChild(el('li', t + ': ' + usedBy[t].join(', ')));
    });
    sr.appendChild(ul);
  }

  function el(tag, text) {
    var node = document.createElement(tag);
    node.textContent = text;
    return node;
  }
})();
