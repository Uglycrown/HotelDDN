/* Aurora Grand Palace — procedural 3D Indian lake palace (Three.js r128, no external models) */
(function () {
  'use strict';

  const HotelScene = {};
  window.HotelScene = HotelScene;

  HotelScene.init = function (canvas, hotspotLayer, opts) {
    if (!window.THREE) return false;
    opts = opts || {};

    const isMobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (e) {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 800);

    /* ---------- Sky dome: golden hour <-> night ---------- */
    const skyUniforms = {
      uNight: { value: 0 },
      dayTop: { value: new THREE.Color('#3f69a6') },
      dayHorizon: { value: new THREE.Color('#ffc387') },
      nightTop: { value: new THREE.Color('#03050d') },
      nightHorizon: { value: new THREE.Color('#1b2343') },
    };
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(400, 32, 16),
      new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        vertexShader: 'varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: [
          'uniform float uNight; uniform vec3 dayTop, dayHorizon, nightTop, nightHorizon; varying vec3 vPos;',
          'void main(){ float h = clamp(vPos.y * 1.8, 0.0, 1.0);',
          '  vec3 day = mix(dayHorizon, dayTop, pow(h, 0.55));',
          '  float sun = pow(max(dot(normalize(vPos), normalize(vec3(0.75, 0.12, -0.65))), 0.0), 60.0);',
          '  day += vec3(1.0, 0.75, 0.45) * sun * 1.4;',
          '  vec3 night = mix(nightHorizon, nightTop, pow(h, 0.45));',
          '  gl_FragColor = vec4(mix(day, night, uNight), 1.0); }',
        ].join('\n'),
      })
    );
    scene.add(sky);
    scene.fog = new THREE.Fog('#f2b98a', 90, 300);

    // Environment map so marble, gold and water pick up the sky
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(sky.clone());
    scene.environment = pmrem.fromScene(envScene, 0.03).texture;

    /* ---------- Lights ---------- */
    const hemi = new THREE.HemisphereLight('#ffe2c0', '#5a4632', 0.75);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#ffbf80', 2.0);
    sun.position.set(55, 32, -40);
    sun.castShadow = true;
    const sm = isMobile ? 1024 : 2048;
    sun.shadow.mapSize.set(sm, sm);
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 160 });
    sun.shadow.bias = -0.0006;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#9fb8ff', 0.35);
    fill.position.set(-40, 20, 40);
    scene.add(fill);

    const nightLights = [];
    function addNightLight(color, x, y, z, dist, power) {
      const l = new THREE.PointLight(color, 0, dist || 16, 2);
      l.position.set(x, y, z);
      l.userData.power = power || 2.5;
      scene.add(l);
      nightLights.push(l);
    }

    /* ---------- Canvas textures ---------- */
    function canvasTex(w, h, draw) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }
    function archPath(g, x, y, w, h) {
      // cusped Mughal-style arch
      const r = w / 2;
      g.beginPath();
      g.moveTo(x, y + h);
      g.lineTo(x, y + r);
      g.quadraticCurveTo(x, y, x + r, y - r * 0.35);
      g.quadraticCurveTo(x + w, y, x + w, y + r);
      g.lineTo(x + w, y + h);
      g.closePath();
    }
    const archTex = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#f1e6d2'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e2d2b6'; g.fillRect(0, 118, w, 10); g.fillRect(0, 0, w, 6);
      // carved frame
      g.fillStyle = '#e6d8bf'; archPath(g, 22, 36, 84, 82); g.fill();
      const grd = g.createLinearGradient(0, 30, 0, 118);
      grd.addColorStop(0, '#2b2420'); grd.addColorStop(1, '#4a3a2c');
      g.fillStyle = grd; archPath(g, 32, 44, 64, 74); g.fill();
      g.strokeStyle = '#c99a45'; g.lineWidth = 3; archPath(g, 32, 44, 64, 74); g.stroke();
      // jaali lattice hint
      g.strokeStyle = 'rgba(255,230,190,.12)'; g.lineWidth = 1;
      for (let i = 36; i < 96; i += 8) { g.beginPath(); g.moveTo(i, 60); g.lineTo(i, 118); g.stroke(); }
    });
    const glowTex = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const grd = g.createLinearGradient(0, 40, 0, 118);
      grd.addColorStop(0, '#ffcf7a'); grd.addColorStop(1, '#ff8f2e');
      g.fillStyle = grd; archPath(g, 32, 44, 64, 74); g.fill();
      g.strokeStyle = '#ffd98a'; g.lineWidth = 3; archPath(g, 32, 44, 64, 74); g.stroke();
    });
    const waterTex = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) {
        g.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.18})`;
        g.lineWidth = 1 + Math.random() * 2;
        g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 8 + Math.random() * 22, 1 + Math.random() * 3, 0, 0, Math.PI * 2); g.stroke();
      }
    });
    const glowSprite = canvasTex(64, 64, (g, w) => {
      const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      grd.addColorStop(0, 'rgba(255,240,200,1)'); grd.addColorStop(0.25, 'rgba(255,190,90,.9)');
      grd.addColorStop(0.6, 'rgba(255,120,30,.25)'); grd.addColorStop(1, 'rgba(255,100,0,0)');
      g.fillStyle = grd; g.fillRect(0, 0, w, w);
    });

    /* ---------- Materials ---------- */
    const M = {
      marble: new THREE.MeshStandardMaterial({ color: '#f4ecdf', roughness: 0.45, metalness: 0.02 }),
      sandstone: new THREE.MeshStandardMaterial({ color: '#e3cfa8', roughness: 0.8 }),
      trim: new THREE.MeshStandardMaterial({ color: '#d9bf8c', roughness: 0.6 }),
      gold: new THREE.MeshStandardMaterial({ color: '#e0b155', metalness: 1, roughness: 0.22 }),
      lake: new THREE.MeshStandardMaterial({ color: '#2f6f86', roughness: 0.12, metalness: 0.55, map: waterTex.clone(), envMapIntensity: 1.3 }),
      pool: new THREE.MeshStandardMaterial({ color: '#6fd3e6', roughness: 0.05, metalness: 0.2, map: waterTex, emissive: '#1ec8ff', emissiveIntensity: 0 }),
      grass: new THREE.MeshStandardMaterial({ color: '#5e7f3c', roughness: 1 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#3d6b2c', roughness: 0.9, flatShading: true }),
      trunk: new THREE.MeshStandardMaterial({ color: '#6b4c32', roughness: 1 }),
      hill: new THREE.MeshStandardMaterial({ color: '#8a7656', roughness: 1, flatShading: true }),
      hillGreen: new THREE.MeshStandardMaterial({ color: '#5d6b3d', roughness: 1, flatShading: true }),
      wood: new THREE.MeshStandardMaterial({ color: '#7a4b2a', roughness: 0.7 }),
      maroon: new THREE.MeshStandardMaterial({ color: '#8c1f2e', roughness: 0.7, side: THREE.DoubleSide }),
      deck: new THREE.MeshStandardMaterial({ color: '#b38660', roughness: 0.8 }),
      lampGlow: new THREE.MeshStandardMaterial({ color: '#ffe3b0', emissive: '#ffad4d', emissiveIntensity: 0.3 }),
    };
    M.lake.map.wrapS = M.lake.map.wrapT = THREE.RepeatWrapping;
    M.lake.map.repeat.set(40, 40);
    waterTex.repeat.set(1, 3);

    const facadeMats = [];
    function facadeMat(repX, repY) {
      const map = archTex.clone(); map.needsUpdate = true; map.repeat.set(repX, repY);
      const em = glowTex.clone(); em.needsUpdate = true; em.repeat.set(repX, repY);
      const m = new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.55 });
      facadeMats.push(m);
      return m;
    }

    function mesh(geo, mat, x, y, z, cast = true, receive = true) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = cast; m.receiveShadow = receive;
      return m;
    }

    const world = new THREE.Group();
    scene.add(world);

    /* ---------- Building blocks ---------- */
    const ARCH_W = 2.2, FLOOR_H = 3;
    // A palace block with arched facades on all four sides, cornices and a parapet
    function palaceBlock(w, h, d, x, y, z) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.add(mesh(new THREE.BoxGeometry(w, h, d), M.marble, 0, h / 2, 0));
      const floors = Math.max(1, Math.round(h / FLOOR_H));
      const fW = facadeMat(Math.max(1, Math.round(w / ARCH_W)), floors);
      const fD = facadeMat(Math.max(1, Math.round(d / ARCH_W)), floors);
      const pw = new THREE.PlaneGeometry(w, h), pd = new THREE.PlaneGeometry(d, h);
      const f1 = mesh(pw, fW, 0, h / 2, d / 2 + 0.02, false); g.add(f1);
      const f2 = mesh(pw, fW, 0, h / 2, -d / 2 - 0.02, false); f2.rotation.y = Math.PI; g.add(f2);
      const f3 = mesh(pd, fD, w / 2 + 0.02, h / 2, 0, false); f3.rotation.y = Math.PI / 2; g.add(f3);
      const f4 = mesh(pd, fD, -w / 2 - 0.02, h / 2, 0, false); f4.rotation.y = -Math.PI / 2; g.add(f4);
      for (let i = 1; i <= floors; i++) {
        g.add(mesh(new THREE.BoxGeometry(w + 0.5, 0.22, d + 0.5), M.trim, 0, (h / floors) * i, 0));
      }
      // parapet with merlons
      const ph = 0.55;
      [[w + 0.5, 0.18, 0, (d + 0.5) / 2], [w + 0.5, 0.18, 0, -(d + 0.5) / 2]].forEach(([len, t, px, pz]) => g.add(mesh(new THREE.BoxGeometry(len, ph, t), M.marble, px, h + ph / 2 + 0.1, pz)));
      [[(w + 0.5) / 2], [-(w + 0.5) / 2]].forEach(([px]) => g.add(mesh(new THREE.BoxGeometry(0.18, ph, d + 0.5), M.marble, px, h + ph / 2 + 0.1, 0)));
      const merlonGeo = new THREE.BoxGeometry(0.3, 0.3, 0.22);
      for (let mx = -w / 2; mx <= w / 2; mx += 1.1) {
        g.add(mesh(merlonGeo, M.marble, mx, h + ph + 0.25, (d + 0.5) / 2, false));
        g.add(mesh(merlonGeo, M.marble, mx, h + ph + 0.25, -(d + 0.5) / 2, false));
      }
      world.add(g);
      return g;
    }

    // Onion dome via lathe
    const domeProfile = [
      [0.0, 0], [1.0, 0], [1.1, 0.16], [1.16, 0.38], [1.08, 0.66], [0.86, 0.92], [0.56, 1.16], [0.3, 1.34], [0.12, 1.48], [0.0, 1.56],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const domeGeo = new THREE.LatheGeometry(domeProfile, isMobile ? 24 : 40);
    function finial(s) {
      const f = new THREE.Group();
      f.add(mesh(new THREE.SphereGeometry(0.16 * s, 12, 10), M.gold, 0, 0.12 * s, 0, true, false));
      f.add(mesh(new THREE.SphereGeometry(0.11 * s, 12, 10), M.gold, 0, 0.38 * s, 0, true, false));
      f.add(mesh(new THREE.ConeGeometry(0.06 * s, 0.6 * s, 8), M.gold, 0, 0.75 * s, 0, true, false));
      return f;
    }
    function dome(r, mat) {
      const g = new THREE.Group();
      const d = mesh(domeGeo, mat || M.marble, 0, 0, 0);
      d.scale.setScalar(r);
      g.add(d);
      const f = finial(r);
      f.position.y = 1.56 * r;
      g.add(f);
      return g;
    }
    // Chhatri: domed pavilion on pillars
    const pillarGeo = new THREE.CylinderGeometry(0.07, 0.08, 1, 8);
    function chhatri(s, x, y, z, parent) {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      g.add(mesh(new THREE.BoxGeometry(1.5 * s, 0.14 * s, 1.5 * s), M.trim, 0, 0.07 * s, 0));
      const ph = 1.1 * s;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
        const p = mesh(pillarGeo, M.marble, a * 0.58 * s, 0.14 * s + ph / 2, b * 0.58 * s);
        p.scale.set(s * 1.4, ph, s * 1.4);
        g.add(p);
      });
      g.add(mesh(new THREE.BoxGeometry(1.8 * s, 0.1 * s, 1.8 * s), M.trim, 0, 0.14 * s + ph, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.62 * s, 0.66 * s, 0.25 * s, 16), M.marble, 0, 0.27 * s + ph, 0));
      const d = dome(0.6 * s);
      d.position.y = 0.4 * s + ph;
      g.add(d);
      (parent || world).add(g);
      return g;
    }
    // Octagonal corner tower (burj)
    function burj(x, z, h) {
      const g = new THREE.Group();
      g.position.set(x, 1.2, z);
      g.add(mesh(new THREE.CylinderGeometry(1.25, 1.45, h, 8), M.marble, 0, h / 2, 0));
      const f = mesh(new THREE.CylinderGeometry(1.27, 1.27, h - 1, 8, 1, true), facadeMat(4, Math.round((h - 1) / FLOOR_H)), 0, h / 2, 0, false);
      g.add(f);
      for (let i = 1; i <= 3; i++) g.add(mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.2, 8), M.trim, 0, (h / 3) * i, 0));
      world.add(g);
      chhatri(1.5, x, 1.2 + h + 0.1, z);
    }

    /* ---------- Lake, hills ---------- */
    const lake = mesh(new THREE.PlaneGeometry(900, 900), M.lake, 0, 0, 0, false, true);
    lake.rotation.x = -Math.PI / 2;
    scene.add(lake);

    const hillGeo = new THREE.DodecahedronGeometry(1, 1);
    const HILLS = isMobile ? 18 : 30;
    for (let i = 0; i < HILLS; i++) {
      const a = (i / HILLS) * Math.PI * 2 + Math.random() * 0.2;
      if (a > 0.9 && a < 2.3) continue; // keep the front open (camera side)
      const r = 150 + Math.random() * 60;
      const hill = mesh(hillGeo, Math.random() < 0.5 ? M.hill : M.hillGreen, Math.sin(a) * r, -4, Math.cos(a) * r, false, false);
      hill.scale.set(25 + Math.random() * 30, 12 + Math.random() * 22, 25 + Math.random() * 25);
      scene.add(hill);
    }
    // Distant hill fort silhouette
    const fort = new THREE.Group();
    fort.position.set(-60, 0, -170);
    fort.add(mesh(hillGeo, M.hillGreen, 0, 0, 0, false, false));
    fort.children[0].scale.set(40, 30, 30);
    fort.add(mesh(new THREE.BoxGeometry(14, 6, 6), M.sandstone, 0, 30, 0, false, false));
    fort.add(mesh(new THREE.CylinderGeometry(2, 2, 9, 8), M.sandstone, -7, 31, 0, false, false));
    fort.add(mesh(new THREE.CylinderGeometry(2, 2, 9, 8), M.sandstone, 7, 31, 0, false, false));
    scene.add(fort);

    /* ---------- Island platform & ghats ---------- */
    world.add(mesh(new THREE.BoxGeometry(36, 1.2, 26), M.sandstone, 0, 0.6, 0));
    world.add(mesh(new THREE.BoxGeometry(36.6, 0.18, 26.6), M.trim, 0, 1.2, 0));
    for (let i = 0; i < 4; i++) {
      world.add(mesh(new THREE.BoxGeometry(14 - i * 0.2, 0.3, 1.0), M.sandstone, 0, 1.05 - i * 0.3, 13.5 + i * 0.9));
    }
    // Garden lawns
    world.add(mesh(new THREE.BoxGeometry(9, 0.1, 9), M.grass, -12.5, 1.28, 7.5, false, true));
    world.add(mesh(new THREE.BoxGeometry(9, 0.1, 9), M.grass, 12.5, 1.28, 7.5, false, true));

    /* ---------- Main palace ---------- */
    const A = { w: 24, h: 6, d: 12, z: -4 };
    palaceBlock(A.w, A.h, A.d, 0, 1.2, A.z);
    const B = { w: 14, h: 3.4, d: 8 };
    const bY = 1.2 + A.h + 0.1;
    palaceBlock(B.w, B.h, B.d, 0, bY, A.z);
    const roofB = bY + B.h + 0.1;

    // Central great dome on a drum
    world.add(mesh(new THREE.CylinderGeometry(2.9, 3.1, 1.3, 32), M.marble, 0, roofB + 0.65, A.z));
    world.add(mesh(new THREE.CylinderGeometry(3.15, 3.15, 0.2, 32), M.trim, 0, roofB + 1.35, A.z));
    const bigDome = dome(2.8);
    bigDome.position.set(0, roofB + 1.4, A.z);
    world.add(bigDome);
    const domeTop = roofB + 1.4 + 2.8 * 1.56 + 1.0;

    // Chhatris on roofs
    const aRoof = 1.2 + A.h + 0.1;
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
      chhatri(1.1, sx * (B.w / 2 - 0.9), roofB, A.z + sz * (B.d / 2 - 0.9));
    });
    [-9, -5, 5, 9].forEach((x) => chhatri(0.9, x, aRoof, A.z + A.d / 2 - 1.2));
    // Corner burjs
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => burj(sx * (A.w / 2 + 0.6), A.z + sz * (A.d / 2 + 0.6), 7.5));

    // Jharokha balconies on the front facade
    const jharokhaGlow = facadeMat(1, 1);
    [-8.8, -4.4, 0, 4.4, 8.8].forEach((x) => {
      const j = new THREE.Group();
      j.position.set(x, 1.2 + FLOOR_H + 0.5, A.z + A.d / 2 + 0.55);
      j.add(mesh(new THREE.BoxGeometry(1.8, 0.2, 1.1), M.trim, 0, 0, 0));
      const bracket = mesh(new THREE.ConeGeometry(0.5, 0.6, 8), M.trim, 0, -0.4, 0);
      bracket.rotation.x = Math.PI;
      j.add(bracket);
      j.add(mesh(new THREE.BoxGeometry(1.6, 1.6, 0.9), M.marble, 0, 0.9, -0.05));
      const glow = mesh(new THREE.PlaneGeometry(1.3, 1.4), jharokhaGlow, 0, 0.9, 0.42, false);
      j.add(glow);
      j.add(mesh(new THREE.BoxGeometry(1.9, 0.1, 1.2), M.trim, 0, 1.75, 0));
      const d = dome(0.55); d.position.y = 1.8; j.add(d);
      world.add(j);
    });

    // Grand entrance arch
    const gate = new THREE.Group();
    gate.position.set(0, 1.2, A.z + A.d / 2 + 0.3);
    gate.add(mesh(new THREE.BoxGeometry(4.4, 5.2, 0.8), M.marble, 0, 2.6, 0));
    const gateGlow = facadeMat(1, 1);
    gate.add(mesh(new THREE.PlaneGeometry(3, 4.2), gateGlow, 0, 2.2, 0.42, false));
    gate.add(mesh(new THREE.BoxGeometry(4.8, 0.3, 1), M.gold, 0, 5.3, 0));
    world.add(gate);

    /* ---------- Courtyard reflecting pool with fountains ---------- */
    const poolZ = 7.2;
    world.add(mesh(new THREE.BoxGeometry(4.6, 0.3, 11), M.marble, 0, 1.35, poolZ));
    const pool = mesh(new THREE.BoxGeometry(3.8, 0.06, 10.2), M.pool, 0, 1.5, poolZ, false, true);
    world.add(pool);
    const jets = [];
    const jetGeo = new THREE.CylinderGeometry(0.03, 0.12, 1, 8);
    const jetMat = new THREE.MeshStandardMaterial({ color: '#d8f6ff', emissive: '#7fe0ff', emissiveIntensity: 0.1, transparent: true, opacity: 0.75 });
    for (let i = 0; i < 5; i++) {
      const jt = mesh(jetGeo, jetMat, 0, 2.0, poolZ - 4 + i * 2, false, false);
      jt.userData.phase = i * 0.7;
      jets.push(jt);
      world.add(jt);
    }
    // Lamp posts along the pool
    const lampGeo = new THREE.SphereGeometry(0.16, 10, 8);
    for (let i = 0; i < 6; i++) {
      [-2.9, 2.9].forEach((x) => {
        const z = poolZ - 5 + i * 2;
        world.add(mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.1, 6), M.gold, x, 1.85, z, true, false));
        world.add(mesh(lampGeo, M.lampGlow, x, 2.45, z, false, false));
      });
    }
    addNightLight('#ffb35c', 0, 4, poolZ, 18, 3);
    addNightLight('#ffcf8a', 0, 6, A.z + A.d / 2 + 3, 16, 3);

    /* ---------- Ayurveda spa pavilion (left garden) ---------- */
    const spaX = -12.5, spaZ = 7.5;
    world.add(mesh(new THREE.BoxGeometry(5.4, 0.35, 5.4), M.marble, spaX, 1.45, spaZ));
    const spaPav = chhatri(3.2, spaX, 1.6, spaZ);
    spaPav.children.forEach((c) => { c.castShadow = true; });
    world.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 24), M.pool, spaX, 2.08, spaZ, false, true));
    addNightLight('#9dffb0', spaX, 4, spaZ, 10, 1.8);

    /* ---------- Lake terrace dining (right garden) ---------- */
    const dinX = 12.5, dinZ = 7.5;
    world.add(mesh(new THREE.BoxGeometry(8, 0.2, 8), M.deck, dinX, 1.38, dinZ));
    chhatri(2.2, dinX, 1.48, dinZ - 1.5);
    const tableGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.08, 16);
    const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6);
    const tableMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
    [[-2.5, 1.5], [0, 2.5], [2.5, 1.5], [-2.5, -1], [2.5, -1]].forEach(([tx, tz]) => {
      world.add(mesh(legGeo, M.wood, dinX + tx, 1.83, dinZ + tz));
      world.add(mesh(tableGeo, tableMat, dinX + tx, 2.2, dinZ + tz));
      world.add(mesh(new THREE.SphereGeometry(0.06, 6, 6), M.lampGlow, dinX + tx, 2.3, dinZ + tz, false, false));
    });
    addNightLight('#ffb35c', dinX, 4, dinZ, 12, 2.5);

    /* ---------- Trees ---------- */
    const treeGeo = new THREE.IcosahedronGeometry(1, 1);
    const cypressGeo = new THREE.ConeGeometry(0.6, 3.2, 8);
    function tree(x, z, s) {
      world.add(mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.2 * s, 6), M.trunk, x, 1.3 + 0.6 * s, z));
      const t = mesh(treeGeo, M.leaf, x, 1.3 + 1.7 * s, z);
      t.scale.set(1.1 * s, 0.9 * s, 1.1 * s);
      world.add(t);
    }
    function cypress(x, z) { world.add(mesh(cypressGeo, M.leaf, x, 2.9, z)); }
    [[-16, 4], [-16, 11], [-9, 11.5], [16, 4], [16, 11], [9, 11.5], [-16.5, -8], [16.5, -8]].forEach(([x, z]) => tree(x, z, 1 + Math.random() * 0.3));
    for (let i = 0; i < 6; i++) { cypress(-4.2, poolZ - 5 + i * 2); cypress(4.2, poolZ - 5 + i * 2); }

    /* ---------- Boats (shikaras) ---------- */
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, -2);
    hullShape.quadraticCurveTo(0.75, -1.1, 0.7, 0);
    hullShape.quadraticCurveTo(0.75, 1.1, 0, 2);
    hullShape.quadraticCurveTo(-0.75, 1.1, -0.7, 0);
    hullShape.quadraticCurveTo(-0.75, -1.1, 0, -2);
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.45, bevelEnabled: false });
    hullGeo.rotateX(-Math.PI / 2);
    const boats = [];
    function boat(radius, angle, speed, canopyMat) {
      const b = new THREE.Group();
      b.add(mesh(hullGeo, M.wood, 0, -0.1, 0));
      [[-0.45, -0.7], [0.45, -0.7], [-0.45, 0.7], [0.45, 0.7]].forEach(([x, z]) => b.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), M.gold, x, 0.75, z, false, false)));
      b.add(mesh(new THREE.BoxGeometry(1.1, 0.06, 1.7), canopyMat, 0, 1.2, 0));
      b.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), M.lampGlow, 0, 0.6, 1.7, false, false));
      b.userData = { radius, angle, speed };
      scene.add(b);
      boats.push(b);
    }
    boat(30, 0.4, 0.035, M.maroon);
    boat(36, 2.6, -0.025, new THREE.MeshStandardMaterial({ color: '#d4a64a', roughness: 0.6, side: THREE.DoubleSide }));
    boat(26, 4.4, 0.03, M.maroon);
    // Jetty boat parked at the ghat
    const parked = new THREE.Group();
    parked.add(mesh(hullGeo, M.wood, 0, -0.1, 0));
    parked.add(mesh(new THREE.BoxGeometry(1.1, 0.06, 1.7), M.maroon, 0, 1.2, 0));
    [[-0.45, -0.7], [0.45, -0.7], [-0.45, 0.7], [0.45, 0.7]].forEach(([x, z]) => parked.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 4), M.gold, x, 0.75, z, false, false)));
    parked.position.set(4.5, 0.1, 17.5);
    parked.rotation.y = Math.PI / 2;
    scene.add(parked);

    /* ---------- Night glow: diyas, sky lanterns, stars ---------- */
    const diyaPos = [];
    const halfW = 18.2, halfD = 13.2;
    for (let x = -halfW; x <= halfW; x += 1.2) { diyaPos.push(x, 1.45, halfD, x, 1.45, -halfD); }
    for (let z = -halfD; z <= halfD; z += 1.2) { diyaPos.push(halfW, 1.45, z, -halfW, 1.45, z); }
    for (let x = -A.w / 2; x <= A.w / 2; x += 1.1) diyaPos.push(x, 1.2 + A.h + 1.0, A.z + A.d / 2 + 0.3); // roof line
    const diyaGeo = new THREE.BufferGeometry();
    diyaGeo.setAttribute('position', new THREE.Float32BufferAttribute(diyaPos, 3));
    const diyaMat = new THREE.PointsMaterial({ map: glowSprite, size: 1.1, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    world.add(new THREE.Points(diyaGeo, diyaMat));

    const LANTERNS = isMobile ? 40 : 90;
    const lanPos = new Float32Array(LANTERNS * 3);
    const lanSeed = [];
    for (let i = 0; i < LANTERNS; i++) {
      lanSeed.push({ a: Math.random() * Math.PI * 2, r: 6 + Math.random() * 30, s: 0.6 + Math.random() * 0.8, y: Math.random() * 60 });
    }
    const lanGeo = new THREE.BufferGeometry();
    lanGeo.setAttribute('position', new THREE.BufferAttribute(lanPos, 3));
    const lanMat = new THREE.PointsMaterial({ map: glowSprite, size: 2.2, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    scene.add(new THREE.Points(lanGeo, lanMat));

    const starGeo = new THREE.BufferGeometry();
    const starCount = isMobile ? 500 : 1200;
    const sp = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.42;
      sp[i * 3] = 360 * Math.sin(ph) * Math.cos(th);
      sp[i * 3 + 1] = 360 * Math.cos(ph);
      sp[i * 3 + 2] = 360 * Math.sin(ph) * Math.sin(th);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 1.4, transparent: true, opacity: 0, fog: false, depthWrite: false });
    scene.add(new THREE.Points(starGeo, starMat));

    // Moon
    const moon = mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff4d8', transparent: true, opacity: 0, fog: false }), -120, 110, -260, false, false);
    scene.add(moon);

    /* ---------- Views & hotspots ---------- */
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const views = {
      overview: { target: V(0, 5, 0), dist: 62, phi: 1.2, theta: 0.45 },
      durbar: { target: V(0, roofB + 2.5, A.z), dist: 24, phi: 1.2, theta: 0.35, spot: V(0, domeTop, A.z),
        title: 'Durbar Hall & Great Dome', text: 'The palace\'s crown jewel. A gold-leaf ceiling, Belgian crystal chandeliers and private royal banquets for up to 120 guests.' },
      suites: { target: V(-5, 5, A.z + 2), dist: 22, phi: 1.38, theta: -0.35, spot: V(-8.8, 1.2 + FLOOR_H + 1.6, A.z + A.d / 2 + 1.1),
        title: 'Royal Jharokha Suites', text: 'Suites with carved marble jharokha balconies overlooking Lake Pichola, each with a private butler.' },
      pool: { target: V(0, 1.5, poolZ), dist: 22, phi: 0.92, theta: 0.15, spot: V(0, 2.6, poolZ + 4),
        title: 'Courtyard Pool', text: 'A heated reflecting pool lined with cypress trees and fountains. Lit by hundreds of diyas after sunset.' },
      spa: { target: V(spaX, 3, spaZ), dist: 17, phi: 1.12, theta: -0.75, spot: V(spaX, 7.2, spaZ),
        title: 'Ayurveda Spa Pavilion', text: 'Abhyanga, Shirodhara and Rajasthani rose rituals by Kerala-trained therapists. Sunrise yoga in the garden.' },
      dining: { target: V(dinX, 2.5, dinZ), dist: 17, phi: 1.1, theta: 0.8, spot: V(dinX, 6, dinZ - 1.5),
        title: 'Jharokha Lake Terrace', text: 'Candle-lit dining by the water: live tandoor, laal maas and Rajasthani folk music every evening.' },
      ghat: { target: V(0, 1.2, 15), dist: 22, phi: 1.3, theta: 0.05, spot: V(4.5, 2, 17.5),
        title: 'Royal Boat Jetty', text: 'Guests arrive by private shikara from the City Palace ghat. Daily sunset boat rides are included for suite guests.' },
    };

    const hotspotEls = {};
    Object.keys(views).forEach((key) => {
      const v = views[key];
      if (!v.spot || !hotspotLayer) return;
      const b = document.createElement('button');
      b.className = 'hotspot';
      b.setAttribute('aria-label', v.title);
      b.innerHTML = '<i></i><span>' + v.title.split('&')[0].trim() + '</span>';
      b.addEventListener('click', () => HotelScene.flyTo(key));
      hotspotLayer.appendChild(b);
      hotspotEls[key] = b;
    });

    /* ---------- Camera controller ---------- */
    const state = { target: views.overview.target.clone(), dist: views.overview.dist, phi: views.overview.phi, theta: views.overview.theta };
    const goal = { target: state.target.clone(), dist: state.dist, phi: state.phi, theta: state.theta };
    let autoRotate = !reducedMotion;
    let lastInteract = 0;
    let currentView = 'overview';

    function distScale() {
      const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
      return aspect < 1 ? 1 + (1 - aspect) * 1.25 : 1;
    }
    function interacted() {
      lastInteract = performance.now();
      if (opts.onInteract) opts.onInteract();
    }

    HotelScene.flyTo = function (key) {
      const v = views[key];
      if (!v) return;
      currentView = key;
      goal.target.copy(v.target);
      goal.dist = v.dist;
      goal.phi = v.phi;
      let t = v.theta;
      while (t - state.theta > Math.PI) t -= Math.PI * 2;
      while (t - state.theta < -Math.PI) t += Math.PI * 2;
      goal.theta = t;
      interacted();
      if (opts.onView) opts.onView(key, v);
    };
    HotelScene.views = Object.keys(views);

    let dragging = false, px = 0, py = 0, pointerId = null;
    const pts = new Map();
    let pinchStart = 0, pinchDist = 0;
    canvas.addEventListener('pointerdown', (e) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y); pinchDist = goal.dist;
      }
      dragging = true; pointerId = e.pointerId; px = e.clientX; py = e.clientY;
      interacted();
    });
    window.addEventListener('pointermove', (e) => {
      if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinchStart) {
        const [a, b] = [...pts.values()];
        goal.dist = THREE.MathUtils.clamp(pinchDist * pinchStart / Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), 10, 110);
        return;
      }
      if (!dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      goal.theta -= dx * 0.006;
      if (e.pointerType === 'mouse') goal.phi = THREE.MathUtils.clamp(goal.phi - dy * 0.004, 0.4, 1.5);
      lastInteract = performance.now();
    });
    const endPointer = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinchStart = 0; if (e.pointerId === pointerId) dragging = false; };
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('wheel', (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      goal.dist = THREE.MathUtils.clamp(goal.dist * (1 + e.deltaY * 0.001), 10, 110);
    }, { passive: false });

    /* ---------- Day / Night ---------- */
    let night = 0, nightGoal = 0;
    HotelScene.setNight = (on) => { nightGoal = on ? 1 : 0; };
    HotelScene.isNight = () => nightGoal === 1;
    HotelScene.setAutoRotate = (on) => { autoRotate = on; };
    HotelScene.getAutoRotate = () => autoRotate;

    // Reflections come from the daytime sky, so dim them as night falls
    const envMats = [];
    scene.traverse((o) => {
      const m = o.material;
      if (m && m.isMeshStandardMaterial && envMats.indexOf(m) < 0) { m.userData.env = m.envMapIntensity; envMats.push(m); }
    });
    const fogDay = new THREE.Color('#f2b98a'), fogNight = new THREE.Color('#121a33');
    const sunDay = new THREE.Color('#ffbf80'), sunNight = new THREE.Color('#7f9cff');
    function applyNight(t) {
      skyUniforms.uNight.value = t;
      scene.fog.color.copy(fogDay).lerp(fogNight, t);
      hemi.intensity = 0.75 - 0.6 * t;
      sun.intensity = 2.0 - 1.75 * t;
      sun.color.copy(sunDay).lerp(sunNight, t);
      fill.intensity = 0.35 - 0.2 * t;
      facadeMats.forEach((m) => { m.emissiveIntensity = 1.6 * t; });
      M.lampGlow.emissiveIntensity = 0.3 + 3 * t;
      M.pool.emissiveIntensity = 0.8 * t;
      jetMat.emissiveIntensity = 0.1 + 1.2 * t;
      M.gold.emissive.set('#ffa040'); M.gold.emissiveIntensity = 0.12 * t;
      diyaMat.opacity = t;
      lanMat.opacity = t * 0.95;
      starMat.opacity = t;
      moon.material.opacity = t;
      nightLights.forEach((l) => { l.intensity = l.userData.power * t; });
      envMats.forEach((m) => { m.envMapIntensity = m.userData.env * (1 - 0.85 * t); });
      renderer.toneMappingExposure = 1.0 + 0.2 * t;
    }
    applyNight(0);

    /* ---------- Resize ---------- */
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    resize();

    /* ---------- Loop ---------- */
    let inView = false, pageVisible = true, running = false;
    const updateRunning = () => { running = inView && pageVisible; };
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const lerpK = (k, dt) => 1 - Math.pow(1 - k, dt * 60);

    function frame() {
      requestAnimationFrame(frame);
      if (!running) { clock.getDelta(); return; }
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (autoRotate && !dragging && performance.now() - lastInteract > 4000) goal.theta += dt * (currentView === 'overview' ? 0.1 : 0.04);

      const k = lerpK(0.055, dt);
      state.theta += (goal.theta - state.theta) * k;
      state.phi += (goal.phi - state.phi) * k;
      state.dist += (goal.dist * distScale() - state.dist) * k;
      state.target.lerp(goal.target, k);
      camera.position.set(
        state.target.x + state.dist * Math.sin(state.phi) * Math.sin(state.theta),
        state.target.y + state.dist * Math.cos(state.phi),
        state.target.z + state.dist * Math.sin(state.phi) * Math.cos(state.theta)
      );
      camera.lookAt(state.target);

      night += (nightGoal - night) * lerpK(0.04, dt);
      if (Math.abs(nightGoal - night) > 0.001) applyNight(night);

      if (!reducedMotion) {
        waterTex.offset.y = t * 0.05;
        M.lake.map.offset.set(t * 0.003, t * 0.0015);
        jets.forEach((j) => { j.scale.y = 1 + Math.sin(t * 5 + j.userData.phase) * 0.15; });
        boats.forEach((b) => {
          const u = b.userData;
          u.angle += u.speed * dt;
          b.position.set(Math.sin(u.angle) * u.radius, 0.1 + Math.sin(t * 1.5 + u.radius) * 0.05, Math.cos(u.angle) * u.radius);
          b.rotation.y = u.angle + Math.PI / 2;
          b.rotation.z = Math.sin(t * 1.2 + u.radius) * 0.03;
        });
        if (night > 0.02) {
          for (let i = 0; i < LANTERNS; i++) {
            const L = lanSeed[i];
            L.y += dt * L.s;
            if (L.y > 70) L.y = 2;
            lanPos[i * 3] = Math.sin(L.a + L.y * 0.02) * (L.r + L.y * 0.4);
            lanPos[i * 3 + 1] = L.y;
            lanPos[i * 3 + 2] = Math.cos(L.a + L.y * 0.02) * (L.r + L.y * 0.4);
          }
          lanGeo.attributes.position.needsUpdate = true;
        }
      }

      const w = canvas.clientWidth, h = canvas.clientHeight;
      Object.keys(hotspotEls).forEach((key) => {
        const el = hotspotEls[key];
        tmp.copy(views[key].spot).project(camera);
        const visible = tmp.z < 1 && Math.abs(tmp.x) < 1.05 && Math.abs(tmp.y) < 1.05;
        el.style.opacity = visible ? (key === currentView ? '0.35' : '1') : '0';
        el.style.pointerEvents = visible ? 'auto' : 'none';
        el.style.transform = `translate(${(tmp.x * 0.5 + 0.5) * w}px, ${(-tmp.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
      });

      renderer.render(scene, camera);
    }
    // Render one frame immediately so the canvas is never blank, then loop while visible
    running = true; frame(); running = false;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; updateRunning(); }, { rootMargin: '100px' }).observe(canvas);
    } else { inView = true; updateRunning(); }
    document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; updateRunning(); });

    return true;
  };
})();
