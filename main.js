/* Aurora Grand Palace — page interactions */
(function () {
  'use strict';

  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));
  const img = (id, w) => `https://images.unsplash.com/photo-${id}?w=${w || 900}&q=70&auto=format&fit=crop`;
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GST = 0.18;

  /* ---------- Data ---------- */
  const ROOMS = [
    { id: 'deluxe', name: 'Lake View Deluxe', price: 18500, size: '45 m²', guests: 2, bed: 'King bed', tag: 'Most booked', img: '1685592437742-3b56edb46b15' },
    { id: 'haveli', name: 'Heritage Haveli Room', price: 26000, size: '55 m²', guests: 3, bed: 'King + daybed', tag: 'Hand-painted frescoes', img: '1676193360975-c7a5d8bf064c' },
    { id: 'jharokha', name: 'Royal Jharokha Suite', price: 42000, size: '90 m²', guests: 3, bed: 'King four-poster', tag: 'Private balcony', img: '1731336250970-dc942b5e0746' },
    { id: 'maharaja', name: 'Maharaja Presidential Suite', price: 125000, size: '260 m²', guests: 6, bed: '3 bedrooms', tag: 'Private pool & butler', img: '1776763018972-588e27bf6511' },
  ];

  const EXPERIENCES = [
    { cat: 'On the lake', title: 'Sunset Shikara Ride', text: 'Glide past the City Palace and Jag Mandir at golden hour with masala chai.', price: 'From ₹3,500', img: '1615836245337-f5b9b2303f10' },
    { cat: 'Dining', title: 'Royal Rajasthani Thali', text: 'A 21-dish feast of dal baati churma, gatte ki sabzi and laal maas.', price: '₹4,200 per guest', img: '1728910156510-77488f19b152' },
    { cat: 'Wellness', title: 'Ayurveda Abhyanga', text: 'A warm-oil ritual for two by our Kerala-trained therapists.', price: 'From ₹7,800', img: '1775133263714-848c8fe09e73' },
    { cat: 'Heritage', title: 'City Palace Walk', text: 'Private guided tour of 400 years of Mewar history.', price: 'From ₹2,500', img: '1589901164570-f9de6556e1c1' },
    { cat: 'Excursion', title: 'Jaipur & Jal Mahal', text: 'A two-day royal escape to the Pink City with a vintage car transfer.', price: 'From ₹38,000', img: '1661924326425-c14a6426d989' },
    { cat: 'Leisure', title: 'Palace Pool Days', text: 'Cabanas, fresh nimbu pani and poolside chaat counters.', price: 'Included', img: '1695124571367-bfa0878685c5' },
    { cat: 'Adventure', title: 'Thar Desert Camp', text: 'Luxury tents, a camel safari and a folk night under the stars.', price: 'From ₹24,000', img: '1676193361264-4ae83499cb3f' },
    { cat: 'Sister Resort', title: 'Kerala Backwaters', text: 'Extend your journey on our private houseboat in Alleppey.', price: 'From ₹32,000', img: '1602216056096-3b40cc0c9944' },
  ];

  /* ---------- Toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3500);
  }

  /* ---------- Loader ---------- */
  const bar = $('#loaderBar');
  bar.style.width = '35%';
  let loaderDone = false;
  function hideLoader() {
    if (loaderDone) return;
    loaderDone = true;
    bar.style.width = '100%';
    setTimeout(() => $('#loader').classList.add('done'), 350);
  }
  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 2500); // never block on slow networks

  /* ---------- Hero video ---------- */
  const video = $('#heroVideo');
  const vToggle = $('#videoToggle');
  video.src = window.innerWidth > 900 ? 'assets/hero-1080.mp4' : 'assets/hero-720.mp4';
  let userPaused = reducedMotion;
  function setVideoBtn() {
    const paused = video.paused;
    vToggle.textContent = paused ? '▶' : '❚❚';
    vToggle.setAttribute('aria-label', paused ? 'Play video' : 'Pause video');
  }
  if (reducedMotion) { video.removeAttribute('autoplay'); video.pause(); }
  else { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  video.addEventListener('play', setVideoBtn);
  video.addEventListener('pause', setVideoBtn);
  vToggle.addEventListener('click', () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !userPaused) video.play().catch(() => {});
      else if (!en.isIntersecting) video.pause();
    }).observe($('#home'));
  }
  setVideoBtn();

  /* ---------- Navigation ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  function setMenu(open) {
    links.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(!links.classList.contains('open')));
  $$('a', links).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) setMenu(false); });

  const mobileBar = $('#mobileBar');
  const bookSection = $('#book');
  const sceneCard = $('#sceneCard');
  function onScroll() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    const bookTop = bookSection.getBoundingClientRect().top;
    const bookBottom = bookSection.getBoundingClientRect().bottom;
    const inBook = bookTop < window.innerHeight * 0.6 && bookBottom > 0;
    const sr = sceneCard.getBoundingClientRect();
    const in3D = sr.top < window.innerHeight && sr.bottom > 0;
    mobileBar.classList.toggle('show', y > window.innerHeight * 0.7 && !inBook && !in3D);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 3D Palace ---------- */
  const chips = $('#chips');
  const sceneOK = window.HotelScene && window.HotelScene.init($('#scene'), $('#hotspotLayer'), {
    onView(key, v) {
      $$('.chip').forEach((c) => c.classList.toggle('active', c.dataset.view === key));
      const card = $('#infoCard');
      if (v.title) {
        $('#infoTitle').textContent = v.title;
        $('#infoText').textContent = v.text;
        card.hidden = false;
      } else {
        card.hidden = true;
      }
      // keep the active chip visible without scrolling the page
      const active = $('.chip.active');
      if (active) chips.scrollTo({ left: active.offsetLeft - chips.clientWidth / 2 + active.offsetWidth / 2, behavior: 'smooth' });
    },
    onInteract() { $('#sceneHint').classList.add('hide'); },
  });

  if (!sceneOK) {
    $('#sceneCard').style.background = `center/cover url('${img('1633702738734-443da2c18f3c', 1400)}'), #1b1410`;
    $$('.chips-wrap, .scene-tools, .scene-hint').forEach((el) => { el.style.display = 'none'; });
  } else {
    $$('.chip').forEach((c) => c.addEventListener('click', () => HotelScene.flyTo(c.dataset.view)));
    $$('.chips-arrow').forEach((b) => b.addEventListener('click', () => {
      const keys = $$('.chip').map((c) => c.dataset.view);
      const cur = keys.indexOf(($('.chip.active') || {}).dataset ? $('.chip.active').dataset.view : 'overview');
      HotelScene.flyTo(keys[(cur + +b.dataset.dir + keys.length) % keys.length]);
    }));
    $('#infoClose').addEventListener('click', () => HotelScene.flyTo('overview'));

    const dn = $('#dayNight');
    function setNight(on) {
      HotelScene.setNight(on);
      dn.textContent = on ? '☀️' : '🌙';
      dn.setAttribute('aria-label', on ? 'Switch to golden hour' : 'Switch to night');
      dn.classList.toggle('on', on);
    }
    dn.addEventListener('click', () => setNight(!HotelScene.isNight()));
    const hr = new Date().getHours();
    if (hr >= 19 || hr < 6) setNight(true);

    const ar = $('#autoRotate');
    ar.classList.toggle('on', HotelScene.getAutoRotate());
    ar.addEventListener('click', () => {
      HotelScene.setAutoRotate(!HotelScene.getAutoRotate());
      ar.classList.toggle('on', HotelScene.getAutoRotate());
    });
  }

  /* ---------- Rooms ---------- */
  const grid = $('#roomGrid');
  grid.innerHTML = ROOMS.map((r) => `
    <article class="room reveal" data-id="${r.id}">
      <div class="room-img" style="background-image:url('${img(r.img, 800)}')"><span class="room-tag">${r.tag}</span></div>
      <div class="room-body">
        <h3>${r.name}</h3>
        <div class="room-meta"><span>📐 ${r.size}</span><span>👥 Up to ${r.guests}</span><span>🛏 ${r.bed}</span></div>
        <div class="room-foot">
          <div class="price"><b>${inr(r.price)}</b> <small>/ night</small></div>
          <button class="btn btn-gold" data-book="${r.id}">Select</button>
        </div>
      </div>
    </article>`).join('');

  if (window.matchMedia('(hover: hover)').matches && !reducedMotion) {
    $$('.room').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(10px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Pointer swipe helper (touch + mouse) ---------- */
  function swipeable(el, { onMove, onEnd }) {
    let sx = null, id = null, moved = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      sx = e.clientX; id = e.pointerId; moved = false;
    });
    el.addEventListener('pointermove', (e) => {
      if (sx === null || e.pointerId !== id) return;
      const dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 6) { moved = true; try { el.setPointerCapture(id); } catch (_) {} }
      if (moved && onMove) onMove(dx);
    });
    const end = (e) => {
      if (sx === null || e.pointerId !== id) return;
      const dx = e.clientX - sx;
      sx = null;
      if (onEnd) onEnd(moved ? dx : 0);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', (e) => { if (e.pointerId === id) { sx = null; if (onEnd) onEnd(0); } });
    // stop click-through after a drag
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
  }

  /* ---------- 3D Coverflow (experiences) ---------- */
  const cf = $('#coverflow'), stage = $('#cfStage'), cfDots = $('#cfDots');
  stage.innerHTML = EXPERIENCES.map((x, i) => `
    <article class="cf-item" data-i="${i}" style="--img:url('${img(x.img, 700)}')">
      <div><span>${x.cat}</span><h3>${x.title}</h3><p>${x.text}</p><em class="cf-price">${x.price}</em></div>
    </article>`).join('');
  const cfItems = $$('.cf-item', stage);
  const N = cfItems.length;
  cfDots.innerHTML = EXPERIENCES.map((_, i) => `<button aria-label="Experience ${i + 1}"></button>`).join('');
  let cfIndex = 0, cfTimer;

  function layoutCF(drag) {
    const w = cfItems[0].offsetWidth || 300;
    const spacing = Math.min(w * 0.62, window.innerWidth * 0.3);
    const pos = cfIndex - (drag || 0) / spacing;
    cfItems.forEach((el, i) => {
      let off = i - pos;
      if (off > N / 2) off -= N;
      if (off < -N / 2) off += N;
      const a = Math.abs(off);
      el.style.transform = `translateX(${off * spacing}px) translateZ(${-a * 160}px) rotateY(${-Math.max(-1.5, Math.min(1.5, off)) * 32}deg)`;
      el.style.opacity = a > 2.6 ? '0' : String(1 - a * 0.22);
      el.style.zIndex = String(100 - Math.round(a * 10));
      el.style.filter = a < 0.5 ? 'none' : `brightness(${1 - Math.min(a, 2) * 0.25})`;
      el.style.pointerEvents = a > 2.6 ? 'none' : 'auto';
      el.classList.toggle('active', a < 0.5);
    });
    $$('button', cfDots).forEach((d, k) => d.classList.toggle('active', k === ((cfIndex % N) + N) % N));
  }
  function goCF(i) { cfIndex = ((i % N) + N) % N; layoutCF(); restartCF(); }
  function restartCF() { clearInterval(cfTimer); if (!reducedMotion) cfTimer = setInterval(() => { cfIndex = (cfIndex + 1) % N; layoutCF(); }, 5000); }
  $('#cfPrev').addEventListener('click', () => goCF(cfIndex - 1));
  $('#cfNext').addEventListener('click', () => goCF(cfIndex + 1));
  $$('button', cfDots).forEach((d, k) => d.addEventListener('click', () => goCF(k)));
  cfItems.forEach((el, i) => el.addEventListener('click', () => { if (i !== cfIndex) goCF(i); }));
  swipeable(cf, {
    onMove(dx) { cf.classList.add('dragging'); clearInterval(cfTimer); layoutCF(dx); },
    onEnd(dx) {
      cf.classList.remove('dragging');
      const w = cfItems[0].offsetWidth || 300;
      const spacing = Math.min(w * 0.62, window.innerWidth * 0.3);
      const steps = Math.abs(dx) > 40 ? Math.max(1, Math.round(Math.abs(dx) / spacing)) * Math.sign(dx) : 0;
      goCF(cfIndex - steps);
    },
  });
  cf.addEventListener('mouseenter', () => clearInterval(cfTimer));
  cf.addEventListener('mouseleave', restartCF);
  cf.tabIndex = 0;
  cf.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goCF(cfIndex - 1);
    if (e.key === 'ArrowRight') goCF(cfIndex + 1);
  });
  window.addEventListener('resize', () => layoutCF());
  layoutCF(); restartCF();

  /* ---------- Reviews slider ---------- */
  const track = $('#reviewTrack'), dotsWrap = $('#reviewDots'), viewport = $('#reviewViewport');
  const slides = track.children.length;
  let slide = 0, slideTimer;
  dotsWrap.innerHTML = Array.from({ length: slides }, (_, i) => `<button aria-label="Review ${i + 1}"></button>`).join('');
  function goSlide(i) {
    slide = (i + slides) % slides;
    track.style.transition = '';
    track.style.transform = `translateX(-${slide * 100}%)`;
    $$('button', dotsWrap).forEach((d, k) => d.classList.toggle('active', k === slide));
    restartSlides();
  }
  function restartSlides() { clearInterval(slideTimer); if (!reducedMotion) slideTimer = setInterval(() => goSlide(slide + 1), 6000); }
  $$('button', dotsWrap).forEach((d, k) => d.addEventListener('click', () => goSlide(k)));
  $('#rvPrev').addEventListener('click', () => goSlide(slide - 1));
  $('#rvNext').addEventListener('click', () => goSlide(slide + 1));
  swipeable(viewport, {
    onMove(dx) {
      clearInterval(slideTimer);
      track.style.transition = 'none';
      track.style.transform = `translateX(calc(-${slide * 100}% + ${dx}px))`;
    },
    onEnd(dx) { goSlide(Math.abs(dx) > 50 ? slide + (dx < 0 ? 1 : -1) : slide); },
  });
  goSlide(0);

  /* ---------- Booking ---------- */
  const roomSel = $('#roomType');
  roomSel.innerHTML = ROOMS.map((r) => `<option value="${r.id}">${r.name} · ${inr(r.price)}</option>`).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-book]');
    if (!btn) return;
    roomSel.value = btn.dataset.book;
    updateSummary();
    bookSection.scrollIntoView({ behavior: 'smooth' });
  });

  const checkIn = $('#checkIn'), checkOut = $('#checkOut'), guests = $('#guests');
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };
  const todayISO = iso(new Date());
  const defIn = addDays(todayISO, 1), defOut = addDays(todayISO, 4);

  function wireDates(inEl, outEl, onChange) {
    inEl.min = todayISO; inEl.value = defIn;
    outEl.min = addDays(defIn, 1); outEl.value = defOut;
    inEl.addEventListener('change', () => {
      if (!inEl.value) return;
      outEl.min = addDays(inEl.value, 1);
      if (!outEl.value || outEl.value <= inEl.value) outEl.value = addDays(inEl.value, 1);
      if (onChange) onChange();
    });
    if (onChange) outEl.addEventListener('change', onChange);
  }

  function nights() {
    const n = Math.round((new Date(checkOut.value) - new Date(checkIn.value)) / 86400000);
    return isNaN(n) ? 0 : Math.max(0, n);
  }
  function updateSummary() {
    const room = ROOMS.find((r) => r.id === roomSel.value) || ROOMS[0];
    const n = nights();
    const base = room.price * n;
    $('#sumNights').textContent = `${n} night${n === 1 ? '' : 's'} × ${inr(room.price)}`;
    $('#sumBase').textContent = inr(base);
    $('#sumTax').textContent = inr(base * GST);
    $('#sumTotal').textContent = inr(base * (1 + GST));
  }
  wireDates(checkIn, checkOut, updateSummary);
  [roomSel, guests].forEach((el) => el.addEventListener('change', updateSummary));
  updateSummary();

  // Quick booking bar in the hero -> fills the main form
  wireDates($('#qbIn'), $('#qbOut'));
  $('#quickBook').addEventListener('submit', (e) => {
    e.preventDefault();
    checkIn.value = $('#qbIn').value || defIn;
    checkOut.min = addDays(checkIn.value, 1);
    checkOut.value = $('#qbOut').value > checkIn.value ? $('#qbOut').value : addDays(checkIn.value, 1);
    guests.value = $('#qbGuests').value;
    const fit = ROOMS.find((r) => r.guests >= +guests.value);
    if (fit && (ROOMS.find((r) => r.id === roomSel.value) || {}).guests < +guests.value) roomSel.value = fit.id;
    updateSummary();
    bookSection.scrollIntoView({ behavior: 'smooth' });
    toast(`✨ Rooms are available for ${nights()} night${nights() === 1 ? '' : 's'}. Choose your room below.`);
  });

  $('#bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = $('#formMsg');
    const name = $('#name'), email = $('#email'), phone = $('#phone');
    const room = ROOMS.find((r) => r.id === roomSel.value);
    [name, email, phone].forEach((el) => el.classList.remove('invalid'));

    let err = '';
    const digits = phone.value.replace(/\D/g, '');
    if (nights() < 1) err = 'Check-out must be after check-in.';
    else if (+guests.value > room.guests) err = `${room.name} sleeps up to ${room.guests} guests. Please choose a larger suite.`;
    else if (!name.value.trim()) { err = 'Please enter your name.'; name.classList.add('invalid'); }
    else if (!email.value || !email.checkValidity()) { err = 'Please enter a valid email.'; email.classList.add('invalid'); }
    else if (phone.value && (digits.length < 10 || digits.length > 13)) { err = 'Please enter a valid mobile number.'; phone.classList.add('invalid'); }

    msg.className = 'form-msg ' + (err ? 'err' : 'ok');
    if (err) { msg.textContent = err; return; }
    const ref = 'AGP-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    msg.textContent = `Request ${ref} received for ${room.name}. We'll confirm at ${email.value} within 2 hours.`;
    toast(`🙏 Dhanyavaad, ${name.value.trim().split(' ')[0]}! Request ${ref} received.`);
    e.target.reset();
    checkIn.value = defIn; checkOut.value = defOut;
    updateSummary();
  });

  $('#newsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    toast('📬 You\'re subscribed! Watch for our festive offers.');
    e.target.reset();
  });

  /* ---------- Reveal + counters ---------- */
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
    if (reducedMotion) { el.textContent = end.toFixed(dec); return; }
    const start = performance.now(), dur = 1600;
    (function step(now) {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = (end * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        const c = $('[data-count]', en.target);
        if (c) countUp(c);
        io.unobserve(en.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; io.observe(el); });
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  $('#year').textContent = new Date().getFullYear();
})();
