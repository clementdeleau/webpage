// Canvas animations for the research cards and research page headers.
// <canvas data-anim="optics|fab|ai"> picks the animation.
(function () {

  function fit(c) {
    const dpr = Math.min(devicePixelRatio, 2), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [x, w, h];
  }

  // Waveguide with a long-period grating, a ring resonator and travelling photons
  function optics(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#04102a"; x.fillRect(0, 0, w, h);
    const y0 = h * 0.34, R = Math.min(w, h) * 0.17, cx = w * 0.62, cy = y0 - R - 6;
    // wavefronts
    for (let i = 0; i < 18; i++) {
      const px = ((i * 60 + t * 40) % (w + 120)) - 60;
      x.strokeStyle = `rgba(56,189,248,${0.05 + 0.04 * Math.sin(i)})`; x.lineWidth = 1;
      x.beginPath(); x.arc(px - 200, y0, 200, -0.5, 0.5); x.stroke();
    }
    // grating
    for (let gx = w * 0.1; gx < w * 0.42; gx += 14) {
      x.fillStyle = "rgba(125,211,252,.35)"; x.fillRect(gx, y0 - 10, 6, 20);
    }
    // bus waveguide + ring
    x.shadowColor = "#22d3ee"; x.shadowBlur = 12;
    x.strokeStyle = "rgba(34,211,238,.85)"; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, y0); x.lineTo(w, y0); x.stroke();
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    // photons on the bus
    for (let i = 0; i < 7; i++) {
      const px = ((t * 120 + i * (w / 7)) % w);
      x.fillStyle = "#e0f2fe"; x.beginPath(); x.arc(px, y0, 3.2, 0, 7); x.fill();
    }
    // photons circulating in the ring
    for (let i = 0; i < 4; i++) {
      const a = t * 2.2 + i * Math.PI / 2;
      x.fillStyle = "#a5f3fc"; x.beginPath(); x.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3, 0, 7); x.fill();
    }
    // a carbon nanotube emitter flashing single photons
    const ex = w * 0.27, ey = y0 + h * 0.22;
    x.strokeStyle = "rgba(165,180,252,.8)"; x.lineWidth = 4; x.beginPath(); x.moveTo(ex - 22, ey + 6); x.lineTo(ex + 22, ey - 6); x.stroke();
    const ph = (t * 0.8) % 1;
    x.fillStyle = `rgba(224,242,254,${1 - ph})`; x.beginPath(); x.arc(ex, ey - ph * (ey - y0), 4, 0, 7); x.fill();
    x.shadowBlur = 0;
  }

  // Wafer with dies being written by a scanning beam
  function fab(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#0a0f2c"; x.fillRect(0, 0, w, h);
    const r = Math.min(w, h) * 0.42, cx = w * 0.62, cy = h * 0.45;
    const g = x.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, "#8b93d6"); g.addColorStop(0.6, "#4b4f99"); g.addColorStop(1, "#2a2d66");
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    // iridescent sweep
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
    const sx = cx - r + ((t * 60) % (2 * r + 200)) - 100;
    const sg = x.createLinearGradient(sx - 80, 0, sx + 80, 0);
    sg.addColorStop(0, "rgba(255,255,255,0)"); sg.addColorStop(0.5, "rgba(186,230,253,.25)"); sg.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = sg; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    // dies
    const d = r / 4.2, cols = 9, total = cols * cols;
    const done = Math.floor((t * 2.2) % (total + 10));
    let k = 0;
    for (let i = 0; i < cols; i++) for (let j = 0; j < cols; j++) {
      const dx = cx + (i - 4) * d, dy = cy + (j - 4) * d;
      if (Math.hypot(dx - cx, dy - cy) > r - d * 0.6) continue;
      x.strokeStyle = "rgba(199,210,254,.35)"; x.strokeRect(dx - d / 2 + 2, dy - d / 2 + 2, d - 4, d - 4);
      if (k < done) {
        x.strokeStyle = "rgba(165,243,252,.9)"; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(dx - d / 2 + 5, dy); x.lineTo(dx + d / 2 - 5, dy);
        x.arc(dx, dy - d * 0.18, d * 0.16, Math.PI / 2, Math.PI * 2.5); x.stroke(); x.lineWidth = 1;
      }
      if (k === done) {
        x.fillStyle = "#e0f2fe"; x.shadowColor = "#a5b4fc"; x.shadowBlur = 20;
        x.beginPath(); x.arc(dx + Math.sin(t * 20) * d * 0.3, dy, 4, 0, 7); x.fill(); x.shadowBlur = 0;
        x.strokeStyle = "rgba(165,180,252,.5)"; x.beginPath(); x.moveTo(dx, dy); x.lineTo(dx, cy - r - 60); x.stroke();
      }
      k++;
    }
    x.restore();
    // flat notch
    x.fillStyle = "#0a0f2c"; x.fillRect(cx - r * 0.25, cy + r - 6, r * 0.5, 8);
  }

  // Neural network with signals propagating
  const net = [5, 8, 8, 4];
  function ai(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#03140f"; x.fillRect(0, 0, w, h);
    x.font = "11px monospace"; x.fillStyle = "rgba(34,197,94,.13)";
    for (let i = 0; i < 26; i++) for (let j = 0; j < 14; j++) {
      x.fillText(((Math.sin(i * 12.9 + j * 78.2 + Math.floor(t * 2)) * 43758) % 1).toFixed(2).slice(-2), i * 34, j * 22 + 14);
    }
    const left = w * 0.32, right = w * 0.95, top = h * 0.12, bot = h * 0.62;
    const pos = net.map((n, li) => Array.from({ length: n }, (_, k) => [left + (right - left) * li / (net.length - 1), top + (bot - top) * (k + 0.5) / n]));
    x.lineWidth = 1;
    for (let li = 0; li < net.length - 1; li++) for (const a of pos[li]) for (const b of pos[li + 1]) {
      x.strokeStyle = "rgba(94,234,212,.12)"; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
    }
    for (let s = 0; s < 22; s++) {
      const li = s % (net.length - 1), ph = (t * 0.9 + s * 0.137) % 1;
      const a = pos[li][(s * 7) % net[li]], b = pos[li + 1][(s * 5) % net[li + 1]];
      x.fillStyle = "#bbf7d0"; x.shadowColor = "#22c55e"; x.shadowBlur = 10;
      x.beginPath(); x.arc(a[0] + (b[0] - a[0]) * ph, a[1] + (b[1] - a[1]) * ph, 2.4, 0, 7); x.fill();
    }
    x.shadowBlur = 0;
    pos.flat().forEach(([px, py], i) => {
      const on = 0.5 + 0.5 * Math.sin(t * 3 + i);
      x.fillStyle = `rgba(94,234,212,${0.35 + on * 0.6})`; x.beginPath(); x.arc(px, py, 5, 0, 7); x.fill();
    });
  }

  const fns = { optics, fab, ai };
  const items = [...document.querySelectorAll("canvas[data-anim]")].map(c => ({ c, fn: fns[c.dataset.anim], on: false }));
  const io = new IntersectionObserver(es => es.forEach(e => { const it = items.find(i => i.c === e.target); if (it) it.on = e.isIntersecting; }));
  items.forEach(it => { io.observe(it.c); it.fn(it.c, 3); });
  (function loop(ms) {
    const t = ms / 1000;
    items.forEach(it => { if (it.on) it.fn(it.c, t); });
    requestAnimationFrame(loop);
  })(0);
})();
