// Animated journey map: a dotted world map where a photon hops between the places
// Clément studied, taught or worked, with a panel describing each stop.
(function () {
  const canvas = document.getElementById("map");
  const D = window.MAP_DATA;
  if (!canvas || !D) return;
  const P = D.places;
  const STOPS = [
    { at: "toulouse", where: "Toulouse, France", when: "2012 – 2018", title: "Physics engineering at INSA Toulouse",
      text: "Master in Physics Engineering, with research internships at the National Laboratory for Intense Magnetic Fields (LNCMI) and at LPCNO." },
    { at: "malaysia", where: "Malaysia", when: "2016", title: "Exchange semester",
      text: "A semester abroad in Malaysia during my engineering studies." },
    { at: "sydney", where: "Sydney, Australia", when: "2017", title: "Astrophotonics internship",
      text: "Engineer intern at the Sydney Astrophotonics Instrumentation Laboratory, University of Sydney." },
    { at: "toulouse", where: "Toulouse, France", when: "2019 – 2023", title: "PhD, postdoc and teaching",
      text: "PhD at LAAS-CNRS on integrated long-period waveguide gratings for sensing, then postdoc at Toulouse INP (ENSEEIHT). Five years of part-time teaching of the C programming language." },
    { at: "thailand", where: "Thailand", when: "2022", title: "Assistant Professor",
      text: "A two-month position as assistant professor in Thailand." },
    { at: "wako", where: "Wako, Japan", when: "2024 → now", title: "RIKEN Center for Advanced Photonics",
      text: "JSPS fellow, then RIKEN Special Postdoctoral Researcher: single photons from carbon nanotubes on photonic chips." },
  ];
  const FLY = 0.9, STAY = 1.7;

  const dots = D.dots.split(" ").map(p => p.split(",").map(Number));
  const ctx = canvas.getContext("2d");
  const els = {
    when: document.getElementById("stop-when"), where: document.getElementById("stop-where"),
    title: document.getElementById("stop-title"), text: document.getElementById("stop-text"), list: document.getElementById("stops"),
  };
  const items = STOPS.map((s, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<span>${s.when}</span>${s.where}`;
    b.addEventListener("click", () => { go(i); hold = 10; });
    li.appendChild(b); els.list.appendChild(li); return b;
  });

  // ---------- state: current stop, the flight that led here, fading past trails ----------
  let cur = 0, from = null, phase = FLY, hold = 0, lastArc = null;
  const trails = []; // { A, age }
  function go(i) {
    if (STOPS[i].at !== STOPS[cur].at) {
      from = STOPS[cur].at;
      if (lastArc) trails.push({ A: lastArc, age: 0 });
      phase = 0;
    } else phase = Math.max(phase, FLY);
    cur = i;
    const s = STOPS[i];
    els.when.textContent = s.when; els.where.textContent = s.where;
    els.title.textContent = s.title; els.text.textContent = s.text;
    items.forEach((b, k) => b.classList.toggle("on", k === i));
  }
  // next hop: a pseudo-random stop in another place
  function next() {
    const options = STOPS.map((s, i) => i).filter(i => STOPS[i].at !== STOPS[cur].at);
    go(options[Math.floor(Math.random() * options.length)]);
  }

  // quadratic arc between two map points, bulging upward
  function arc(a, b) {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a, [(a[0] + b[0]) / 2, Math.max((a[1] + b[1]) / 2 - d * 0.3, 10)], b];
  }
  const q = (A, t) => [
    (1 - t) * (1 - t) * A[0][0] + 2 * (1 - t) * t * A[1][0] + t * t * A[2][0],
    (1 - t) * (1 - t) * A[0][1] + 2 * (1 - t) * t * A[1][1] + t * t * A[2][1],
  ];
  function strokeArc(A, t0, t1, style, width) {
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) { const p = q(A, t0 + (t1 - t0) * k / 48); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.stroke();
  }

  // ---------- the land is drawn once into an offscreen layer ----------
  // on narrow screens the view is cropped to Europe–Asia–Oceania so it stays readable
  let scale = 1, dpr = 1, vx = 0, base = null;
  function fit() {
    dpr = Math.min(devicePixelRatio, 2);
    const w = canvas.clientWidth;
    if (canvas.width === Math.round(w * dpr) && base) return;
    vx = w < 600 ? 430 : 0;
    scale = w / (D.W - vx);
    const h = D.H * scale;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.height = h + "px";
    base = document.createElement("canvas");
    base.width = canvas.width; base.height = canvas.height;
    const b = base.getContext("2d");
    b.setTransform(dpr * scale, 0, 0, dpr * scale, -vx * dpr * scale, 0);
    // faint graticule
    b.strokeStyle = "rgba(96,165,250,.08)"; b.lineWidth = 1 / scale;
    for (let x = 0; x <= D.W; x += D.W / 12) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, D.H); b.stroke(); }
    for (let y = D.H / 12; y <= D.H; y += D.H / 6) { b.beginPath(); b.moveTo(0, y); b.lineTo(D.W, y); b.stroke(); }
    b.fillStyle = "rgba(125,180,255,.6)";
    const r = Math.max(1.55, 0.9 / scale);
    for (const [x, y] of dots) { b.beginPath(); b.arc(x, y, r, 0, 7); b.fill(); }
  }

  function draw(t) {
    fit();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, -vx * dpr * scale, 0);
    const u = 1 / scale; // one CSS pixel in map units, so pins and labels stay legible on phones
    const s = STOPS[cur], here = P[s.at];
    const tf = Math.min(phase / FLY, 1), ease = tf < .5 ? 2 * tf * tf : 1 - Math.pow(-2 * tf + 2, 2) / 2;

    // land around the destination lights up once we arrive
    if (tf >= 1) {
      const glow = Math.min((phase - FLY) / 0.4, 1);
      for (const [x, y] of dots) {
        const n = 1 - Math.hypot(x - here[0], y - here[1]) / 60;
        if (n > 0) { ctx.fillStyle = `rgba(34,211,238,${n * 0.9 * glow})`; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, 7); ctx.fill(); }
      }
    }
    // a few twinkling dots
    for (let k = 0; k < 14; k++) {
      const cycle = t * 1.5 + k * 0.37;
      const i = Math.floor(((Math.sin(k * 91.7 + Math.floor(cycle) * 12.9898) * 43758.5453) % 1 + 1) % 1 * dots.length);
      const a = Math.sin((cycle % 1) * Math.PI);
      ctx.fillStyle = `rgba(224,242,254,${a * 0.8})`; ctx.beginPath(); ctx.arc(dots[i][0], dots[i][1], 1.8, 0, 7); ctx.fill();
    }
    // fading past trails
    for (let k = trails.length - 1; k >= 0; k--) {
      const tr = trails[k];
      if (tr.age > 4) { trails.splice(k, 1); continue; }
      strokeArc(tr.A, 0, 1, `rgba(56,189,248,${0.35 * (1 - tr.age / 4)})`, 1.2 * u);
    }
    // current flight with a comet tail
    if (from) {
      const A = arc(P[from], here);
      lastArc = A;
      ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 10 * u;
      strokeArc(A, 0, ease, "rgba(125,211,252,.8)", 1.4 * u);
      if (tf < 1) {
        strokeArc(A, Math.max(ease - 0.12, 0), ease, "rgba(224,242,254,.95)", 3 * u);
        const h = q(A, ease);
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(h[0], h[1], 3.5 * u, 0, 7); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    // pins
    for (const key in P) {
      const [x, y] = P[key], active = key === s.at && tf >= 1;
      ctx.fillStyle = active ? "#22d3ee" : "#93c5fd";
      ctx.beginPath(); ctx.arc(x, y, (active ? 4.5 : 3.2) * u, 0, 7); ctx.fill();
      ctx.strokeStyle = "#04102a"; ctx.lineWidth = 1.5 * u; ctx.stroke();
    }
    // arrival ripples + label
    if (tf >= 1) {
      const since = phase - FLY;
      for (let r = 0; r < 3; r++) {
        const k = (since * 0.9 + r / 3) % 1;
        ctx.strokeStyle = `rgba(34,211,238,${(1 - k) * Math.min(since * 3, 1)})`; ctx.lineWidth = 1.4 * u;
        ctx.beginPath(); ctx.arc(here[0], here[1], (5 + k * 24) * u, 0, 7); ctx.stroke();
      }
      const label = s.where.toUpperCase();
      ctx.globalAlpha = Math.min(since * 4, 1);
      ctx.font = `600 ${11 * u}px 'JetBrains Mono', monospace`;
      const w = ctx.measureText(label).width + 14 * u, lh = 20 * u;
      let lx = here[0] + 10 * u, ly = here[1] - 28 * u;
      if (lx + w > D.W - 6) lx = here[0] - 10 * u - w;
      if (ly < 6) ly = here[1] + 10 * u;
      ctx.fillStyle = "rgba(4,16,42,.88)"; ctx.strokeStyle = "rgba(56,189,248,.6)"; ctx.lineWidth = u;
      ctx.beginPath(); ctx.roundRect(lx, ly, w, lh, 5 * u); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e0f2fe"; ctx.fillText(label, lx + 7 * u, ly + 14 * u);
      ctx.globalAlpha = 1;
    }
  }

  let visible = false, last = null;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: 0.15 }).observe(canvas);
  function loop(ms) {
    if (!visible) { last = null; return; }
    const t = ms / 1000, dt = last === null ? 0 : Math.min(t - last, 0.1);
    last = t;
    phase += dt;
    trails.forEach(tr => tr.age += dt);
    if (hold > 0) hold -= dt;
    else if (phase > FLY + STAY) next();
    draw(t);
    requestAnimationFrame(loop);
  }

  // clicking a pin on the map jumps to that place
  canvas.addEventListener("click", e => {
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / scale + vx, y = (e.clientY - r.top) / scale;
    let best = -1, bd = 22 / scale;
    STOPS.forEach((st, i) => { const d = Math.hypot(P[st.at][0] - x, P[st.at][1] - y); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) { go(best); hold = 10; }
  });

  go(0);
  draw(0);
})();
