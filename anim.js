// Canvas animations for the research cards and research page headers.
// <canvas data-anim="optics|fab|ai"> picks the animation.
(function () {

  function fit(c) {
    const dpr = Math.min(devicePixelRatio, 2), w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const x = c.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [x, w, h];
  }

  // Waveguide with a long-period grating and an electro-optically modulated ring resonator
  function optics(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#04102a"; x.fillRect(0, 0, w, h);
    const tight = c.parentElement.tagName === "FIGURE"; // half-width panel on the home cards
    const y0 = h * (tight ? 0.56 : 0.34), R = Math.min(w, h) * 0.17, cx = w * (tight ? 0.64 : 0.62), cy = y0 - R - 6;
    const mod = t => 0.5 + 0.5 * Math.sin(t * 3); // drive voltage on the ring, 0..1
    const m = mod(t);
    // wavefronts
    for (let i = 0; i < 18; i++) {
      const px = ((i * 60 + t * 40) % (w + 120)) - 60;
      x.strokeStyle = `rgba(56,189,248,${0.05 + 0.04 * Math.sin(i)})`; x.lineWidth = 1;
      x.beginPath(); x.arc(px - 200, y0, 200, -0.5, 0.5); x.stroke();
    }
    // grating
    for (let gx = w * (tight ? 0.05 : 0.1); gx < w * (tight ? 0.38 : 0.42); gx += tight ? 10 : 14) {
      x.fillStyle = "rgba(125,211,252,.35)"; x.fillRect(gx, y0 - 10, tight ? 4 : 6, 20);
    }
    // electrodes around the ring, glowing with the drive voltage
    x.lineWidth = 5; x.lineCap = "round";
    x.strokeStyle = `rgba(251,191,36,${0.35 + 0.55 * m})`;
    x.beginPath(); x.arc(cx, cy, R + 9, Math.PI * 0.85, Math.PI * 1.9); x.stroke();
    x.strokeStyle = "rgba(251,191,36,.3)";
    x.beginPath(); x.arc(cx, cy, R - 9, Math.PI * 0.95, Math.PI * 1.8); x.stroke();
    x.lineCap = "butt";
    // drive signal trace
    x.strokeStyle = "rgba(251,191,36,.6)"; x.lineWidth = 1.2; x.beginPath();
    for (let k = 0; k <= 40; k++) {
      const sx = cx - R + k * R / 20, sy = cy - R - 20 - 6 * Math.sin(t * 3 - k * 0.25);
      k ? x.lineTo(sx, sy) : x.moveTo(sx, sy);
    }
    x.stroke();
    // bus waveguide + ring (ring brightness follows the modulation)
    x.shadowColor = "#22d3ee"; x.shadowBlur = 12;
    x.strokeStyle = "rgba(34,211,238,.85)"; x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, y0); x.lineTo(w, y0); x.stroke();
    x.shadowBlur = 6 + 14 * m;
    x.strokeStyle = `rgba(34,211,238,${0.45 + 0.5 * m})`;
    x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
    // photons on the bus: after the ring their intensity carries the modulation
    for (let i = 0; i < 9; i++) {
      const px = ((t * 120 + i * (w / 9)) % w);
      const a = px < cx ? 1 : 0.25 + 0.75 * mod(t - (px - cx) / 120);
      x.fillStyle = `rgba(224,242,254,${a})`; x.beginPath(); x.arc(px, y0, 3.2, 0, 7); x.fill();
    }
    // photons circulating in the ring, counter-clockwise so they follow the bus at the coupler
    for (let i = 0; i < 4; i++) {
      const a = -t * 2.2 + i * Math.PI / 2;
      x.fillStyle = `rgba(165,243,252,${0.4 + 0.6 * m})`; x.beginPath(); x.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 3, 0, 7); x.fill();
    }
    // a carbon nanotube emitter flashing single photons
    const ex = w * (tight ? 0.24 : 0.27), ey = y0 + h * (tight ? 0.24 : 0.22);
    x.strokeStyle = "rgba(165,180,252,.8)"; x.lineWidth = 4; x.beginPath(); x.moveTo(ex - 22, ey + 6); x.lineTo(ex + 22, ey - 6); x.stroke();
    const ph = (t * 0.8) % 1;
    x.fillStyle = `rgba(224,242,254,${1 - ph})`; x.beginPath(); x.arc(ex, ey - ph * (ey - y0), 4, 0, 7); x.fill();
    x.shadowBlur = 0;
  }

  // Close-up: a carbon nanotube on a grating cavity, its emission building a resonant
  // standing wave before single photons leak out along the waveguide
  function cnt(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#04102a"; x.fillRect(0, 0, w, h);
    const y0 = h * 0.42, wg = Math.max(10, h * 0.07), cx = w * 0.5, per = Math.max(8, w * 0.045);
    const cyc = (t * 0.7) % 1; // one emission cycle
    const build = 0.3 + 0.7 * (cyc < 0.3 ? cyc / 0.3 : Math.max(0, 1 - (cyc - 0.3) / 0.5));
    // waveguide
    x.fillStyle = "rgba(34,211,238,.18)"; x.fillRect(0, y0 - wg / 2, w, wg);
    // grating teeth, with a defect cavity in the middle
    for (let k = -9; k <= 9; k++) {
      if (k === 0) continue;
      const gx = cx + k * per + (k > 0 ? per * 0.5 : -per * 0.5);
      x.fillStyle = "rgba(125,211,252,.45)"; x.fillRect(gx - per * 0.22, y0 - wg / 2 - 5, per * 0.44, wg + 10);
    }
    // resonant standing wave inside the cavity
    x.save(); x.beginPath(); x.rect(0, y0 - wg * 2, w, wg * 4); x.clip();
    for (let px = 0; px < w; px += 2) {
      const env = Math.exp(-(((px - cx) / (per * 4)) ** 2));
      const I = env * build * Math.cos((px - cx) / per * Math.PI) ** 2;
      if (I < 0.02) continue;
      x.fillStyle = `rgba(34,211,238,${Math.min(I * 1.1, 1)})`; x.fillRect(px, y0 - wg * 0.5 - I * wg * 0.8, 2, wg + 1.6 * I * wg);
    }
    x.restore();
    // the nanotube lying across the waveguide: a little honeycomb tube
    const tl = Math.min(w * 0.22, 70), ty = y0 - wg * 0.05;
    x.save(); x.translate(cx, ty); x.rotate(-0.12);
    const tg = x.createLinearGradient(0, -6, 0, 6);
    tg.addColorStop(0, "#c7d2fe"); tg.addColorStop(0.5, "#6366f1"); tg.addColorStop(1, "#312e81");
    x.fillStyle = tg; x.beginPath(); x.roundRect(-tl / 2, -5, tl, 10, 5); x.fill();
    x.strokeStyle = "rgba(224,231,255,.45)"; x.lineWidth = 0.8;
    for (let k = -tl / 2 + 4; k < tl / 2 - 2; k += 6) { x.beginPath(); x.moveTo(k, -5); x.lineTo(k + 3, 0); x.lineTo(k, 5); x.stroke(); }
    x.restore();
    // emission flash at the start of each cycle
    if (cyc < 0.2) {
      const f = 1 - cyc / 0.2;
      const g = x.createRadialGradient(cx, ty, 0, cx, ty, 26);
      g.addColorStop(0, `rgba(224,242,254,${f * 0.9})`); g.addColorStop(1, "rgba(224,242,254,0)");
      x.fillStyle = g; x.beginPath(); x.arc(cx, ty, 26, 0, 7); x.fill();
    }
    // single photon wavepackets leaking out on both sides
    if (cyc > 0.25) {
      const d = (cyc - 0.25) / 0.75 * (w * 0.5);
      x.shadowColor = "#a5f3fc"; x.shadowBlur = 10;
      for (const s of [-1, 1]) {
        const px = cx + s * (per * 3 + d);
        for (let k = -8; k <= 8; k++) {
          const a = Math.exp(-((k / 4) ** 2)) * (0.35 + 0.65 * Math.abs(Math.cos(k * 0.9 - t * 18)));
          x.fillStyle = `rgba(224,242,254,${a})`; x.fillRect(px + k * 1.8, y0 - 4, 1.8, 8);
        }
      }
      x.shadowBlur = 0;
    }
    // emission spectrum matching the cavity resonance
    const sx = w * 0.12, sw = w * 0.76, sb = h * 0.9, sh = h * 0.22;
    x.strokeStyle = "rgba(125,211,252,.25)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(sx, sb); x.lineTo(sx + sw, sb); x.stroke();
    x.strokeStyle = "rgba(165,180,252,.7)"; x.beginPath();
    for (let k = 0; k <= 60; k++) { const u = k / 60, y = sb - sh * 0.5 * Math.exp(-(((u - 0.5) / 0.18) ** 2)); k ? x.lineTo(sx + u * sw, y) : x.moveTo(sx + u * sw, y); }
    x.stroke();
    x.strokeStyle = `rgba(34,211,238,${0.4 + 0.6 * build})`; x.lineWidth = 1.6; x.beginPath();
    for (let k = 0; k <= 60; k++) { const u = k / 60, y = sb - sh * (0.3 + 0.7 * build) * Math.exp(-(((u - 0.5) / 0.035) ** 2)); k ? x.lineTo(sx + u * sw, y) : x.moveTo(sx + u * sw, y); }
    x.stroke();
  }

  // Wafer with dies being written by a scanning beam
  function fab(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#0a0f2c"; x.fillRect(0, 0, w, h);
    const tight = c.parentElement.tagName === "FIGURE";
    const r = Math.min(w, h) * (tight ? 0.38 : 0.42), cx = w * (tight ? 0.5 : 0.62), cy = h * (tight ? 0.56 : 0.45);
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
    const tight = c.parentElement.tagName === "FIGURE";
    const left = w * (tight ? 0.1 : 0.32), right = w * (tight ? 0.9 : 0.95), top = h * (tight ? 0.2 : 0.12), bot = h * (tight ? 0.94 : 0.62);
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

  // Cross-section "mini video" of the process flow that turns a film into waveguides:
  // deposition, e-beam lithography, plasma etching, metallization
  const STEPS = ["deposition", "e-beam lithography", "plasma etching", "metallization"];
  function proc(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#0a0f2c"; x.fillRect(0, 0, w, h);
    const T = 2.4, step = Math.floor(t / T) % 4, p = (t % T) / T;
    const cx = w / 2, rw = w * 0.22, top = h * 0.5, ft = h * 0.09;
    const subTop = top + h * 0.1, ease = v => Math.min(Math.max(v, 0), 1);
    // substrate and buried oxide
    x.fillStyle = "#334155"; x.fillRect(0, subTop, w, h * 0.3);
    x.fillStyle = "#1e3a8a"; x.fillRect(0, top, w, subTop - top);
    // the guiding film: grows, then is etched away outside the ridge
    const grow = step === 0 ? ease(p / 0.8) : 1;
    const outside = step < 2 ? grow : step === 2 ? 1 - ease((p - 0.15) / 0.65) : 0;
    x.fillStyle = "#818cf8";
    x.fillRect(cx - rw / 2, top - ft * grow, rw, ft * grow);
    x.fillRect(0, top - ft * outside, cx - rw / 2, ft * outside);
    x.fillRect(cx + rw / 2, top - ft * outside, w - cx - rw / 2, ft * outside);
    // resist and its exposure
    const rt = h * 0.04, fy = top - ft;
    if (step === 1) {
      const fadeIn = ease(p / 0.12), dev = ease((p - 0.72) / 0.18);
      x.fillStyle = `rgba(244,114,182,${0.75 * fadeIn * (1 - dev)})`;
      x.fillRect(0, fy - rt, cx - rw / 2, rt); x.fillRect(cx + rw / 2, fy - rt, w - cx - rw / 2, rt);
      const wr = ease((p - 0.15) / 0.5);
      x.fillStyle = `rgba(244,114,182,${0.75 * fadeIn})`; x.fillRect(cx - rw / 2, fy - rt, rw, rt);
      x.fillStyle = "rgba(253,224,71,.85)"; x.fillRect(cx - rw / 2, fy - rt, rw * wr, rt);
      if (p > 0.15 && p < 0.65) {
        const bx = cx - rw / 2 + rw * wr + Math.sin(t * 40) * 2;
        x.strokeStyle = "rgba(165,180,252,.8)"; x.lineWidth = 2; x.shadowColor = "#a5b4fc"; x.shadowBlur = 12;
        x.beginPath(); x.moveTo(bx, 0); x.lineTo(bx, fy - rt); x.stroke(); x.shadowBlur = 0;
      }
    } else if (step === 2) {
      x.fillStyle = `rgba(253,224,71,${0.85 * (1 - ease((p - 0.85) / 0.15))})`; x.fillRect(cx - rw / 2, fy - rt, rw, rt);
      // plasma glow and ions
      const g = x.createLinearGradient(0, 0, 0, fy);
      g.addColorStop(0, `rgba(192,132,252,${0.45 + 0.1 * Math.sin(t * 12)})`); g.addColorStop(1, "rgba(192,132,252,0)");
      x.fillStyle = g; x.fillRect(0, 0, w, fy);
      x.strokeStyle = "rgba(233,213,255,.8)"; x.lineWidth = 1.2;
      for (let i = 0; i < 18; i++) {
        const ix = (i * 37.3) % w, iy = ((t * 160 + i * 53) % (fy + 10)) - 10;
        x.beginPath(); x.moveTo(ix, iy); x.lineTo(ix, iy + 8); x.stroke();
      }
    } else if (step === 3) {
      // gold electrodes evaporated on each side of the waveguide
      const mg = ease(p / 0.6), gap = rw * 0.6, mt = h * 0.05;
      x.fillStyle = "#fbbf24";
      x.fillRect(w * 0.06, top - mt * mg, cx - rw / 2 - gap - w * 0.06, mt * mg);
      x.fillRect(cx + rw / 2 + gap, top - mt * mg, w * 0.94 - cx - rw / 2 - gap, mt * mg);
      if (p < 0.65) for (let i = 0; i < 14; i++) {
        const ax = w * 0.08 + ((i * 41.7) % (w * 0.84)), ay = ((t * 120 + i * 29) % top);
        if (Math.abs(ax - cx) < rw / 2 + gap) continue;
        x.fillStyle = "rgba(253,230,138,.9)"; x.beginPath(); x.arc(ax, ay, 1.8, 0, 7); x.fill();
      }
    }
    if (step === 0 && p < 0.8) for (let i = 0; i < 16; i++) {
      const ax = (i * 29.7 + 7) % w, ay = ((t * 90 + i * 31) % (top - ft * grow));
      x.fillStyle = "rgba(199,210,254,.8)"; x.beginPath(); x.arc(ax, ay, 1.6, 0, 7); x.fill();
    }
    // light confined in the finished ridge
    if (step === 3 || (step === 2 && p > 0.85)) {
      const gl = x.createRadialGradient(cx, top - ft / 2, 0, cx, top - ft / 2, rw * 0.6);
      gl.addColorStop(0, "rgba(34,211,238,.9)"); gl.addColorStop(1, "rgba(34,211,238,0)");
      x.fillStyle = gl; x.beginPath(); x.ellipse(cx, top - ft / 2, rw * 0.6, ft * 0.9, 0, 0, 7); x.fill();
    }
    // step caption
    x.font = "600 11px 'JetBrains Mono', monospace"; x.fillStyle = "#c7d2fe";
    x.fillText(`${step + 1}/4 · ${STEPS[step]}`, 10, h - 12);
  }

  // Wavelength scan: a swept laser and drive signals go into a closed chip, the measured
  // spectrum builds up below
  function scan(c, t) {
    const [x, w, h] = fit(c);
    x.fillStyle = "#03140f"; x.fillRect(0, 0, w, h);
    const S = 3.2, sweep = Math.floor(t / S), u = (t % S) / S;
    const hue = 270 - 270 * u, col = a => `hsla(${hue},95%,62%,${a})`;
    const chipX = w * 0.3, chipW = w * 0.4, chipY = h * 0.24, chipH = h * 0.22, my = chipY + chipH / 2;
    // drive signals entering from the top
    const shapes = [k => Math.sign(Math.sin(k)), k => Math.sin(k), k => ((k / Math.PI) % 2) - 1];
    shapes.forEach((f, i) => {
      const lx = chipX + chipW * (0.25 + 0.25 * i);
      x.strokeStyle = "rgba(94,234,212,.75)"; x.lineWidth = 1.3; x.beginPath();
      for (let k = 0; k <= 30; k++) { const yy = k / 30 * chipY, xx = lx + 5 * f(yy * 0.35 - t * 6 + i); k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
    });
    // input fiber with the swept laser, output fiber to the detector
    x.strokeStyle = col(0.9); x.lineWidth = 3; x.shadowColor = col(1); x.shadowBlur = 10;
    x.beginPath(); x.moveTo(0, my); x.lineTo(chipX, my); x.stroke();
    for (let i = 0; i < 4; i++) { const px = ((t * 90 + i * chipX / 4) % chipX); x.fillStyle = "#fff"; x.beginPath(); x.arc(px, my, 2.2, 0, 7); x.fill(); }
    x.shadowBlur = 0;
    x.strokeStyle = "rgba(94,234,212,.6)"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(chipX + chipW, my); x.lineTo(w * 0.86, my); x.stroke();
    x.fillStyle = "#134e4a"; x.fillRect(w * 0.86, my - 9, w * 0.1, 18);
    // the chip itself stays a closed box
    const cg = x.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
    cg.addColorStop(0, "#1f2937"); cg.addColorStop(1, "#0b1220");
    x.fillStyle = cg; x.beginPath(); x.roundRect(chipX, chipY, chipW, chipH, 4); x.fill();
    x.strokeStyle = "rgba(94,234,212,.4)"; x.lineWidth = 1; x.stroke();
    for (let k = 0; k < 6; k++) { x.fillStyle = "#d4a017"; x.fillRect(chipX + 6 + k * (chipW - 12) / 6, chipY + 3, (chipW - 12) / 6 - 4, 4); }
    // spectrum plot: a different response each sweep
    const px0 = w * 0.08, pw = w * 0.84, pb = h * 0.9, ph = h * 0.3;
    x.strokeStyle = "rgba(94,234,212,.25)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(px0, pb - ph); x.lineTo(px0, pb); x.lineTo(px0 + pw, pb); x.stroke();
    const seed = k => (Math.sin(sweep * 12.9 + k * 78.2) * 43758.5) % 1;
    const peaks = [0, 1, 2, 3].map(k => [Math.abs(seed(k)), 0.03 + 0.03 * Math.abs(seed(k + 9)), 0.4 + 0.6 * Math.abs(seed(k + 4))]);
    const spec = v => 0.12 + peaks.reduce((a, [c0, wd, amp]) => a + amp * 0.8 / (1 + ((v - c0) / wd) ** 2), 0);
    x.beginPath();
    for (let k = 0; k <= 120 * u; k++) {
      const v = k / 120, yy = pb - Math.min(spec(v), 1) * ph;
      k ? x.lineTo(px0 + v * pw, yy) : x.moveTo(px0 + v * pw, yy);
    }
    x.strokeStyle = "#5eead4"; x.lineWidth = 1.6; x.stroke();
    // wavelength cursor
    x.strokeStyle = col(0.8); x.lineWidth = 1; x.beginPath(); x.moveTo(px0 + u * pw, pb - ph); x.lineTo(px0 + u * pw, pb); x.stroke();
    x.font = "11px 'JetBrains Mono', monospace"; x.fillStyle = "rgba(94,234,212,.7)"; x.fillText("λ", px0 + pw - 8, pb + 13 > h ? pb - 4 : pb + 13);
  }

  const fns = { optics, cnt, fab, proc, ai, scan };
  const items = [...document.querySelectorAll("canvas[data-anim]")].map(c => ({ c, fn: fns[c.dataset.anim], on: false }));
  const io = new IntersectionObserver(es => es.forEach(e => { const it = items.find(i => i.c === e.target); if (it) it.on = e.isIntersecting; }));
  items.forEach(it => { io.observe(it.c); it.fn(it.c, 3); });
  (function loop(ms) {
    const t = ms / 1000;
    items.forEach(it => { if (it.on) it.fn(it.c, t); });
    requestAnimationFrame(loop);
  })(0);
})();
