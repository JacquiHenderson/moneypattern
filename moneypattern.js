/* ============================================================
   MoneyPattern — interaction layer
   - Refined parallax star-field (depth, twinkle, shooting stars)
   - Scroll reveals
   - Constellation archetype readout
   - "Discover yours" teaser flow
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1 · STAR-FIELD  (canvas, three depth layers)
     --------------------------------------------------------- */
  var canvas = document.getElementById('stars');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var W, H, dpr, stars = [], shooters = [];
    var sy = 0, tMX = 0, tMY = 0, cMX = 0, cMY = 0, nextShot = 0;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      stars = [];
      var area = (W * H) / 1000;
      var layers = [
        { n: area * 0.42, rMin: 0.3, rMax: 0.7, aMin: 0.05, aMax: 0.15, depth: 0.12, gold: 0 },
        { n: area * 0.26, rMin: 0.5, rMax: 1.0, aMin: 0.09, aMax: 0.26, depth: 0.30, gold: 0.06 },
        { n: area * 0.08, rMin: 0.8, rMax: 1.5, aMin: 0.18, aMax: 0.50, depth: 0.55, gold: 0.20 }
      ];
      layers.forEach(function (L) {
        for (var i = 0; i < L.n; i++) {
          var isGold = Math.random() < L.gold;
          stars.push({
            x: Math.random() * W, y: Math.random() * H,
            r: L.rMin + Math.random() * (L.rMax - L.rMin),
            a: L.aMin + Math.random() * (L.aMax - L.aMin),
            tw: 0.0005 + Math.random() * 0.0013,
            ph: Math.random() * Math.PI * 2,
            depth: L.depth,
            col: isGold ? '232,75,138' : (Math.random() < 0.2 ? '212,110,150' : '246,185,210'),
            glow: L.depth > 0.5 && Math.random() < 0.3
          });
        }
      });
    }

    function spawnShooter() {
      var edge = Math.random();
      var sx = W * (0.1 + Math.random() * 0.7);
      var syy = H * (0.02 + Math.random() * 0.28);
      var ang = (Math.PI / 4) + (Math.random() * 0.5 - 0.25);
      shooters.push({
        x: sx, y: syy, ang: ang,
        len: 90 + Math.random() * 120,
        speed: 9 + Math.random() * 6,
        life: 0, max: 28 + Math.random() * 14
      });
    }

    function frame(t) {
      ctx.clearRect(0, 0, W, H);
      cMX += (tMX - cMX) * 0.05;
      cMY += (tMY - cMY) * 0.05;
      var i, s;
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        var px = s.x + cMX * s.depth * 22;
        var py = s.y + (sy * s.depth * -0.08) + cMY * s.depth * 22;
        py = ((py % H) + H) % H;
        var tw = reduce ? s.a : s.a + Math.sin(t * s.tw + s.ph) * (s.a * 0.4);
        tw = Math.max(0, tw);
        if (s.glow) {
          var g = ctx.createRadialGradient(px, py, 0, px, py, s.r * 6);
          g.addColorStop(0, 'rgba(' + s.col + ',' + (tw * 0.35) + ')');
          g.addColorStop(1, 'rgba(' + s.col + ',0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, s.r * 6, 0, 6.2832); ctx.fill();
        }
        ctx.fillStyle = 'rgba(' + s.col + ',' + tw + ')';
        ctx.beginPath(); ctx.arc(px, py, s.r, 0, 6.2832); ctx.fill();
      }
      // shooting stars
      if (!reduce) {
        if (t > nextShot) { spawnShooter(); nextShot = t + 7000 + Math.random() * 9000; }
        for (i = shooters.length - 1; i >= 0; i--) {
          var sh = shooters[i];
          sh.life++;
          sh.x += Math.cos(sh.ang) * sh.speed;
          sh.y += Math.sin(sh.ang) * sh.speed;
          var k = sh.life / sh.max;
          var fade = k < 0.2 ? k / 0.2 : (1 - (k - 0.2) / 0.8);
          fade = Math.max(0, fade);
          var ex = sh.x - Math.cos(sh.ang) * sh.len;
          var ey = sh.y - Math.sin(sh.ang) * sh.len;
          var grad = ctx.createLinearGradient(sh.x, sh.y, ex, ey);
          grad.addColorStop(0, 'rgba(232,75,138,' + (0.6 * fade) + ')');
          grad.addColorStop(1, 'rgba(232,75,138,0)');
          ctx.strokeStyle = grad; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(ex, ey); ctx.stroke();
          if (sh.life >= sh.max || sh.x > W + 60 || sh.y > H + 60) shooters.splice(i, 1);
        }
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', function () { sy = window.scrollY || window.pageYOffset; }, { passive: true });
    window.addEventListener('mousemove', function (e) {
      tMX = (e.clientX / W - 0.5) * 2; tMY = (e.clientY / H - 0.5) * 2;
    });
    resize();
    if (reduce) { frame(0); } else { requestAnimationFrame(frame); }
  }

  /* ---------------------------------------------------------
     2 · SCROLL REVEALS
     --------------------------------------------------------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduce) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            var d = parseInt(e.target.getAttribute('data-delay') || '0', 10);
            setTimeout(function () { e.target.classList.add('in'); }, d);
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------------------------------------------------------
     3 · NAV — hairline on scroll
     --------------------------------------------------------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', (window.scrollY || 0) > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     4 · CONSTELLATION READOUT
     --------------------------------------------------------- */
  var nodes = document.querySelectorAll('.cz-node');
  var readName = document.getElementById('cz-name');
  var readBlurb = document.getElementById('cz-blurb');
  var readIndex = document.getElementById('cz-index');
  if (nodes.length && readName) {
    function select(node) {
      nodes.forEach(function (n) { n.classList.remove('active'); });
      node.classList.add('active');
      readName.textContent = node.getAttribute('data-name');
      readBlurb.textContent = node.getAttribute('data-blurb');
      if (readIndex) readIndex.textContent = node.getAttribute('data-idx');
    }
    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () { select(n); });
      n.addEventListener('focus', function () { select(n); });
      n.addEventListener('click', function () { select(n); });
    });
  }

  /* ---------------------------------------------------------
     6 · TESTIMONIAL CAROUSEL
     --------------------------------------------------------- */
  (function () {
    var track = document.getElementById('ttrack');
    var prev = document.getElementById('tprev');
    var next = document.getElementById('tnext');
    var dotsWrap = document.getElementById('tdots');
    if (!track || !prev || !next) return;
    var cards = Array.prototype.slice.call(track.children);
    var page = 0;

    function perView() {
      var w = window.innerWidth;
      if (w <= 680) return 1;
      if (w <= 920) return 2;
      return 3;
    }
    function pages() { return Math.max(1, Math.ceil(cards.length / perView())); }

    function buildDots() {
      dotsWrap.innerHTML = '';
      for (var i = 0; i < pages(); i++) {
        var b = document.createElement('button');
        b.className = 'tdot' + (i === page ? ' on' : '');
        b.setAttribute('aria-label', 'Go to testimonial page ' + (i + 1));
        (function (idx) { b.addEventListener('click', function () { go(idx); }); })(i);
        dotsWrap.appendChild(b);
      }
    }
    function update() {
      var pv = perView();
      var maxPage = pages() - 1;
      if (page > maxPage) page = maxPage;
      // shift by whole pages; each page = pv cards. card width incl gap:
      var card = cards[0];
      var gap = 22;
      var cardW = card.getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-(page * pv * cardW)) + 'px)';
      var dots = dotsWrap.querySelectorAll('.tdot');
      for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === page);
    }
    function go(p) {
      var mp = pages() - 1;
      page = p < 0 ? mp : (p > mp ? 0 : p);
      update();
    }
    prev.addEventListener('click', function () { go(page - 1); });
    next.addEventListener('click', function () { go(page + 1); });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { buildDots(); update(); }, 120);
    });
    buildDots();
    update();

    // auto-advance (pauses on hover), respects reduced motion
    if (!reduce) {
      var timer = setInterval(function () { go(page + 1); }, 6500);
      var car = track.closest('.tcarousel');
      if (car) {
        car.addEventListener('mouseenter', function () { clearInterval(timer); timer = null; });
        car.addEventListener('mouseleave', function () {
          if (!timer) timer = setInterval(function () { go(page + 1); }, 6500);
        });
      }
    }
  })();

  /* ---------------------------------------------------------
     5 · DISCOVER — teaser flow
     --------------------------------------------------------- */
  var overlay = document.getElementById('quiz');
  if (!overlay) return;

  var QUESTIONS = [
    {
      eyebrow: 'Reading 1 of 3 · Saving',
      q: 'When money lands in your account, your first instinct is to —',
      a: [
        { t: 'Move it to savings before I touch a cent', w: { build: 2, anchor: 1 } },
        { t: 'Spend on what matters now, save what remains', w: { momentum: 2, seeker: 1 } },
        { t: 'It honestly depends on the week', w: { navigator: 2, seeker: 1 } }
      ]
    },
    {
      eyebrow: 'Reading 2 of 3 · Market response',
      q: 'The market falls 20% overnight. By morning you —',
      a: [
        { t: 'See an opening and buy more', w: { momentum: 2, vision: 1 } },
        { t: 'Hold steady and wait it out', w: { build: 2, anchor: 1 } },
        { t: 'Feel the pull to sell and protect what\u2019s left', w: { anchor: 2, navigator: 1 } }
      ]
    },
    {
      eyebrow: 'Reading 3 of 3 · The future',
      q: 'When you picture your future self, it feels —',
      a: [
        { t: 'Vivid and close \u2014 I can almost see it', w: { vision: 2, build: 1 } },
        { t: 'A little abstract, far down the road', w: { navigator: 2, momentum: 1 } },
        { t: 'Something I\u2019d rather not dwell on', w: { seeker: 2, anchor: 1 } }
      ]
    }
  ];

  var RESULTS = {
    momentum: { name: 'The Momentum Maker', line: 'You move first and adjust as you go \u2014 decisive, bold, energised by growth. Your edge is speed; your work is patience.' },
    build:    { name: 'The Steady Builder', line: 'You build quietly and consistently, rarely rattled by the noise. Your edge is discipline; your work is letting it grow bigger than caution.' },
    vision:   { name: 'The Visionary', line: 'Your future feels close enough to touch, and it pulls every decision forward. Your edge is foresight; your work is living in the present too.' },
    anchor:   { name: 'The Anchor', line: 'Security comes first \u2014 you want a solid floor beneath every move. Your edge is resilience; your work is letting yourself reach.' },
    navigator:{ name: 'The Navigator', line: 'You read the conditions and recalibrate as they shift. Your edge is adaptability; your work is committing to a direction.' },
    seeker:   { name: 'The Seeker', line: 'Your relationship with money is still taking shape \u2014 curious, open, evolving. Your edge is honesty; your work is turning insight into habit.' }
  };

  var ORDER = ['momentum', 'build', 'vision', 'anchor', 'navigator', 'seeker'];

  var stage = document.getElementById('quiz-stage');
  var dots = document.getElementById('quiz-dots');
  var step = 0, scores = {};

  function openQuiz() {
    step = 0; scores = {};
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    renderQ();
  }
  function closeQuiz() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function renderDots(active, total) {
    if (!dots) return;
    var h = '';
    for (var i = 0; i < total; i++) {
      h += '<span class="qdot' + (i === active ? ' on' : '') + (i < active ? ' done' : '') + '"></span>';
    }
    dots.innerHTML = h;
  }

  function renderQ() {
    var Q = QUESTIONS[step];
    renderDots(step, QUESTIONS.length + 1);
    var html = '<div class="qcard" data-anim>' +
      '<div class="qeyebrow">' + Q.eyebrow + '</div>' +
      '<h3 class="qtitle">' + Q.q + '</h3>' +
      '<div class="qopts">';
    Q.a.forEach(function (opt, i) {
      html += '<button class="qopt" data-i="' + i + '"><span class="qopt-star">\u2727</span><span>' + opt.t + '</span></button>';
    });
    html += '</div></div>';
    stage.innerHTML = html;
    stage.querySelectorAll('.qopt').forEach(function (b) {
      b.addEventListener('click', function () {
        var w = Q.a[parseInt(b.getAttribute('data-i'), 10)].w;
        for (var k in w) { scores[k] = (scores[k] || 0) + w[k]; }
        b.classList.add('chosen');
        setTimeout(next, 240);
      });
    });
  }

  function next() {
    step++;
    if (step < QUESTIONS.length) { renderQ(); }
    else { renderResult(); }
  }

  function renderResult() {
    renderDots(QUESTIONS.length, QUESTIONS.length + 1);
    var best = null, bv = -1;
    ORDER.forEach(function (k) {
      var v = scores[k] || 0;
      if (v > bv) { bv = v; best = k; }
    });
    var R = RESULTS[best] || RESULTS.navigator;
    stage.innerHTML =
      '<div class="qcard qresult" data-anim>' +
        '<div class="qeyebrow">A first glimpse of your pattern</div>' +
        '<div class="qresult-mark">' +
          '<svg viewBox="0 0 120 120" width="92" height="92" fill="none" aria-hidden="true">' +
            '<g stroke="#E84B8A" stroke-width="1" opacity="0.85">' +
              '<line x1="60" y1="14" x2="92" y2="44"/><line x1="92" y1="44" x2="80" y2="92"/>' +
              '<line x1="80" y1="92" x2="40" y2="92"/><line x1="40" y1="92" x2="28" y2="44"/>' +
              '<line x1="28" y1="44" x2="60" y2="14"/><line x1="28" y1="44" x2="80" y2="92"/>' +
              '<line x1="92" y1="44" x2="40" y2="92"/>' +
            '</g>' +
            '<g fill="#F6B9D2">' +
              '<circle cx="60" cy="14" r="3.4"/><circle cx="92" cy="44" r="3"/><circle cx="80" cy="92" r="3.4"/>' +
              '<circle cx="40" cy="92" r="2.6"/><circle cx="28" cy="44" r="3"/>' +
            '</g>' +
          '</svg>' +
        '</div>' +
        '<h3 class="qtitle qresult-name">' + R.name + '</h3>' +
        '<p class="qresult-line">' + R.line + '</p>' +
        '<div class="qresult-note">This is one thread of seven. Your full MoneyPattern maps how you save, plan, invest and respond \u2014 in about seven minutes.</div>' +
        '<a href="#" class="btn btn-gold qresult-cta">Reveal my full MoneyPattern</a>' +
        '<button class="qrestart">Take the glimpse again</button>' +
      '</div>';
    var rs = stage.querySelector('.qrestart');
    if (rs) rs.addEventListener('click', function () { step = 0; scores = {}; renderQ(); });
  }

  document.querySelectorAll('[data-open-quiz]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openQuiz(); });
  });
  overlay.querySelectorAll('[data-close-quiz]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); closeQuiz(); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeQuiz();
  });
})();
