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
  // Hero is always in view on load — reveal it without waiting for the observer
  requestAnimationFrame(() => $$('#hero .fade-up').forEach(el => {
    el.classList.add('visible'); $$('[data-count]', el).forEach(countUp); io.unobserve(el);
  }));

  /* ── Journey: draw the path as you scroll ── */
  const stage = $('#journeyStage'), draw = $('#jDraw'), drop = $('#jDrop');
  const stations = $$('.station', stage);
  const len = draw.getTotalLength();
  draw.style.strokeDasharray = len;
  // Arc-length position of each station along the path
  const stops = stations.map(st => {
    const sx = parseFloat(st.style.left) / 100 * 1200, sy = parseFloat(st.style.top) / 100 * 420;
    let best = 0, bd = Infinity;
    for (let l = 0; l <= len; l += 4) {
      const p = draw.getPointAtLength(l), d = (p.x - sx) ** 2 + (p.y - sy) ** 2;
      if (d < bd) { bd = d; best = l; }
    }
    return best / len;
  });
  function onJourney() {
    const r = stage.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (innerHeight * 0.72 - r.top) / (r.height * 0.9)));
    draw.style.strokeDashoffset = len * (1 - p);
    const pt = draw.getPointAtLength(len * p);
    drop.setAttribute('cx', pt.x); drop.setAttribute('cy', pt.y);
    stage.style.setProperty('--p', p);
    stations.forEach((st, i) => st.classList.toggle('on', p >= stops[i] - 0.02));
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
