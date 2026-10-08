// Animated journey map: a dotted world map where a photon flies from Toulouse to
// each place Clément studied, taught or worked, with a panel describing each stop.
(function () {
  const canvas = document.getElementById("map");
  const D = window.MAP_DATA;
  if (!canvas || !D) return;
  const P = D.places;
  const STOPS = [
    { at: "toulouse", from: null, where: "Toulouse, France", when: "2012 – 2018", title: "Physics engineering at INSA Toulouse",
      text: "Master in Physics Engineering, with research internships at the National Laboratory for Intense Magnetic Fields (LNCMI) and at LPCNO." },
    { at: "malaysia", from: "toulouse", where: "Malaysia", when: "2016", title: "Exchange semester",
      text: "A semester abroad in Malaysia during my engineering studies." },
    { at: "sydney", from: "toulouse", where: "Sydney, Australia", when: "2017", title: "Astrophotonics internship",
      text: "Engineer intern at the Sydney Astrophotonics Instrumentation Laboratory, University of Sydney." },
    { at: "toulouse", from: "sydney", where: "Toulouse, France", when: "2019 – 2023", title: "PhD, postdoc and teaching",
      text: "PhD at LAAS-CNRS on integrated long-period waveguide gratings for sensing, then postdoc at Toulouse INP (ENSEEIHT). Five years of part-time teaching of the C programming language." },
    { at: "thailand", from: "toulouse", where: "Thailand", when: "2 months", title: "Assistant Professor",
      text: "A two-month position as assistant professor in Thailand." },
    { at: "wako", from: "toulouse", where: "Wako, Japan", when: "2024 → now", title: "RIKEN Center for Advanced Photonics",
      text: "JSPS fellow, then RIKEN Special Postdoctoral Researcher: single photons from carbon nanotubes on photonic chips." },
  ];

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
    b.addEventListener("click", () => { go(i); hold = 12; });
    li.appendChild(b); els.list.appendChild(li); return b;
  });

  let cur = -1, phase = 0, hold = 0, visited = new Set();
  const FLY = 1.6, STAY = 3.2;
  function go(i) {
    cur = i; phase = 0;
    const s = STOPS[i];
    els.when.textContent = s.when; els.where.textContent = s.where;
    els.title.textContent = s.title; els.text.textContent = s.text;
    items.forEach((b, k) => b.classList.toggle("on", k === i));
    if (i === 0) visited = new Set();
  }

  // quadratic arc between two map points, bulging "upward"
  function arc(a, b) {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [a, [mx, Math.max(my - d * 0.24, 24)], b];
  }
  const q = (A, t) => [
    (1 - t) * (1 - t) * A[0][0] + 2 * (1 - t) * t * A[1][0] + t * t * A[2][0],
    (1 - t) * (1 - t) * A[0][1] + 2 * (1 - t) * t * A[1][1] + t * t * A[2][1],
  ];
  function strokeArc(A, t0, t1, style, width) {
    ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const p = q(A, t0 + (t1 - t0) * k / 40); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.stroke();
  }

  let scale = 1;
  function fit() {
    const dpr = Math.min(devicePixelRatio, 2), w = canvas.clientWidth, h = w * D.H / D.W;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); canvas.style.height = h + "px"; }
    scale = w / D.W;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  }

  function draw(t) {
    fit();
    ctx.clearRect(0, 0, D.W, D.H);
    const u = 1 / scale; // one CSS pixel in map units, so pins and labels stay legible on phones
    const s = STOPS[cur], here = P[s.at];
    // land dots, brighter near the current stop, with a slow scan line sweeping across
    const scanX = (t * 160) % (D.W + 200) - 100;
    for (const [x, y] of dots) {
      const near = Math.max(0, 1 - Math.hypot(x - here[0], y - here[1]) / 140);
      const scan = Math.max(0, 1 - Math.abs(x - scanX) / 60) * 0.35;
      const a = 0.16 + near * 0.6 + scan;
      ctx.fillStyle = near > 0.05 ? `rgba(34,211,238,${a})` : `rgba(96,165,250,${a})`;
      ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
    }
    // previously travelled routes
    STOPS.forEach((st, i) => {
      if (!st.from || !visited.has(i) || i === cur) return;
      strokeArc(arc(P[st.from], P[st.at]), 0, 1, "rgba(56,189,248,.3)", 1.2 * u);
    });
    // current flight
    const tf = Math.min(phase / FLY, 1), ease = 1 - Math.pow(1 - tf, 3);
    if (s.from) {
      const A = arc(P[s.from], P[s.at]);
      ctx.shadowColor = "#22d3ee"; ctx.shadowBlur = 12;
      strokeArc(A, 0, ease, "rgba(125,211,252,.9)", 1.6 * u);
      if (tf < 1) {
        const h = q(A, ease);
        ctx.fillStyle = "#e0f2fe"; ctx.beginPath(); ctx.arc(h[0], h[1], 3.5 * u, 0, 7); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
    // pins
    const seen = new Set();
    STOPS.forEach((st, i) => {
      if (seen.has(st.at)) return; seen.add(st.at);
      const [x, y] = P[st.at], active = st.at === s.at && tf >= 1;
      ctx.fillStyle = active ? "#22d3ee" : "#60a5fa";
      ctx.beginPath(); ctx.arc(x, y, (active ? 4.5 : 3.5) * u, 0, 7); ctx.fill();
      ctx.strokeStyle = "#04102a"; ctx.lineWidth = 1.5 * u; ctx.stroke();
    });
    // arrival ripples + label
    if (tf >= 1) {
      for (let r = 0; r < 3; r++) {
        const k = ((t * 0.8 + r / 3) % 1);
        ctx.strokeStyle = `rgba(34,211,238,${1 - k})`; ctx.lineWidth = 1.4 * u;
        ctx.beginPath(); ctx.arc(here[0], here[1], (6 + k * 26) * u, 0, 7); ctx.stroke();
      }
      const label = s.where.toUpperCase();
      ctx.font = `600 ${11 * u}px 'JetBrains Mono', monospace`;
      const w = ctx.measureText(label).width + 14 * u, lh = 20 * u;
      let lx = here[0] + 10 * u, ly = here[1] - 28 * u;
      if (lx + w > D.W - 6) lx = here[0] - 10 * u - w;
      if (ly < 6) ly = here[1] + 10 * u;
      ctx.fillStyle = "rgba(4,16,42,.88)"; ctx.strokeStyle = "rgba(56,189,248,.6)"; ctx.lineWidth = u;
      ctx.beginPath(); ctx.roundRect(lx, ly, w, lh, 5 * u); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e0f2fe"; ctx.fillText(label, lx + 7 * u, ly + 14 * u);
    }
  }

  let visible = false, last = null;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(loop); }, { threshold: 0.15 }).observe(canvas);
  function loop(ms) {
    if (!visible) { last = null; return; }
    const t = ms / 1000, dt = last === null ? 0 : Math.min(t - last, 0.1);
    last = t;
    phase += dt;
    if (hold > 0) hold -= dt;
    else if (phase > FLY + STAY) { visited.add(cur); go((cur + 1) % STOPS.length); }
    draw(t);
    requestAnimationFrame(loop);
  }

  // clicking a pin on the map jumps to that stop
  canvas.addEventListener("click", e => {
    const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) / scale, y = (e.clientY - r.top) / scale;
    let best = -1, bd = 22 / scale;
    STOPS.forEach((st, i) => { const d = Math.hypot(P[st.at][0] - x, P[st.at][1] - y); if (d < bd) { bd = d; best = i; } });
    if (best >= 0) { visited.add(cur); go(best); hold = 12; }
  });

  go(0);
  draw(0);
})();
