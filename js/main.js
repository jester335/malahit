/* ── Малахит · main.js ─────────────────────────────────────────── */

/* ── Nav scroll ──────────────────────────────────────────────────── */
(function () {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Smooth scroll (data-scroll attribute) ───────────────────────── */
function smoothScrollTo(id) {
  if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-scroll]');
  if (!el) return;
  e.preventDefault();
  smoothScrollTo(el.dataset.scroll);
});

/* ── Reveal on scroll ────────────────────────────────────────────── */
(function () {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal, .reveal-stagger').forEach((el) => io.observe(el));
})();

/* ── Counter animation ───────────────────────────────────────────── */
(function () {
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const to = +el.dataset.to;
        const suffix = el.dataset.suffix || '';
        const dur = 1600;
        const start = performance.now();
        const suffixEl = el.querySelector('.suffix');
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const val = Math.round(ease(p) * to);
          if (suffixEl) {
            el.childNodes[0].textContent = val;
          } else {
            el.textContent = val + suffix;
          }
          if (p < 1) requestAnimationFrame(tick);
          else {
            if (suffixEl) el.childNodes[0].textContent = to;
            else el.textContent = to + suffix;
          }
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('.counter[data-to]').forEach((el) => io.observe(el));
})();

/* ── Hero 3D rotation ────────────────────────────────────────────── */
(function () {
  const vis = document.getElementById('heroVisual');
  const stage = document.getElementById('heroStage');
  if (!vis || !stage) return;

  const mouse = { x: 0, y: 0 };
  let curX = 0, curY = 0;

  const loop = () => {
    const tX = mouse.y * -8;
    const tY = mouse.x * 22;
    curX += (tX - curX) * 0.1;
    curY += (tY - curY) * 0.1;
    stage.style.transform = `rotateX(${curX.toFixed(2)}deg) rotateY(${curY.toFixed(2)}deg)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  vis.addEventListener('mousemove', (e) => {
    const r = vis.getBoundingClientRect();
    mouse.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    mouse.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  });
  vis.addEventListener('mouseleave', () => { mouse.x = 0; mouse.y = 0; });
})();

/* ── Carousel factory ────────────────────────────────────────────── */
function makeCarousel(track, prevBtn, nextBtn, N, GAP, getPerPage) {
  let perPage = getPerPage();
  let vIdx = N;
  let anim = true;

  function applyTransform() {
    track.style.transition = anim ? '' : 'none';
    track.style.transform = `translateX(calc(-1 * ${vIdx} * (100% + ${GAP}px) / ${perPage}))`;
    track.style.gridAutoColumns = `calc((100% - ${GAP * (perPage - 1)}px) / ${perPage})`;
  }

  track.addEventListener('transitionend', () => {
    if (vIdx >= 2 * N) {
      anim = false; vIdx -= N; applyTransform();
      requestAnimationFrame(() => requestAnimationFrame(() => { anim = true; applyTransform(); }));
    } else if (vIdx < N) {
      anim = false; vIdx += N; applyTransform();
      requestAnimationFrame(() => requestAnimationFrame(() => { anim = true; applyTransform(); }));
    }
  });

  prevBtn.addEventListener('click', () => { vIdx--; applyTransform(); });
  nextBtn.addEventListener('click', () => { vIdx++; applyTransform(); });

  window.addEventListener('resize', () => {
    const np = getPerPage();
    if (np !== perPage) { perPage = np; applyTransform(); }
  }, { passive: true });

  /* ── Swipe / drag ── */
  let dragStartX = null;
  let dragged = false;

  const clientX = (e) => e.touches ? e.touches[0].clientX : e.clientX;

  function onDragStart(e) {
    dragStartX = clientX(e);
    dragged = false;
  }

  function onDragMove(e) {
    if (dragStartX === null) return;
    const dx = clientX(e) - dragStartX;
    if (Math.abs(dx) > 5) dragged = true;
    track.style.transition = 'none';
    track.style.transform = `translateX(calc(-1 * ${vIdx} * (100% + ${GAP}px) / ${perPage} + ${dx}px))`;
  }

  function onDragEnd(e) {
    if (dragStartX === null) return;
    const ex = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = ex - dragStartX;
    dragStartX = null;
    const threshold = Math.max(50, track.parentElement.clientWidth / perPage / 4);
    if (dx < -threshold) vIdx++;
    else if (dx > threshold) vIdx--;
    applyTransform();
  }

  track.addEventListener('touchstart', onDragStart, { passive: true });
  track.addEventListener('touchmove', onDragMove, { passive: true });
  track.addEventListener('touchend', onDragEnd);
  track.addEventListener('touchcancel', () => { dragStartX = null; applyTransform(); });

  track.addEventListener('mousedown', (e) => { e.preventDefault(); onDragStart(e); });
  document.addEventListener('mousemove', (e) => { if (dragStartX !== null) onDragMove(e); });
  document.addEventListener('mouseup', (e) => { if (dragStartX !== null) onDragEnd(e); });

  // Подавляем клик на дочерних элементах после реального перетаскивания
  track.addEventListener('click', (e) => {
    if (dragged) { e.stopPropagation(); dragged = false; }
  }, true);

  applyTransform();
}

/* ── Services grid ───────────────────────────────────────────────── */
(function () {
  const grid = document.getElementById('svcGrid');
  if (!grid) return;

  const SERVICES = [
    {
      num: '01', title: 'Монтаж септиков под ключ',
      img: 'img/services/montaz.jpg',
      iconPath: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
    },
    {
      num: '02', title: 'Бурение скважин/подведение в дом',
      img: 'img/services/bur.jpg',
      iconPath: '<path d="M12 2c-3 4-6 7-6 12a6 6 0 0 0 12 0c0-5-3-8-6-12Z"/><path d="M9 16a3 3 0 0 0 3 2"/>',
    },
    {
      num: '03', title: 'Дренажные работы',
      img: 'img/services/podvedenie.jpg',
      iconPath: '<path d="M12 3v6"/><path d="M9 6h6"/><path d="M5 12c2 1 4 1 7 1s5 0 7-1"/><path d="M4 16c2 1.5 5 1.5 8 1.5s6 0 8-1.5"/><path d="M3 20c2.5 1.5 6 1.5 9 1.5s6.5 0 9-1.5"/>',
    },
    {
      num: '04', title: 'Ремонт и обслуживание септиков',
      img: 'img/services/septik.jpg',
      iconPath: '<path d="M12 2v8M10 4l2-2 2 2"/><rect x="8" y="10" width="8" height="4"/><path d="M10 14v8M14 14v8M12 14v8"/>',
    },
    {
      num: '05', title: 'Отопление дома',
      img: 'img/services/otoplenie.jpg',
      iconPath: '<path d="M8 2v20M12 2v20M16 2v20"/><rect x="5" y="6" width="14" height="12" rx="2"/>',
    },
    {
      num: '06', title: 'Водоподведение',
      img: 'img/services/vodopodved.png',
      iconPath: '<path d="M12 2C6 2 2 7 2 12c0 4.4 2.9 8.2 7 9.5V22h6v-.5c4.1-1.3 7-5.1 7-9.5 0-5-4-10-10-10Z"/><path d="M12 8v4l3 3"/>',
    },
  ];

  const svgAttrs = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  const arrowSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  grid.innerHTML = SERVICES.map((s) => `
    <article class="svc-card">
      <div class="svc-img">
        <img src="${s.img}" alt="${s.title}" loading="lazy" />
        <span class="svc-num-tag">${s.num}</span>
        <div class="svc-ico"><svg ${svgAttrs}>${s.iconPath}</svg></div>
      </div>
      <div class="svc-body">
        <h3 class="h-3">${s.title}</h3>
        <button class="svc-cta" data-modal="contact">Отправить заявку ${arrowSvg}</button>
      </div>
    </article>
  `).join('');
})();

/* ── Works carousel ──────────────────────────────────────────────── */
(function () {
  const track = document.getElementById('worksTrack');
  const prevBtn = document.getElementById('worksPrev');
  const nextBtn = document.getElementById('worksNext');
  if (!track || !prevBtn || !nextBtn) return;

  const WORKS = [
    { img: 'img/works/pushkino.png', label: 'Монтаж септика в Пушкино' },
    { img: 'img/works/dmitrov.png',  label: 'Дренажные работы + септик в Дмитрове' },
    { img: 'img/works/podolsk.png',  label: 'Бурение скважины в Подольске' },
  ];

  const triple = [...WORKS, ...WORKS, ...WORKS];
  track.innerHTML = triple.map((w) => `
    <article class="work-card">
      <div class="work-card-img">
        <img src="${w.img}" alt="${w.label}" loading="lazy" />
      </div>
      <div class="work-card-body">
        <p>${w.label}</p>
      </div>
    </article>
  `).join('');

  makeCarousel(
    track, prevBtn, nextBtn, WORKS.length, 18,
    () => window.innerWidth < 640 ? 1 : window.innerWidth < 980 ? 2 : 3
  );
})();

/* ── Brands carousel ─────────────────────────────────────────────── */
(function () {
  const track = document.getElementById('brandTrack');
  const prevBtn = document.getElementById('brandPrev');
  const nextBtn = document.getElementById('brandNext');
  if (!track || !prevBtn || !nextBtn) return;

  const BRANDS = [
    { name: 'Септик АОС МАЛАХИТ 4 ПР (насос в комплекте)',           price: 145000, img: 'img/septiki/Септик АОС МАЛАХИТ 4 ПР (насос в комплекте).webp' },
    { name: 'Септик АОС МАЛАХИТ АИР 3 ПР (насос в комплекте)',       price: 118000, img: 'img/septiki/Септик АОС МАЛАХИТ АИР 3 ПР (насос в комплекте).webp' },
    { name: 'Септик АОС МАЛАХИТ ГЕО 3 ПР (высота 1300, врезка 320)', price: 165000, img: 'img/septiki/Септик АОС МАЛАХИТ ГЕО 3 ПР (высота 1300, врезка 320).webp' },
    { name: 'Септик АОС МАЛАХИТ НЕРО 3',                              price: 140000, img: 'img/septiki/Септик АОС МАЛАХИТ НЕРО 3.webp' },
    { name: 'Септик АОС МАЛАХИТ 15 ПР (насос в комплекте)',           price: 355000, img: 'img/septiki/Септик АОС МАЛАХИТ 15 ПР (насос в комплекте).webp' },
  ];

  const fmt = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
  const triple = [...BRANDS, ...BRANDS, ...BRANDS];
  track.innerHTML = triple.map((b) => `
    <article class="brand-card">
      <div class="brand-img">
        <img src="${b.img}" alt="${b.name}" loading="lazy" />
      </div>
      <div class="brand-card-body">
        <h3>${b.name}</h3>
        <div class="brand-foot">
          <div class="price-blk"><b>${fmt(b.price)}</b></div>
          <button class="order" data-modal="contact">Заявка</button>
        </div>
      </div>
    </article>
  `).join('');

  makeCarousel(
    track, prevBtn, nextBtn, BRANDS.length, 18,
    () => window.innerWidth < 640 ? 1 : window.innerWidth < 980 ? 2 : window.innerWidth < 1240 ? 3 : 4
  );
})();

/* ── Phone mask ──────────────────────────────────────────────────── */
function maskPhone(raw) {
  let d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  let out = '+7';
  if (d.length > 1) out += ' (' + d.slice(1, 4);
  if (d.length >= 5) out += ') ' + d.slice(4, 7);
  if (d.length >= 8) out += '-' + d.slice(7, 9);
  if (d.length >= 10) out += '-' + d.slice(9, 11);
  return out;
}

/* ── Calculator wizard ───────────────────────────────────────────── */
(function () {
  const card = document.getElementById('calcCard');
  if (!card) return;

  const STEPS = [
    {
      key: 'object', q: 'Куда устанавливаем септик?',
      opts: [
        { v: 'cottage', l: 'Дача',          d: 'сезонный участок',    ico: 'home' },
        { v: 'house',   l: 'Дом / Коттедж', d: 'для проживания',      ico: 'building' },
        { v: 'hotel',   l: 'Гостиница',     d: 'база, отель',         ico: 'hotel' },
        { v: 'other',   l: 'Другое',        d: 'кафе, СТО, объект',   ico: 'more' },
      ],
    },
    {
      key: 'people', q: 'Сколько человек проживает?',
      opts: [
        { v: '2-3', l: '2–3 человека', d: 'небольшая семья', ico: 'p1' },
        { v: '4-5', l: '4–5 человек',  d: 'средняя семья',   ico: 'p2' },
        { v: '6-9', l: '6–9 человек',  d: 'большая семья',   ico: 'p3' },
        { v: '10+', l: '10 и более',   d: 'большой объект',  ico: 'p4' },
      ],
    },
    {
      key: 'usage', q: 'Тип проживания?',
      opts: [
        { v: 'perm',    l: 'Постоянное',  d: 'круглый год',       ico: 'sun' },
        { v: 'weekend', l: 'На выходных', d: 'наезды по пт–вс',   ico: 'cal' },
        { v: 'season',  l: 'Сезонное',    d: 'весна–осень',       ico: 'leaf' },
        { v: 'other',   l: 'Другое',      d: 'опишем при звонке', ico: 'more' },
      ],
    },
  ];

  const ICONS = {
    home:     '<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2"/>',
    hotel:    '<path d="M3 21V10l9-6 9 6v11"/><path d="M9 21v-6h6v6"/>',
    more:     '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    p1:       '<circle cx="12" cy="8" r="3"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>',
    p2:       '<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3 20c0-3 2-5 5-5s5 2 5 5M11 20c0-3 2-5 5-5s5 2 5 5"/>',
    p3:       '<circle cx="6" cy="8" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="18" cy="8" r="2"/><path d="M2 19c0-2 2-4 4-4M10 19c0-2 2-4 4-4M14 19c0-2 2-4 4-4"/>',
    p4:       '<path d="M9 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/><path d="M3 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0M17 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0"/><path d="M2 20c0-3 2-5 5-5M22 20c0-3-2-5-5-5M6 21c0-3 3-6 6-6s6 3 6 6"/>',
    sun:      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    cal:      '<rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 9h18M8 3v4M16 3v4"/>',
    leaf:     '<path d="M11 20A7 7 0 0 1 4 13c0-7 8-9 16-9 0 8-2 16-9 16Z"/><path d="M4 13c2-3 5-5 9-6"/>',
  };

  const icoSvg = (name) => {
    const paths = ICONS[name] || '';
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  };

  const checkSvg = (sz) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sz > 12 ? 2.5 : 3}" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
  const backSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  const state = { step: 0, answers: {}, name: '', phone: '', agree: false, touched: {}, done: false };
  const total = STEPS.length + 1;

  function progressDots() {
    return Array.from({ length: total }, (_, i) => {
      const cls = i < state.step ? 'done' : i === state.step ? 'active' : '';
      return `<span class="${cls}"></span>`;
    }).join('');
  }

  function answerLabels() {
    return STEPS.map((s) => {
      const opt = s.opts.find((o) => o.v === state.answers[s.key]);
      return opt ? `<span>${opt.l}</span>` : '';
    }).filter(Boolean).join('');
  }

  function render() {
    let inner = '';

    if (state.done) {
      inner = `
        <div class="calc-success calc-step-anim">
          <div class="ok">${checkSvg(32)}</div>
          <h3>Заявка принята</h3>
          <p>Инженер свяжется в течение 15 минут и подготовит детальный расчёт.</p>
          <button id="calcReset" class="calc-reset-btn">Заполнить ещё раз</button>
        </div>`;
    } else if (state.step < STEPS.length) {
      const s = STEPS[state.step];
      inner = `
        <div class="calc-step-anim" style="display:flex;flex-direction:column;flex:1">
          <div class="calc-step-label">Шаг ${state.step + 1} / ${total}</div>
          <h3 class="calc-q">${s.q}</h3>
          <div class="calc-opts">
            ${s.opts.map((opt) => {
              const sel = state.answers[s.key] === opt.v;
              return `<button class="calc-opt${sel ? ' is-selected' : ''}" data-key="${s.key}" data-val="${opt.v}">
                <span class="ico-l">${icoSvg(opt.ico)}</span>
                <span style="flex:1;min-width:0;font-weight:600">${opt.l}</span>
                <span class="check-r">${sel ? checkSvg(12) : ''}</span>
              </button>`;
            }).join('')}
          </div>
          <div class="calc-foot">
            ${state.step > 0
              ? `<button class="back" id="calcBack">${backSvg} Назад</button>`
              : '<span></span>'}
            <span class="step mono">0${state.step + 1} / 0${total}</span>
          </div>
        </div>`;
    } else {
      const phoneOk = state.phone.replace(/\D/g, '').length >= 10;
      const nameOk = state.name.trim().length >= 2;
      const canSubmit = phoneOk && nameOk && state.agree;
      inner = `
        <form class="calc-form calc-step-anim" id="calcForm">
          <div class="calc-step-label">Шаг ${total} / ${total} · последний</div>
          <h3 class="calc-q">Получите персональное предложение</h3>
          <p style="margin:-12px 0 8px;color:var(--muted);font-size:14px">Оставьте ваши контакты и в течение 15 минут свяжемся с вами.</p>
          <div class="summary">${answerLabels()}</div>
          <input type="text" class="calc-input${state.touched.name && !nameOk ? ' has-error' : ''}" id="calcName" placeholder="Ваше имя" value="${state.name.replace(/"/g, '&quot;')}"/>
          <input type="tel" class="calc-input${state.touched.phone && !phoneOk ? ' has-error' : ''}" id="calcPhone" placeholder="+7 (___) ___-__-__" value="${state.phone}"/>
          <button type="submit" class="submit-btn"${canSubmit ? '' : ' disabled'}>Получить предложение ${arrowSvg}</button>
          <label class="check-row">
            <input type="checkbox" id="calcAgree"${state.agree ? ' checked' : ''}/>
            <span>Нажимая кнопку, я соглашаюсь с Политикой конфиденциальности и даю согласие на обработку персональных данных.</span>
          </label>
          <div class="calc-foot" style="margin-top:auto">
            <button type="button" class="back" id="calcBack">${backSvg} Назад</button>
            <span class="step mono">0${total} / 0${total}</span>
          </div>
        </form>`;
    }

    card.innerHTML = `
      <div class="calc-progress">${progressDots()}</div>
      ${inner}`;

    card.querySelector('#calcReset')?.addEventListener('click', () => {
      Object.assign(state, { step: 0, answers: {}, name: '', phone: '', agree: false, touched: {}, done: false });
      render();
    });

    card.querySelector('#calcBack')?.addEventListener('click', () => { state.step = Math.max(0, state.step - 1); render(); });

    card.querySelectorAll('.calc-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.answers[btn.dataset.key] = btn.dataset.val;
        render();
        setTimeout(() => { state.step = Math.min(state.step + 1, total - 1); render(); }, 280);
      });
    });

    const nameInput = card.querySelector('#calcName');
    const phoneInput = card.querySelector('#calcPhone');
    const agreeInput = card.querySelector('#calcAgree');

    const updateCalcBtn = () => {
      const btn = card.querySelector('.submit-btn');
      if (btn) btn.disabled = !(
        state.phone.replace(/\D/g, '').length >= 10 &&
        state.name.trim().length >= 2 &&
        state.agree
      );
    };

    nameInput?.addEventListener('input', (e) => {
      state.name = e.target.value;
      updateCalcBtn();
    });
    nameInput?.addEventListener('blur', () => {
      state.touched.name = true;
      nameInput.classList.toggle('has-error', state.name.trim().length < 2);
    });

    phoneInput?.addEventListener('input', (e) => {
      const masked = maskPhone(e.target.value);
      state.phone = masked;
      e.target.value = masked;
      updateCalcBtn();
    });
    phoneInput?.addEventListener('blur', () => {
      state.touched.phone = true;
      phoneInput.classList.toggle('has-error', state.phone.replace(/\D/g, '').length < 10);
    });

    agreeInput?.addEventListener('change', (e) => {
      state.agree = e.target.checked;
      updateCalcBtn();
    });

    card.querySelector('#calcForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneOk = state.phone.replace(/\D/g, '').length >= 10;
      const nameOk = state.name.trim().length >= 2;
      if (!phoneOk || !nameOk || !state.agree) {
        state.touched = { name: true, phone: true, agree: true };
        render(); return;
      }
      state.done = true;
      render();
    });
  }

  render();
})();

/* ── Contact form ────────────────────────────────────────────────── */
(function () {
  const card = document.getElementById('contactCard');
  if (!card) return;

  const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  const checkSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  const state = { name: '', phone: '', comment: '', agree: false, touched: {}, sent: false };

  function render() {
    if (state.sent) {
      card.innerHTML = `
        <div class="calc-success calc-step-anim">
          <div class="ok">${checkSvg}</div>
          <h3>Заявка отправлена</h3>
          <p>Менеджер перезвонит вам в течение 15 минут.</p>
        </div>`;
      return;
    }

    const phoneOk = state.phone.replace(/\D/g, '').length >= 10;
    const nameOk = state.name.trim().length >= 2;
    const canSubmit = phoneOk && nameOk && state.agree;

    card.innerHTML = `
      <form class="calc-form" id="contactForm">
        <div class="form-head">
          <span class="calc-step-label">Форма заявки</span>
          <h3 class="calc-q" style="margin-top:8px">Оставьте заявку</h3>
          <p style="margin:0;font-size:14px;color:var(--ink-2)">Перезвоним в течение 15 минут, подберём решение и&nbsp;бесплатно выедем на замер.</p>
        </div>
        <input type="text" class="calc-input${state.touched.name && !nameOk ? ' has-error' : ''}" id="ctName" placeholder="Ваше имя" value="${state.name.replace(/"/g, '&quot;')}"/>
        <input type="tel" class="calc-input${state.touched.phone && !phoneOk ? ' has-error' : ''}" id="ctPhone" placeholder="+7 (___) ___-__-__" value="${state.phone}"/>
        <textarea class="calc-input" id="ctComment" rows="3" placeholder="Комментарий (необязательно)" style="resize:vertical;font-family:inherit">${state.comment}</textarea>
        <button type="submit" class="submit-btn"${canSubmit ? '' : ' disabled'}>Оставить заявку ${arrowSvg}</button>
        <label class="check-row">
          <input type="checkbox" id="ctAgree"${state.agree ? ' checked' : ''}/>
          <span>Согласен с Политикой конфиденциальности и обработкой персональных данных.</span>
        </label>
      </form>`;

    const ctName = card.querySelector('#ctName');
    const ctPhone = card.querySelector('#ctPhone');
    const ctComment = card.querySelector('#ctComment');
    const ctAgree = card.querySelector('#ctAgree');

    const updateContactBtn = () => {
      const btn = card.querySelector('.submit-btn');
      if (btn) btn.disabled = !(
        state.phone.replace(/\D/g, '').length >= 10 &&
        state.name.trim().length >= 2 &&
        state.agree
      );
    };

    ctName.addEventListener('input', (e) => {
      state.name = e.target.value;
      updateContactBtn();
    });
    ctName.addEventListener('blur', () => {
      state.touched.name = true;
      ctName.classList.toggle('has-error', state.name.trim().length < 2);
    });

    ctPhone.addEventListener('input', (e) => {
      const masked = maskPhone(e.target.value);
      state.phone = masked;
      e.target.value = masked;
      updateContactBtn();
    });
    ctPhone.addEventListener('blur', () => {
      state.touched.phone = true;
      ctPhone.classList.toggle('has-error', state.phone.replace(/\D/g, '').length < 10);
    });

    ctComment.addEventListener('input', (e) => { state.comment = e.target.value; });
    ctAgree.addEventListener('change', (e) => {
      state.agree = e.target.checked;
      updateContactBtn();
    });

    card.querySelector('#contactForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const phoneOk = state.phone.replace(/\D/g, '').length >= 10;
      const nameOk = state.name.trim().length >= 2;
      if (!phoneOk || !nameOk || !state.agree) {
        state.touched = { name: true, phone: true };
        render(); return;
      }
      state.sent = true;
      render();
    });
  }

  render();
})();

/* ── FAQ accordion ───────────────────────────────────────────────── */
(function () {
  const list = document.querySelector('.faq-list');
  if (!list) return;
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-q');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    list.querySelectorAll('.faq-item').forEach((el) => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
})();

/* ── Contact modal ───────────────────────────────────────────────── */
(function () {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  const closeBtn = document.getElementById('modalClose');
  if (!overlay || !content) return;

  const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  const checkSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

  const state = { name: '', phone: '', agree: false, touched: {}, sent: false };

  function renderModal() {
    if (state.sent) {
      content.innerHTML = `
        <div class="calc-success calc-step-anim" style="padding:40px">
          <div class="ok">${checkSvg}</div>
          <h3>Заявка отправлена</h3>
          <p>Менеджер перезвонит вам в течение 15 минут.</p>
        </div>`;
      return;
    }
    const phoneOk = state.phone.replace(/\D/g, '').length >= 10;
    const nameOk = state.name.trim().length >= 2;
    const canSubmit = phoneOk && nameOk && state.agree;
    content.innerHTML = `
      <form class="calc-form" id="modalForm" style="padding:40px">
        <div class="form-head">
          <span class="calc-step-label">Форма заявки</span>
          <h3 class="calc-q" style="margin-top:8px">Оставьте заявку</h3>
          <p style="margin:0;font-size:14px;color:var(--ink-2)">Перезвоним в течение 15 минут и&nbsp;бесплатно выедем на&nbsp;замер.</p>
        </div>
        <input type="text" class="calc-input${state.touched.name && !nameOk ? ' has-error' : ''}" id="mName" placeholder="Ваше имя" value="${state.name.replace(/"/g, '&quot;')}"/>
        <input type="tel" class="calc-input${state.touched.phone && !phoneOk ? ' has-error' : ''}" id="mPhone" placeholder="+7 (___) ___-__-__" value="${state.phone}"/>
        <button type="submit" class="submit-btn"${canSubmit ? '' : ' disabled'}>Отправить заявку ${arrowSvg}</button>
        <label class="check-row">
          <input type="checkbox" id="mAgree"${state.agree ? ' checked' : ''}/>
          <span>Согласен с Политикой конфиденциальности и обработкой персональных данных.</span>
        </label>
      </form>`;

    const mName = content.querySelector('#mName');
    const mPhone = content.querySelector('#mPhone');
    const mAgree = content.querySelector('#mAgree');

    const updateBtn = () => {
      const btn = content.querySelector('.submit-btn');
      if (btn) btn.disabled = !(state.phone.replace(/\D/g, '').length >= 10 && state.name.trim().length >= 2 && state.agree);
    };

    mName.addEventListener('input', (e) => { state.name = e.target.value; updateBtn(); });
    mName.addEventListener('blur', () => { state.touched.name = true; mName.classList.toggle('has-error', state.name.trim().length < 2); });
    mPhone.addEventListener('input', (e) => { const m = maskPhone(e.target.value); state.phone = m; e.target.value = m; updateBtn(); });
    mPhone.addEventListener('blur', () => { state.touched.phone = true; mPhone.classList.toggle('has-error', state.phone.replace(/\D/g, '').length < 10); });
    mAgree.addEventListener('change', (e) => { state.agree = e.target.checked; updateBtn(); });
    content.querySelector('#modalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (state.phone.replace(/\D/g, '').length < 10 || state.name.trim().length < 2 || !state.agree) {
        state.touched = { name: true, phone: true }; renderModal(); return;
      }
      state.sent = true; renderModal();
    });
  }

  function openModal() {
    state.name = ''; state.phone = ''; state.agree = false; state.touched = {}; state.sent = false;
    renderModal();
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-modal]');
    if (!el) return;
    e.preventDefault();
    openModal();
  });
})();

/* ── Cookie banner ──────────────────────────────────────────────── */
(function () {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  if (!localStorage.getItem('cookieConsent')) {
    banner.hidden = false;
  }
  document.getElementById('cookieAccept').addEventListener('click', function () {
    localStorage.setItem('cookieConsent', 'all');
    banner.hidden = true;
  });
  document.getElementById('cookieDecline').addEventListener('click', function () {
    localStorage.setItem('cookieConsent', 'necessary');
    banner.hidden = true;
  });
})();
