(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* stars */
  var star = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1 L12 7 L18 7.5 L13.5 11.5 L15 18 L10 14.5 L5 18 L6.5 11.5 L2 7.5 L8 7 Z"/></svg>';
  document.querySelectorAll('.stars').forEach(function(s){ s.innerHTML = star+star+star+star+star; });

  /* hero scroll progress + nav tone */
  var hero = document.getElementById('top'), panel = document.getElementById('hero-panel'), nav = document.getElementById('nav');
  var ticking = false;
  function onScroll(){
    if (!hero) { nav.setAttribute('data-tone', 'light'); ticking = false; return; }
    var r = hero.getBoundingClientRect();
    var span = Math.max(1, r.height - window.innerHeight);
    var p = Math.min(1, Math.max(0, -r.top / span));
    if (!reduce) panel.style.setProperty('--p', p.toFixed(4));
    nav.setAttribute('data-tone', r.bottom > 70 ? 'dark' : 'light');
    ticking = false;
  }
  window.addEventListener('scroll', function(){ if(!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  window.addEventListener('resize', onScroll);
  onScroll();

  /* full-screen banners (Product, About) */
  var openPM = null, openBtn = null;
  function setPM(pm, btn, o){
    if (o && openPM && openPM !== pm) setPM(openPM, openBtn, false);
    pm.classList.toggle('open', o); pm.setAttribute('aria-hidden', !o);
    btn.setAttribute('aria-expanded', o); btn.classList.toggle('on', o);
    document.body.style.overflow = o ? 'hidden' : '';
    if (o) { openPM = pm; openBtn = btn; pm.querySelector('.pm-card').focus(); }
    else { if (openPM === pm) openPM = openBtn = null; btn.focus({preventScroll:true}); }
  }
  document.querySelectorAll('[data-banner]').forEach(function(btn){
    var pm = document.getElementById(btn.getAttribute('data-banner'));
    if (!pm) return;
    btn.addEventListener('click', function(){ setPM(pm, btn, !pm.classList.contains('open')); });
    pm.querySelector('[data-close]').addEventListener('click', function(){ setPM(pm, btn, false); });
    pm.addEventListener('click', function(e){ if (e.target === pm || e.target.classList.contains('pm-inner')) setPM(pm, btn, false); });
    pm.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setPM(pm, btn, false); }); });
  });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && openPM) setPM(openPM, openBtn, false); });

  /* phones: sticky bottom CTA appears after the first screen, hides over the footer */
  var mcta = document.querySelector('.m-cta'), foot = document.querySelector('.foot');
  if (mcta) {
    var mTick = false;
    var mUpdate = function(){
      var past = window.scrollY > window.innerHeight * 0.6;
      var nearFoot = foot && foot.getBoundingClientRect().top < window.innerHeight;
      mcta.classList.toggle('show', past && !nearFoot);
      mTick = false;
    };
    window.addEventListener('scroll', function(){ if (!mTick) { mTick = true; requestAnimationFrame(mUpdate); } }, {passive:true});
    mUpdate();
  }

  /* legal pages: contents list open beside the text on wide screens, collapsed on phones */
  document.querySelectorAll('details.legal-toc').forEach(function(d){
    if (window.matchMedia('(min-width:901px)').matches) d.open = true;
    d.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ if (!window.matchMedia('(min-width:901px)').matches) d.open = false; }); });
  });

  /* reveals */
  var els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var d = +e.target.getAttribute('data-delay') || 0;
        setTimeout(function(){ e.target.classList.add('in'); }, d);
        io.unobserve(e.target);
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:.08});
    els.forEach(function(el){ io.observe(el); });
  } else els.forEach(function(el){ el.classList.add('in'); });

  /* feature tabs (auto-advance) */
  var ft = document.getElementById('ft');
  if (ft) {
  var tabs = ft.querySelectorAll('[data-tab]'), slides = ft.querySelectorAll('.ft-slide'), panels = ft.querySelectorAll('.ft-panel'), bars = ft.querySelectorAll('.ft-progress i');
  var cur = 0, timer;
  function show(i, manual){
    cur = i;
    tabs.forEach(function(t,k){ t.classList.toggle('on', k===i); t.setAttribute('aria-selected', k===i); });
    slides.forEach(function(s,k){ s.classList.toggle('on', k===i); });
    panels.forEach(function(s,k){ s.classList.toggle('on', k===i); });
    bars.forEach(function(b,k){ b.className = k<i ? 'done' : ''; });
    void bars[i].offsetWidth;
    if (manual) { clearInterval(timer); bars[i].className = 'done'; }
    else bars[i].className = 'on';
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ show(+t.getAttribute('data-tab'), true); }); });
  if (!reduce && 'IntersectionObserver' in window) {
    var started = false;
    new IntersectionObserver(function(en){
      if (en[0].isIntersecting && !started) {
        started = true; show(0);
        timer = setInterval(function(){ show((cur+1) % tabs.length); }, 7000);
      }
    }, {threshold:.4}).observe(ft);
  } else show(0, true);
  }

  /* centre-mode carousels */
  document.querySelectorAll('[data-car]').forEach(function(car){
    var track = car.querySelector('.car-track'), items = [].slice.call(car.querySelectorAll('.car-slide'));
    var count = car.querySelector('.car-count'), idx = 0, n = items.length;
    function layout(){
      var s = items[idx];
      var x = car.clientWidth/2 - (s.offsetLeft + s.offsetWidth/2);
      track.style.transform = 'translate3d(' + x + 'px,0,0)';
      items.forEach(function(el,k){
        var d = k - idx;
        el.className = 'car-slide' + (d===0 ? ' on' : d===-1 ? ' prev' : d===1 ? ' next' : ' far');
        el.setAttribute('aria-hidden', d!==0);
      });
      count.textContent = String(idx+1).padStart(2,'0') + ' / ' + String(n).padStart(2,'0');
    }
    function go(i){ idx = (i + n) % n; layout(); }
    car.querySelector('[data-prev]').addEventListener('click', function(){ go(idx-1); });
    car.querySelector('[data-next]').addEventListener('click', function(){ go(idx+1); });
    items.forEach(function(el,k){ el.addEventListener('click', function(){ if (k!==idx) go(k); }); });
    var sx = null;
    car.addEventListener('pointerdown', function(e){ sx = e.clientX; });
    car.addEventListener('pointerup', function(e){
      if (sx === null) return; var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    layout();
  });

  /* founder read more */
  var more = document.getElementById('fd-more'), tog = document.getElementById('fd-toggle');
  if (tog) tog.addEventListener('click', function(){
    var o = !more.classList.contains('open');
    more.classList.toggle('open', o); tog.setAttribute('aria-expanded', o);
    tog.textContent = o ? 'Show less' : 'Read the full story';
  });

  /* faq */
  document.querySelectorAll('.faq-item').forEach(function(item){
    var q = item.querySelector('.faq-q');
    q.addEventListener('click', function(){
      var o = !item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function(x){ x.classList.remove('open'); x.querySelector('.faq-q').setAttribute('aria-expanded', false); });
      item.classList.toggle('open', o); q.setAttribute('aria-expanded', o);
    });
  });
})();
