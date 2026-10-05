/* Aurora Grand Palace — dining menu, allergies, dish customisation, order checkout, token & receipt */
(function () {
  'use strict';

  const $ = (s, root) => (root || document).querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));
  const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const inr2 = (n) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FOOD_GST = 0.05;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
  };

  /* ---------- Allergens ---------- */
  const ALLERGENS = {
    dairy: { label: 'Dairy', icon: '🥛' },
    nuts: { label: 'Nuts', icon: '🥜' },
    gluten: { label: 'Gluten', icon: '🌾' },
    egg: { label: 'Egg', icon: '🥚' },
    fish: { label: 'Fish', icon: '🐟' },
    shellfish: { label: 'Shellfish', icon: '🦐' },
    soy: { label: 'Soy', icon: '🌱' },
    sesame: { label: 'Sesame', icon: '⚪' },
    mustard: { label: 'Mustard', icon: '🟡' },
  };

  /* ---------- Menu ----------
     n name · d description · p price · v veg · s chef's special · a allergens · h spice adjustable */
  const MENU = [
    { cat: 'Breakfast', type: 'food', items: [
      { n: 'Poha & Jalebi', d: 'Indori-style flattened rice with sev and pomegranate, served with saffron jalebi', p: 650, v: 1, a: ['gluten', 'mustard'], h: 1 },
      { n: 'Masala Dosa', d: 'Crisp rice crêpe, potato masala, sambar and three chutneys', p: 750, v: 1, a: ['mustard'], h: 1 },
      { n: 'Aloo Paratha Platter', d: 'Tandoor-baked parathas with white butter, curd and achaar', p: 700, v: 1, a: ['gluten', 'dairy', 'mustard'], h: 1 },
      { n: 'Pyaaz Kachori', d: 'A Rajasthani street-food classic with tamarind chutney', p: 550, v: 1, s: 1, a: ['gluten'], h: 1 },
      { n: 'Idli Vada Sambar', d: 'Steamed rice cakes and crisp lentil doughnuts with coconut chutney', p: 600, v: 1, a: ['mustard'], h: 1 },
      { n: 'Chole Bhature', d: 'Spiced chickpeas with fluffy fried bread, onion and pickle', p: 750, v: 1, a: ['gluten', 'dairy'], h: 1 },
      { n: 'Parsi Akuri on Toast', d: 'Spiced scrambled eggs with green chilli and coriander', p: 800, v: 0, a: ['egg', 'gluten', 'dairy'], h: 1 },
      { n: 'Masala Omelette', d: 'Three-egg omelette with onion, tomato, chilli and toast', p: 650, v: 0, a: ['egg', 'gluten'], h: 1 },
    ] },
    { cat: 'Chaat & Starters', type: 'food', items: [
      { n: 'Raj Kachori Chaat', d: 'Giant crisp puri filled with curd, chutneys, sprouts and pomegranate', p: 650, v: 1, s: 1, a: ['gluten', 'dairy'], h: 1 },
      { n: 'Pani Puri Shots', d: 'Six puris with spiced mint water, served chilled', p: 450, v: 1, a: ['gluten'], h: 1 },
      { n: 'Dahi Bhalla', d: 'Soft lentil dumplings in sweet curd with roasted cumin', p: 550, v: 1, a: ['dairy'], h: 1 },
      { n: 'Mirchi Vada', d: 'Jodhpuri stuffed green chilli fritters with mint chutney', p: 500, v: 1, a: ['gluten'], h: 1 },
      { n: 'Hara Bhara Kebab', d: 'Spinach, pea and paneer patties on the tawa', p: 750, v: 1, a: ['dairy', 'nuts'], h: 1 },
      { n: 'Amritsari Fish Fry', d: 'Carom-spiced batter-fried river sole with lemon', p: 1350, v: 0, a: ['fish', 'gluten', 'egg'], h: 1 },
      { n: 'Chicken 65', d: 'Fiery curry-leaf fried chicken, Chennai style', p: 1150, v: 0, a: ['egg', 'mustard'], h: 1 },
      { n: 'Mutton Seekh Kebab', d: 'Hand-minced lamb skewers from the charcoal grill', p: 1450, v: 0, a: ['dairy'], h: 1 },
    ] },
    { cat: 'Rajasthani Royal', type: 'food', items: [
      { n: 'Laal Maas', d: 'The fiery Mewari mutton curry with mathania chillies, slow-cooked for six hours', p: 2450, v: 0, s: 1, a: ['dairy'], h: 1 },
      { n: 'Dal Baati Churma', d: 'Baked wheat dumplings, five-lentil dal and sweet churma with ghee', p: 1350, v: 1, s: 1, a: ['gluten', 'dairy', 'nuts'], h: 1 },
      { n: 'Gatte ki Sabzi', d: 'Gram-flour dumplings in a tangy yoghurt curry', p: 1150, v: 1, a: ['dairy'], h: 1 },
      { n: 'Ker Sangri', d: 'Desert berries and beans tempered with dry spices', p: 1100, v: 1, a: ['mustard'], h: 1 },
      { n: 'Safed Maas', d: 'Royal white mutton curry with cashew, cream and cardamom', p: 2350, v: 0, a: ['dairy', 'nuts'], h: 1 },
      { n: 'Jungli Maas', d: 'A hunter-style mutton curry with only ghee, chilli and salt', p: 2400, v: 0, a: ['dairy'], h: 1 },
      { n: 'Papad ki Sabzi', d: 'Roasted papad simmered in a spiced curd gravy', p: 950, v: 1, a: ['dairy'], h: 1 },
      { n: 'Royal Thali (21 dishes)', d: 'A full royal spread served on silver, with unlimited refills', p: 4200, v: 1, a: ['gluten', 'dairy', 'nuts', 'mustard'], h: 1 },
    ] },
    { cat: 'Tandoor', type: 'food', items: [
      { n: 'Paneer Tikka Ajwaini', d: 'Cottage cheese marinated in carom and hung curd', p: 1250, v: 1, a: ['dairy'], h: 1 },
      { n: 'Tandoori Soya Chaap', d: 'Smoky soya skewers in a malai marinade', p: 1050, v: 1, a: ['soy', 'dairy', 'gluten'], h: 1 },
      { n: 'Bhutte ke Kebab', d: 'Corn and green pea kebabs with mint chutney', p: 1050, v: 1, a: [], h: 1 },
      { n: 'Murgh Malai Tikka', d: 'Chicken in cream cheese, cardamom and mace', p: 1450, v: 0, a: ['dairy'], h: 1 },
      { n: 'Tandoori Chicken (Half)', d: 'Classic red-marinated chicken from the clay oven', p: 1350, v: 0, a: ['dairy', 'mustard'], h: 1 },
      { n: 'Tandoori Jhinga', d: 'Jumbo prawns with Kashmiri chilli and garlic', p: 2650, v: 0, s: 1, a: ['shellfish', 'dairy'], h: 1 },
      { n: 'Tandoori Pomfret', d: 'Whole pomfret with ajwain and lemon', p: 2250, v: 0, a: ['fish', 'dairy'], h: 1 },
      { n: 'Raan-e-Aurora', d: 'Whole leg of lamb braised overnight and finished in the tandoor (serves 2)', p: 4800, v: 0, a: ['dairy', 'nuts'], h: 1 },
    ] },
    { cat: 'Biryani & Rice', type: 'food', items: [
      { n: 'Hyderabadi Dum Biryani (Mutton)', d: 'Sealed-pot biryani with saffron, fried onion, mirchi ka salan and raita', p: 1950, v: 0, s: 1, a: ['dairy', 'nuts', 'sesame'], h: 1 },
      { n: 'Lucknowi Chicken Biryani', d: 'Fragrant awadhi biryani with rose water and kewra', p: 1650, v: 0, a: ['dairy', 'nuts'], h: 1 },
      { n: 'Subz Dum Biryani', d: 'Seasonal vegetables and paneer layered with basmati', p: 1350, v: 1, a: ['dairy', 'nuts'], h: 1 },
      { n: 'Prawn Pulao', d: 'Konkan-style coconut prawn pulao', p: 1850, v: 0, a: ['shellfish'], h: 1 },
      { n: 'Jeera Rice', d: 'Basmati tempered with cumin and ghee', p: 450, v: 1, a: ['dairy'], h: 0 },
      { n: 'Curd Rice', d: 'Cooling South Indian curd rice with pomegranate', p: 500, v: 1, a: ['dairy', 'mustard'], h: 0 },
    ] },
    { cat: 'Coastal & South', type: 'food', items: [
      { n: 'Kerala Meen Curry', d: 'Kingfish in a kokum and coconut gravy with appam', p: 1950, v: 0, a: ['fish', 'mustard'], h: 1 },
      { n: 'Chettinad Chicken', d: 'Black pepper and stone-ground spice masala', p: 1650, v: 0, a: ['mustard'], h: 1 },
      { n: 'Goan Prawn Balchão', d: 'Tangy, spicy prawn pickle curry with poi bread', p: 2100, v: 0, s: 1, a: ['shellfish', 'gluten'], h: 1 },
      { n: 'Malabar Crab Roast', d: 'Mud crab in a shallot, pepper and coconut oil roast', p: 2650, v: 0, a: ['shellfish', 'mustard'], h: 1 },
      { n: 'Avial with Red Rice', d: 'Mixed vegetables in coconut and curd, Kerala style', p: 1150, v: 1, a: ['dairy'], h: 1 },
      { n: 'Sadya Bites', d: 'Olan, thoran and pachadi served on banana leaf', p: 1250, v: 1, a: ['dairy', 'mustard'], h: 1 },
      { n: 'Paneer Butter Masala', d: 'Cottage cheese in a velvety tomato, butter and cashew gravy', p: 1250, v: 1, a: ['dairy', 'nuts'], h: 1 },
    ] },
    { cat: 'Breads', type: 'food', items: [
      { n: 'Butter Naan', d: 'Leavened tandoor bread brushed with butter', p: 250, v: 1, a: ['gluten', 'dairy'], h: 0 },
      { n: 'Garlic Kulcha', d: 'Stuffed bread with garlic and coriander', p: 300, v: 1, a: ['gluten', 'dairy'], h: 0 },
      { n: 'Laccha Paratha', d: 'Flaky layered whole-wheat paratha', p: 250, v: 1, a: ['gluten', 'dairy'], h: 0 },
      { n: 'Missi Roti', d: 'Gram flour and wheat roti with ajwain', p: 220, v: 1, a: ['gluten'], h: 0 },
      { n: 'Bajra Roti', d: 'Rajasthani millet flatbread with white butter (gluten-free)', p: 250, v: 1, a: ['dairy'], h: 0 },
      { n: 'Breads Basket', d: 'Butter naan, laccha paratha, missi roti and garlic kulcha', p: 600, v: 1, a: ['gluten', 'dairy'], h: 0 },
    ] },
    { cat: 'Desserts', type: 'sweet', items: [
      { n: 'Ghevar with Rabri', d: 'A honeycomb disc of Rajasthani festive sweet with saffron rabri', p: 750, v: 1, s: 1, a: ['gluten', 'dairy', 'nuts'] },
      { n: 'Kesar Pista Kulfi', d: 'Slow-reduced milk ice cream with falooda', p: 650, v: 1, a: ['dairy', 'nuts'] },
      { n: 'Gulab Jamun Brûlée', d: 'Warm gulab jamun under a crackling sugar crust', p: 700, v: 1, a: ['gluten', 'dairy'] },
      { n: 'Moong Dal Halwa', d: 'Rich, ghee-roasted lentil halwa with almonds', p: 650, v: 1, a: ['dairy', 'nuts'] },
      { n: 'Rasmalai', d: 'Soft chenna discs in cardamom and saffron milk', p: 650, v: 1, a: ['dairy', 'nuts'] },
      { n: 'Gajar ka Halwa', d: 'Slow-cooked carrot halwa with khoya (winter special)', p: 600, v: 1, a: ['dairy', 'nuts'] },
      { n: 'Mango Sorbet', d: 'Alphonso mango sorbet, dairy-free and vegan', p: 550, v: 1, a: [] },
    ] },
    { cat: 'Beverages', type: 'drink', items: [
      { n: 'Masala Chai', d: 'Our house blend brewed with ginger, cardamom and fresh milk', p: 350, v: 1, a: ['dairy'] },
      { n: 'Filter Coffee', d: 'Kumbakonam degree coffee served in a dabarah', p: 400, v: 1, a: ['dairy'] },
      { n: 'Rose & Saffron Thandai', d: 'Chilled milk with nuts, fennel and rose petals', p: 550, v: 1, a: ['dairy', 'nuts'] },
      { n: 'Mango Lassi', d: 'Alphonso mango blended with thick curd', p: 450, v: 1, a: ['dairy'] },
      { n: 'Masala Chaas', d: 'Spiced buttermilk with roasted cumin and mint', p: 350, v: 1, a: ['dairy'] },
      { n: 'Nimbu Soda', d: 'Fresh lime, sweet or salted, with roasted cumin', p: 350, v: 1, a: [] },
      { n: 'Tender Coconut Water', d: 'Served in the shell, straight from Kerala', p: 400, v: 1, a: [] },
      { n: 'The Maharana', d: 'Signature mocktail of kokum, tulsi, ginger and tonic', p: 650, v: 1, s: 1, a: [] },
    ] },
  ];
  // flatten with ids
  const DISHES = [];
  MENU.forEach((c, ci) => c.items.forEach((d, di) => { d.id = ci + '-' + di; d.cat = c.cat; d.type = c.type; DISHES.push(d); }));
  const byId = (id) => DISHES.find((d) => d.id === id);

  const SPICE = [
    { k: 'mild', label: 'Mild', icon: '🌶' },
    { k: 'medium', label: 'Medium', icon: '🌶🌶' },
    { k: 'spicy', label: 'Spicy', icon: '🌶🌶🌶' },
    { k: 'extra', label: 'Extra hot', icon: '🔥' },
  ];
  const PREFS = {
    food: ['Less oil', 'Less salt', 'Jain (no onion & garlic)', 'No onion', 'Extra gravy', 'Well done', 'No coriander', 'Pack for kids (no chilli)'],
    sweet: ['Less sweet', 'Sugar-free', 'Serve warm', 'No dry-fruit garnish', 'Extra rabri'],
    drink: ['Less sugar', 'No sugar', 'No ice', 'Extra hot', 'Oat milk instead of dairy'],
  };

  /* ---------- State ---------- */
  let cart = store.get('agp_cart', []);
  let allergies = store.get('agp_allergies', []);
  const savedCheckout = store.get('agp_checkout', {});
  let activeCat = MENU[0].cat;

  function saveCart() { store.set('agp_cart', cart); updateCartUI(); }
  const conflicts = (d) => d.a.filter((x) => allergies.indexOf(x) >= 0);
  const cartCount = () => cart.reduce((n, i) => n + i.qty, 0);
  const subTotal = () => cart.reduce((n, i) => n + i.qty * i.price, 0);
  const qtyInCart = (id) => cart.filter((i) => i.id === id).reduce((n, i) => n + i.qty, 0);

  /* ---------- Toast (shared element) ---------- */
  const toastEl = $('#toast');
  let tt;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(() => toastEl.classList.remove('show'), 3000);
  }

  /* ---------- Sheets (modal panels) ---------- */
  let lastFocus = null;
  function openSheet(el) {
    lastFocus = document.activeElement;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('open'));
    document.body.classList.add('sheet-open');
    const f = $('input, select, textarea, button:not(.sheet-close)', el);
    if (f && window.matchMedia('(hover: hover)').matches) setTimeout(() => f.focus({ preventScroll: true }), 300);
  }
  function closeSheet(el) {
    el.classList.remove('open');
    setTimeout(() => {
      el.hidden = true;
      if (!$$('.sheet.open').length) document.body.classList.remove('sheet-open');
    }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  $$('.sheet').forEach((sh) => sh.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(sh); }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $$('.sheet.open');
    if (open.length) closeSheet(open[open.length - 1]);
  });

  /* ---------- Allergy chips ---------- */
  const chipWrap = $('#allergyChips');
  function renderAllergyChips(target) {
    target.innerHTML = Object.keys(ALLERGENS).map((k) => {
      const on = allergies.indexOf(k) >= 0;
      return `<button type="button" class="a-chip${on ? ' on' : ''}" data-allergen="${k}" aria-pressed="${on}">${ALLERGENS[k].icon} ${ALLERGENS[k].label}</button>`;
    }).join('');
  }
  function toggleAllergen(k) {
    const i = allergies.indexOf(k);
    if (i >= 0) allergies.splice(i, 1); else allergies.push(k);
    store.set('agp_allergies', allergies);
    renderAllergyChips(chipWrap);
    const cartChips = $('#cartAllergyChips');
    if (cartChips) { renderAllergyChips(cartChips); renderCartWarnings(); }
    renderMenu();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.a-chip');
    if (b) toggleAllergen(b.dataset.allergen);
  });
  renderAllergyChips(chipWrap);
  const hideToggle = $('#hideAllergens');
  hideToggle.checked = !!store.get('agp_hide', false);
  hideToggle.addEventListener('change', () => { store.set('agp_hide', hideToggle.checked); renderMenu(); });

  /* ---------- Menu tabs + list ---------- */
  const tabs = $('#menuTabs'), list = $('#menuList'), search = $('#menuSearch');
  tabs.innerHTML = MENU.map((c) => `<button class="menu-tab${c.cat === activeCat ? ' active' : ''}" role="tab" aria-selected="${c.cat === activeCat}" data-cat="${c.cat}">${c.cat} <small>${c.items.length}</small></button>`).join('');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.menu-tab');
    if (!b) return;
    activeCat = b.dataset.cat;
    search.value = '';
    $$('.menu-tab', tabs).forEach((t) => { t.classList.toggle('active', t === b); t.setAttribute('aria-selected', String(t === b)); });
    tabs.scrollTo({ left: b.offsetLeft - tabs.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' });
    renderMenu(true);
  });
  let searchTimer;
  search.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => renderMenu(true), 150); });

  function dishHTML(d, showCat) {
    const c = conflicts(d);
    const q = qtyInCart(d.id);
    const tags = d.a.map((k) => `<span class="a-tag${allergies.indexOf(k) >= 0 ? ' hit' : ''}" title="${ALLERGENS[k].label}">${ALLERGENS[k].icon} ${ALLERGENS[k].label}</span>`).join('');
    return `
      <div class="dish${c.length ? ' warn' : ''}" data-id="${d.id}">
        <div class="dish-top"><i class="${d.v ? 'veg' : 'nonveg'}" title="${d.v ? 'Vegetarian' : 'Non-vegetarian'}"></i><h4>${esc(d.n)}${d.s ? ' ⭐' : ''}${d.h ? ' <span class="chili" title="Spice adjustable">🌶</span>' : ''}</h4><span class="dots-line"></span><span class="amt">${inr(d.p)}</span></div>
        <p>${showCat ? `<em class="dish-cat">${d.cat} · </em>` : ''}${esc(d.d)}</p>
        ${c.length ? `<div class="dish-warn">⚠ Contains ${c.map((k) => ALLERGENS[k].label.toLowerCase()).join(', ')} (your allergy)</div>` : ''}
        <div class="dish-foot">
          <div class="a-tags">${tags || '<span class="a-tag free">✓ No major allergens</span>'}</div>
          <button class="add-btn${q ? ' in' : ''}" type="button" data-add="${d.id}">${q ? `✓ ${q} added · Add more` : '+ Add'}</button>
        </div>
      </div>`;
  }

  function renderMenu(animate) {
    const q = search.value.trim().toLowerCase();
    let items = q
      ? DISHES.filter((d) => (d.n + ' ' + d.d + ' ' + d.cat).toLowerCase().indexOf(q) >= 0)
      : (MENU.find((c) => c.cat === activeCat) || MENU[0]).items;
    const hidden = hideToggle.checked ? items.filter((d) => conflicts(d).length).length : 0;
    if (hideToggle.checked) items = items.filter((d) => !conflicts(d).length);
    tabs.classList.toggle('dim', !!q);
    let html = items.map((d) => dishHTML(d, !!q)).join('');
    if (!items.length) html = `<div class="menu-empty">${q ? `No dishes match “${esc(q)}”.` : 'All dishes in this section contain your selected allergens.'}</div>`;
    if (hidden) html += `<div class="menu-hidden-note">${hidden} dish${hidden > 1 ? 'es' : ''} hidden because of your allergies.</div>`;
    list.innerHTML = html;
    if (animate) { list.classList.remove('fade'); void list.offsetWidth; list.classList.add('fade'); }
  }
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (b) openDish(b.dataset.add);
  });

  /* ---------- Dish customisation ---------- */
  function openDish(id) {
    const d = byId(id);
    if (!d) return;
    const c = conflicts(d);
    const prefs = PREFS[d.type] || [];
    const body = $('#dishSheetBody');
    body.innerHTML = `
      <div class="ds-head">
        <p class="eyebrow">${d.cat}</p>
        <h3 id="dsTitle"><i class="${d.v ? 'veg' : 'nonveg'}"></i> ${esc(d.n)}${d.s ? ' ⭐' : ''}</h3>
        <p class="muted">${esc(d.d)}</p>
        <div class="a-tags">${d.a.map((k) => `<span class="a-tag${allergies.indexOf(k) >= 0 ? ' hit' : ''}">${ALLERGENS[k].icon} ${ALLERGENS[k].label}</span>`).join('') || '<span class="a-tag free">✓ No major allergens</span>'}</div>
      </div>
      ${c.length ? `<div class="alert-box">⚠ <b>This dish contains ${c.map((k) => ALLERGENS[k].label.toLowerCase()).join(' & ')}</b>, which you marked as an allergy. Our chef will try to make an allergen-free version and will call you if that isn't possible.</div>` : ''}
      <form id="dishForm" class="ds-form">
        ${d.h ? `
        <fieldset>
          <legend>Spice level</legend>
          <div class="seg">${SPICE.map((s, i) => `<label><input type="radio" name="spice" value="${s.k}"${i === 1 ? ' checked' : ''} /><span>${s.icon}<small>${s.label}</small></span></label>`).join('')}</div>
        </fieldset>` : ''}
        ${prefs.length ? `
        <fieldset>
          <legend>Cooking preferences <small class="muted">(optional)</small></legend>
          <div class="pref-chips">${prefs.map((p) => `<label class="pref"><input type="checkbox" name="pref" value="${esc(p)}" /><span>${esc(p)}</span></label>`).join('')}</div>
        </fieldset>` : ''}
        <fieldset>
          <legend>Cooking guide for the chef <small class="muted">(optional)</small></legend>
          <textarea name="note" rows="2" maxlength="200" placeholder="${d.type === 'drink' ? 'e.g. serve in a kulhad, half sugar' : d.type === 'sweet' ? 'e.g. add a birthday candle, less sweet' : 'e.g. medium spicy for kids, extra crispy, gravy on the side'}"></textarea>
        </fieldset>
        <div class="ds-foot">
          <div class="stepper" aria-label="Quantity">
            <button type="button" data-step="-1" aria-label="Decrease">−</button>
            <output id="dsQty">1</output>
            <button type="button" data-step="1" aria-label="Increase">+</button>
          </div>
          <button class="btn btn-gold" type="submit" id="dsAdd">Add to order · ${inr(d.p)}</button>
        </div>
      </form>`;
    let qty = 1;
    const form = $('#dishForm');
    form.addEventListener('click', (e) => {
      const s = e.target.closest('[data-step]');
      if (!s) return;
      qty = Math.max(1, Math.min(20, qty + +s.dataset.step));
      $('#dsQty').textContent = qty;
      $('#dsAdd').textContent = `Add to order · ${inr(d.p * qty)}`;
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const spice = d.h ? fd.get('spice') : '';
      const prefsSel = fd.getAll('pref');
      const note = (fd.get('note') || '').toString().trim();
      const key = [d.id, spice, prefsSel.join('|'), note].join('~');
      const existing = cart.find((i) => i.key === key);
      if (existing) existing.qty = Math.min(50, existing.qty + qty);
      else cart.push({ key, id: d.id, name: d.n, price: d.p, v: d.v, qty, spice, prefs: prefsSel, note });
      saveCart();
      renderMenu();
      closeSheet($('#dishSheet'));
      toast(`🍽 ${qty} × ${d.n} added to your order`);
    });
    openSheet($('#dishSheet'));
  }

  /* ---------- Cart UI ---------- */
  const fab = $('#cartFab');
  function updateCartUI() {
    const n = cartCount();
    $('#cartBadge').textContent = n;
    $('#fabCount').textContent = n;
    $('#fabTotal').textContent = inr(subTotal() * (1 + FOOD_GST));
    fab.hidden = n === 0;
    document.body.classList.toggle('has-cart', n > 0);
    if (!$('#cartSheet').hidden) renderCart();
  }
  fab.addEventListener('click', openCart);
  $('#openCartBtn').addEventListener('click', openCart);

  function optionText(i) {
    const parts = [];
    if (i.spice) { const s = SPICE.find((x) => x.k === i.spice); parts.push(`${s.icon} ${s.label}`); }
    if (i.prefs.length) parts.push(i.prefs.join(', '));
    return parts.join(' · ');
  }

  function renderCartWarnings() {
    const box = $('#cartWarn');
    if (!box) return;
    const hits = cart.filter((i) => { const d = byId(i.id); return d && conflicts(d).length; });
    box.innerHTML = hits.length ? `⚠ ${hits.map((i) => esc(i.name)).join(', ')} ${hits.length > 1 ? 'contain' : 'contains'} your allergens. The kitchen will be alerted.` : '';
    box.hidden = !hits.length;
  }

  function renderCart() {
    const body = $('#cartSheetBody');
    if (!cart.length) {
      body.innerHTML = `
        <h3 id="csTitle" class="cs-title">🧺 Your Order</h3>
        <div class="cart-empty"><div>🍽</div><p>Your order is empty.</p><button class="btn btn-gold" type="button" data-close>Browse the menu</button></div>`;
      return;
    }
    const sub = subTotal(), gst = sub * FOOD_GST;
    const c = store.get('agp_checkout', savedCheckout);
    const type = c.type || 'dine';
    body.innerHTML = `
      <h3 id="csTitle" class="cs-title">🧺 Your Order <small>${cartCount()} item${cartCount() > 1 ? 's' : ''}</small></h3>
      <ul class="cart-list">
        ${cart.map((i, idx) => `
          <li class="cart-item">
            <div class="ci-main">
              <div class="ci-name"><i class="${i.v ? 'veg' : 'nonveg'}"></i> ${esc(i.name)}</div>
              ${optionText(i) ? `<div class="ci-opt">${esc(optionText(i))}</div>` : ''}
              ${i.note ? `<div class="ci-note">📝 “${esc(i.note)}”</div>` : ''}
            </div>
            <div class="ci-side">
              <div class="stepper sm">
                <button type="button" data-cq="${idx}" data-d="-1" aria-label="Decrease ${esc(i.name)}">${i.qty === 1 ? '🗑' : '−'}</button>
                <output>${i.qty}</output>
                <button type="button" data-cq="${idx}" data-d="1" aria-label="Increase ${esc(i.name)}">+</button>
              </div>
              <b>${inr(i.qty * i.price)}</b>
            </div>
          </li>`).join('')}
      </ul>
      <button class="link-btn" type="button" data-close>+ Add more dishes</button>

      <form id="checkoutForm" class="checkout" novalidate>
        <fieldset>
          <legend>⚠️ Allergies for this order</legend>
          <div class="allergy-chips sm" id="cartAllergyChips"></div>
          <div class="alert-box" id="cartWarn" hidden></div>
          <input type="text" name="otherAllergy" maxlength="120" placeholder="Other allergies or diets, e.g. vegan, lactose intolerant" value="${esc(c.otherAllergy || '')}" />
        </fieldset>

        <fieldset>
          <legend>💬 Suggestions for the kitchen</legend>
          <textarea name="kitchenNote" rows="3" maxlength="300" placeholder="e.g. Please serve the starters first, make everything medium spicy, it's our anniversary 🎉">${esc(c.kitchenNote || '')}</textarea>
        </fieldset>

        <fieldset>
          <legend>🛎 How would you like it?</legend>
          <div class="seg type-seg">
            <label><input type="radio" name="type" value="dine"${type === 'dine' ? ' checked' : ''} /><span>🍽<small>Dine-in</small></span></label>
            <label><input type="radio" name="type" value="room"${type === 'room' ? ' checked' : ''} /><span>🛏<small>Room service</small></span></label>
            <label><input type="radio" name="type" value="takeaway"${type === 'takeaway' ? ' checked' : ''} /><span>🥡<small>Takeaway</small></span></label>
          </div>
          <label class="f-label" id="placeLabel"${type === 'takeaway' ? ' hidden' : ''}><span id="placeText">${type === 'room' ? 'Room number' : 'Table number'}</span>
            <input type="text" name="place" inputmode="numeric" maxlength="6" placeholder="${type === 'room' ? 'e.g. 214' : 'e.g. 12'}" value="${esc(c.place || '')}" />
          </label>
        </fieldset>

        <fieldset>
          <legend>👤 Your details</legend>
          <div class="f-row">
            <label class="f-label">Full name<input type="text" name="name" autocomplete="name" maxlength="60" placeholder="Your name" value="${esc(c.name || '')}" required /></label>
            <label class="f-label">Mobile number<input type="tel" name="phone" autocomplete="tel" inputmode="tel" maxlength="16" placeholder="98XXX XXXXX" value="${esc(c.phone || '')}" required /></label>
          </div>
        </fieldset>

        <div class="summary">
          <div><span>Subtotal</span><span>${inr2(sub)}</span></div>
          <div><span>CGST 2.5%</span><span>${inr2(gst / 2)}</span></div>
          <div><span>SGST 2.5%</span><span>${inr2(gst / 2)}</span></div>
          <div class="total"><span>Total payable</span><span>${inr(sub + gst)}</span></div>
        </div>
        <p class="form-msg" id="checkoutMsg" role="status"></p>
        <button class="btn btn-gold btn-block" type="submit">Place order · ${inr(sub + gst)}</button>
        <p class="tiny muted">You can pay at the table, charge it to your room, or pay by UPI at delivery.</p>
      </form>`;
    renderAllergyChips($('#cartAllergyChips'));
    renderCartWarnings();
  }

  function openCart() { renderCart(); openSheet($('#cartSheet')); }

  // cart interactions (delegated, survive re-render)
  const cartBody = $('#cartSheetBody');
  cartBody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cq]');
    if (!b) return;
    const i = cart[+b.dataset.cq];
    if (!i) return;
    i.qty += +b.dataset.d;
    if (i.qty <= 0) cart.splice(+b.dataset.cq, 1);
    persistCheckout();
    saveCart();
    renderMenu();
  });
  cartBody.addEventListener('change', (e) => {
    if (e.target.name === 'type') {
      const t = e.target.value;
      $('#placeLabel').hidden = t === 'takeaway';
      $('#placeText').textContent = t === 'room' ? 'Room number' : 'Table number';
      $('input[name="place"]', cartBody).placeholder = t === 'room' ? 'e.g. 214' : 'e.g. 12';
    }
    persistCheckout();
  });
  cartBody.addEventListener('input', () => persistCheckout());

  function persistCheckout() {
    const f = $('#checkoutForm');
    if (!f) return;
    const fd = new FormData(f);
    const o = {};
    ['otherAllergy', 'kitchenNote', 'type', 'place', 'name', 'phone'].forEach((k) => { o[k] = (fd.get(k) || '').toString(); });
    store.set('agp_checkout', o);
  }

  /* ---------- Place order -> token + receipt ---------- */
  cartBody.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const fd = new FormData(f);
    const msg = $('#checkoutMsg');
    $$('.invalid', f).forEach((el) => el.classList.remove('invalid'));
    const name = (fd.get('name') || '').toString().trim();
    const phoneRaw = (fd.get('phone') || '').toString();
    let digits = phoneRaw.replace(/\D/g, '');
    if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits[0] === '0') digits = digits.slice(1);
    const type = (fd.get('type') || 'dine').toString();
    const place = (fd.get('place') || '').toString().trim();

    let err = '', bad = null;
    if (!cart.length) err = 'Your order is empty.';
    else if (type !== 'takeaway' && !place) { err = type === 'room' ? 'Please enter your room number.' : 'Please enter your table number.'; bad = 'place'; }
    else if (name.length < 2) { err = 'Please enter your name.'; bad = 'name'; }
    else if (!/^[6-9]\d{9}$/.test(digits)) { err = 'Please enter a valid 10-digit Indian mobile number.'; bad = 'phone'; }
    if (err) {
      msg.className = 'form-msg err';
      msg.textContent = err;
      if (bad) { const el = $(`[name="${bad}"]`, f); el.classList.add('invalid'); el.focus(); }
      return;
    }

    const now = new Date();
    const token = (store.get('agp_token', 100) % 999) + 1;
    store.set('agp_token', token);
    const pad = (n) => String(n).padStart(2, '0');
    const orderId = `AGP${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const sub = subTotal();
    const allergyList = allergies.map((k) => ALLERGENS[k].label);
    const other = (fd.get('otherAllergy') || '').toString().trim();
    const itemCount = cartCount();
    const order = {
      token, orderId, time: now.toISOString(),
      name, phone: '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5),
      type, place,
      items: cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price, v: i.v, opt: optionText(i), note: i.note, allergyHit: conflicts(byId(i.id)).map((k) => ALLERGENS[k].label) })),
      allergies: allergyList, otherAllergy: other,
      kitchenNote: (fd.get('kitchenNote') || '').toString().trim(),
      sub, gst: sub * FOOD_GST, total: sub * (1 + FOOD_GST),
      eta: Math.min(45, 15 + itemCount * 3),
    };
    const history = store.get('agp_orders', []);
    history.unshift(order);
    store.set('agp_orders', history.slice(0, 10));

    // clear the order but keep name/phone for next time
    cart = [];
    saveCart();
    const keep = store.get('agp_checkout', {});
    store.set('agp_checkout', { name: keep.name, phone: keep.phone, type: keep.type, place: keep.place });
    renderMenu();
    $('#lastReceiptBtn').hidden = false;

    closeSheet($('#cartSheet'));
    setTimeout(() => showReceipt(order, true), 320);
  });

  const TYPE_LABEL = { dine: 'Dine-in', room: 'Room service', takeaway: 'Takeaway' };
  function receiptHTML(o) {
    const t = new Date(o.time);
    const when = t.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="receipt" id="receipt">
        <div class="rc-brand">Aurora <em>Grand</em><small>Palace · Udaipur</small></div>
        <p class="rc-sub">Lake Pichola, Udaipur, Rajasthan 313001<br />GSTIN: 08XXXXXXXXXX1Z5</p>
        <div class="rc-token">
          <span>Your order token</span>
          <b id="rcTitle">#${o.token}</b>
          <small>Show this token when your food arrives.</small>
        </div>
        <div class="rc-status"><span class="dot"></span> Order received by the kitchen · Ready in about ${o.eta} min</div>
        <dl class="rc-meta">
          <div><dt>Order ID</dt><dd>${o.orderId}</dd></div>
          <div><dt>Date</dt><dd>${when}</dd></div>
          <div><dt>Guest</dt><dd>${esc(o.name)}</dd></div>
          <div><dt>Mobile</dt><dd>${esc(o.phone)}</dd></div>
          <div><dt>Service</dt><dd>${TYPE_LABEL[o.type]}${o.place ? (o.type === 'room' ? ' · Room ' : ' · Table ') + esc(o.place) : ''}</dd></div>
        </dl>
        <table class="rc-items">
          <thead><tr><th>Item</th><th>Qty</th><th>Amount</th></tr></thead>
          <tbody>
            ${o.items.map((i) => `
              <tr>
                <td><i class="${i.v ? 'veg' : 'nonveg'}"></i> ${esc(i.name)}
                  ${i.opt ? `<small>${esc(i.opt)}</small>` : ''}
                  ${i.note ? `<small>📝 ${esc(i.note)}</small>` : ''}
                  ${i.allergyHit.length ? `<small class="hit">⚠ Allergy alert: ${i.allergyHit.join(', ')}</small>` : ''}
                </td>
                <td>${i.qty} × ${inr(i.price)}</td>
                <td>${inr2(i.qty * i.price)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div class="rc-totals">
          <div><span>Subtotal</span><span>${inr2(o.sub)}</span></div>
          <div><span>CGST @ 2.5%</span><span>${inr2(o.gst / 2)}</span></div>
          <div><span>SGST @ 2.5%</span><span>${inr2(o.gst / 2)}</span></div>
          <div class="grand"><span>Total</span><span>${inr2(o.total)}</span></div>
        </div>
        ${(o.allergies.length || o.otherAllergy) ? `<div class="rc-box warn"><b>⚠ Allergies</b>${esc([o.allergies.join(', '), o.otherAllergy].filter(Boolean).join(' · '))}</div>` : ''}
        ${o.kitchenNote ? `<div class="rc-box"><b>💬 Note to kitchen</b>${esc(o.kitchenNote)}</div>` : ''}
        <p class="rc-thanks">🙏 Dhanyavaad! Enjoy your royal meal.</p>
      </div>
      <div class="rc-actions no-print">
        <button class="btn btn-ghost" type="button" id="rcDownload">⬇ Download</button>
        <button class="btn btn-ghost" type="button" id="rcPrint">🖨 Print or save as PDF</button>
        <button class="btn btn-gold" type="button" data-close>Done</button>
      </div>`;
  }

  function receiptText(o) {
    const line = '-'.repeat(40);
    const t = new Date(o.time).toLocaleString('en-IN');
    const rows = o.items.map((i) => {
      let s = `${i.qty} x ${i.name}`.padEnd(28) + inr2(i.qty * i.price).padStart(12);
      if (i.opt) s += `\n    ${i.opt}`;
      if (i.note) s += `\n    Note: ${i.note}`;
      if (i.allergyHit.length) s += `\n    ALLERGY ALERT: ${i.allergyHit.join(', ')}`;
      return s;
    }).join('\n');
    return [
      'AURORA GRAND PALACE · UDAIPUR', 'Lake Pichola, Udaipur, Rajasthan 313001', line,
      `TOKEN: #${o.token}`, `Order ID: ${o.orderId}`, `Date: ${t}`,
      `Guest: ${o.name}`, `Mobile: ${o.phone}`,
      `Service: ${TYPE_LABEL[o.type]}${o.place ? ' - ' + (o.type === 'room' ? 'Room ' : 'Table ') + o.place : ''}`,
      line, rows, line,
      'Subtotal'.padEnd(28) + inr2(o.sub).padStart(12),
      'CGST @ 2.5%'.padEnd(28) + inr2(o.gst / 2).padStart(12),
      'SGST @ 2.5%'.padEnd(28) + inr2(o.gst / 2).padStart(12),
      'TOTAL'.padEnd(28) + inr2(o.total).padStart(12), line,
      (o.allergies.length || o.otherAllergy) ? `ALLERGIES: ${[o.allergies.join(', '), o.otherAllergy].filter(Boolean).join(' / ')}` : '',
      o.kitchenNote ? `Kitchen note: ${o.kitchenNote}` : '',
      '', `Estimated time: ${o.eta} minutes`, 'Dhanyavaad! Enjoy your royal meal.',
    ].filter((x) => x !== '').join('\n');
  }

  function showReceipt(o, isNew) {
    $('#receiptBody').innerHTML = receiptHTML(o);
    $('#rcPrint').addEventListener('click', () => window.print());
    $('#rcDownload').addEventListener('click', () => {
      const blob = new Blob([receiptText(o)], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `AuroraGrand-Token-${o.token}-${o.orderId}.txt`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
    openSheet($('#receiptSheet'));
    if (isNew) toast(`✅ Order placed! Your token is #${o.token}`);
  }

  const lastBtn = $('#lastReceiptBtn');
  lastBtn.hidden = !store.get('agp_orders', []).length;
  lastBtn.addEventListener('click', () => {
    const o = store.get('agp_orders', [])[0];
    if (o) showReceipt(o);
  });

  renderMenu();
  updateCartUI();
})();
