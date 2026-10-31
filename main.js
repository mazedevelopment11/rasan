(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  let lang = 'en';
  let activeCat = 'all';
  try { lang = localStorage.getItem('rasan-lang') || 'en'; } catch (e) {}

  const t = key => (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  const catName = id => (CATEGORIES.find(c => c.id === id) || {})[lang] || id;

  /* ── Language ── */
  function setLang(next) {
    lang = I18N[next] ? next : 'en';
    try { localStorage.setItem('rasan-lang', lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
    renderMarquee(); renderFilters(); renderProducts(); renderFooterCats();
  }
  $$('.lang-btn').forEach(b => b.addEventListener('click', () => { setLang(b.dataset.lang); closeMobile(); }));

  /* ── Marquee / filters / products ── */
  function renderMarquee() {
    const items = CATEGORIES.map(c => c[lang]).concat(lang === 'en' ? ['Soap', 'Vinegar'] : []);
    const html = items.map(n => `<span class="marquee-item">${n}</span>`).join('');
    $('#marquee').innerHTML = html + html + html + html;
  }
  function renderFilters() {
    const cats = [{ id: 'all', label: t('all') }].concat(CATEGORIES.map(c => ({ id: c.id, label: c[lang] })));
    $('#filters').innerHTML = cats.map(c =>
      `<button class="filter${c.id === activeCat ? ' active' : ''}" data-cat="${c.id}">${c.label}</button>`).join('');
  }
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.filter'); if (!b) return;
    activeCat = b.dataset.cat; renderFilters(); renderProducts();
  });
  function renderProducts() {
    const list = PRODUCTS.filter(p => activeCat === 'all' || p.cat === activeCat);
    $('#productGrid').innerHTML = list.map((p, i) => `
      <article class="product-card" style="animation-delay:${Math.min(i, 12) * 40}ms">
        <img src="assets/products/${p.img}.png" alt="${p[lang]}" loading="lazy" />
        <div class="product-cat">${catName(p.cat)}</div>
        <div class="product-name">${p[lang]}</div>
      </article>`).join('');
  }
  function renderFooterCats() {
    $('#footerCats').innerHTML = CATEGORIES.map(c =>
      `<li><a href="#products" data-cat="${c.id}">${c[lang]}</a></li>`).join('');
  }
  $('#footerCats').addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    activeCat = a.dataset.cat; renderFilters(); renderProducts();
  });

  /* ── Nav ── */
  const nav = $('#navbar');
  const onNav = () => nav.classList.toggle('scrolled', scrollY > 40);
  const mobile = $('#mobileMenu');
  function closeMobile() { mobile.classList.remove('open'); }
  $('#menuBtn').addEventListener('click', () => mobile.classList.add('open'));
  $('#menuClose').addEventListener('click', closeMobile);
  $$('.mobile-nav a').forEach(a => a.addEventListener('click', closeMobile));

  /* ── Counters ── */
  function countUp(el) {
    const end = +el.dataset.count, t0 = performance.now(), d = 1400;
    const step = now => {
      const k = Math.min((now - t0) / d, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ── Reveal ── */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('visible');
    $$('[data-count]', en.target).forEach(countUp);
    io.unobserve(en.target);
  }), { threshold: 0.15 });
  $$('.fade-up').forEach(el => io.observe(el));
  // The hero is revealed by the intro (or straight away when the intro is skipped)
  function revealHero() {
    $$('#hero .fade-up').forEach(el => {
      el.classList.add('visible'); $$('[data-count]', el).forEach(countUp); io.unobserve(el);
    });
  }

  /* ── Intro: logo draws itself, the dot drops like milk, then the curtain lifts ── */
  const intro = $('#intro');
  let seen = false;
  try { seen = sessionStorage.getItem('rasan-intro') === '1'; } catch (e) {}
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function endIntro() {
    if (intro.classList.contains('lift')) return;
    intro.classList.add('lift');
    document.body.classList.remove('intro-on');
    setTimeout(revealHero, 250);
    setTimeout(() => intro.classList.add('gone'), 1000);
    try { sessionStorage.setItem('rasan-intro', '1'); } catch (e) {}
  }
  async function playIntro() {
    document.body.classList.add('intro-on');
    intro.addEventListener('click', endIntro);
    const src = await fetch('logos/rasan.svg?v=7').then(r => r.text());
    const tmp = new DOMParser().parseFromString(src, 'image/svg+xml');
    const paths = [...tmp.querySelectorAll('path')].filter(p => !p.closest('clipPath'));
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '37 79 326 212');
    const ku = document.createElementNS(NS, 'g'), dot = document.createElementNS(NS, 'g'), lat = document.createElementNS(NS, 'g');
    ku.setAttribute('class', 'ku'); dot.setAttribute('class', 'dot'); lat.setAttribute('class', 'lat');
    // Paths 0–4 are the Kurdish wordmark (3 is the round dot); 5+ are the Latin "Rasan"
    paths.forEach((p, i) => {
      const c = document.importNode(p, true);
      c.removeAttribute('fill');
      (i === 3 ? dot : i < 5 ? ku : lat).appendChild(c);
    });
    svg.append(ku, dot, lat);
    $('#introLogo').appendChild(svg);
    $$('path', ku).forEach(p => {
      const L = p.getTotalLength();
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      p.getBoundingClientRect();
      p.style.transition = 'stroke-dashoffset 1.1s ease-in-out';
      p.style.strokeDashoffset = 0;
    });
    $$('path', lat).forEach((p, i) => { p.style.animationDelay = i * 70 + 'ms'; });
    setTimeout(() => intro.classList.add('fill'), 100);
    setTimeout(() => ku.classList.add('drawn'), 1000);
    setTimeout(() => dot.classList.add('drop'), 1150);
    setTimeout(() => lat.classList.add('show'), 1600);
    setTimeout(endIntro, 2900);
  }
  if (seen || reduce) { intro.classList.add('gone'); requestAnimationFrame(revealHero); }
  else playIntro().catch(endIntro);

  /* ── Farm-to-table scene: the tanker drives along the road as you scroll ── */
  const scene = $('#scene'), truck = $('#truck');
  const stops = [40, 330, 600, 900, 1040];          // truck x at farm → kitchen
  const stations = $$('.st', scene), steps = $$('.step');
  function onJourney() {
    const r = scene.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.85 - r.top) / (innerHeight * 0.75)));
    const x = stops[0] + (stops[stops.length - 1] - stops[0]) * p;
    truck.setAttribute('transform', `translate(${x} 0)`);
    scene.style.setProperty('--roll', (x * 4) + 'deg');
    // a station lights up once the truck reaches it (the farm is lit from the start)
    const reached = [0, 0.27, 0.55, 0.96].filter(t => p >= t).length - 1;
    stations.forEach((g, i) => g.classList.toggle('on', i <= reached));
    steps.forEach((s, i) => s.classList.toggle('on', i === reached));
  }

  /* ── Testimonials ── */
  const track = $('#voicesTrack');
  const slide = dir => {
    const w = track.firstElementChild.offsetWidth + 20;
    track.scrollBy({ left: dir * w * (document.documentElement.dir === 'rtl' ? -1 : 1), behavior: 'smooth' });
  };
  $('#vPrev').addEventListener('click', () => slide(-1));
  $('#vNext').addEventListener('click', () => slide(1));

  /* ── Newsletter (front-end only for now) ── */
  $('#newsletter').addEventListener('submit', e => {
    e.preventDefault();
    $('#newsletterNote').textContent = t('cta_ok');
    e.target.reset();
  });

  $('#year').textContent = new Date().getFullYear();

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { onNav(); onJourney(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onJourney);

  setLang(lang);
  onNav(); onJourney();
})();
