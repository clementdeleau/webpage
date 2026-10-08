// Page interactions: hero slideshow, typed role line, background waves,
// publication filters and scroll reveal.
(function () {
  const yearEl = document.getElementById("year"); if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- reveal on scroll ----------
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // ---------- typed role line ----------
  const roles = [
    "Researcher in integrated photonics and optoelectronics",
    "Carbon nanotube single-photon sources on photonic chips",
    "On-chip optical modulation for spectrometric applications",
    "Integrated optical sensors, from gas detection to nanometric displacement",
    "Neural-network-controlled photonic circuits for spectral sensing and shaping",
  ];
  const roleEl = document.getElementById("role");
  if (roleEl) {
    let r = 0, i = roles[0].length, deleting = true;
    roleEl.innerHTML = roles[0] + '<span class="cursor"></span>';
    const tick = () => {
      const word = roles[r];
      i += deleting ? -1 : 1;
      roleEl.innerHTML = word.slice(0, i) + '<span class="cursor"></span>';
      let delay = deleting ? 22 : 48;
      if (!deleting && i === word.length) { deleting = true; delay = 2600; }
      else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 3200);
  }

  // ---------- background light waves in the hero ----------
  const wc = document.getElementById("waves") || document.createElement("canvas");
  const wx = wc.getContext("2d");
  function drawWaves(t) {
    const w = wc.clientWidth, h = wc.clientHeight, dpr = Math.min(devicePixelRatio, 2);
    if (wc.width !== w * dpr) { wc.width = w * dpr; wc.height = h * dpr; }
    wx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wx.clearRect(0, 0, w, h);
    for (let k = 0; k < 4; k++) {
      wx.beginPath();
      const amp = 18 + k * 9, freq = 0.006 + k * 0.0015, y0 = h * (0.62 + k * 0.07);
      for (let x = 0; x <= w; x += 6) {
        const env = Math.exp(-(((x / w) - 0.35) ** 2) / 0.08);
        const y = y0 + Math.sin(x * freq + t * (0.6 + k * 0.15) + k) * amp * env;
        x ? wx.lineTo(x, y) : wx.moveTo(x, y);
      }
      wx.strokeStyle = `rgba(${k % 2 ? "34,211,238" : "96,165,250"},${0.35 - k * 0.06})`;
      wx.lineWidth = 1.4;
      wx.stroke();
    }
  }
  let wavesOn = !!wc.isConnected;
  if (wc.isConnected) new IntersectionObserver(([e]) => { wavesOn = e.isIntersecting; if (wavesOn) requestAnimationFrame(waveLoop); }).observe(wc);
  function waveLoop(ms) { if (!wavesOn) return; drawWaves(ms / 1000); requestAnimationFrame(waveLoop); }
  drawWaves(0);

  // ---------- hero: voxel scene switcher ----------
  const tabs = document.getElementById("scene-tabs");
  if (tabs && window.SCENES) {
    const scenes = window.SCENES;
    const scan = document.getElementById("scan");
    const labelText = document.getElementById("label-text");
    let cur = 0, timer = null, paused = false;
    const btns = scenes.map((sc, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = sc.name; b.setAttribute("role", "tab");
      b.addEventListener("click", () => { paused = true; show(i); clearTimeout(timer); timer = setTimeout(() => { paused = false; schedule(); }, 15000); });
      tabs.appendChild(b); return b;
    });
    function show(i) {
      cur = i;
      window.voxelScene = scenes[i].id;
      labelText.textContent = scenes[i].label;
      btns.forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-selected", k === i); });
      scan.classList.remove("go"); void scan.offsetWidth; scan.classList.add("go");
      if (!paused) schedule();
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(() => show((cur + 1) % scenes.length), 4500); }
    // ?scene=clean opens the hero on a given scene
    const q = new URLSearchParams(location.search).get("scene");
    const first = Math.max(scenes.findIndex(sc => sc.id === q), 0);
    if (q) paused = true; // a shared link to one scene stays on it until a tab is clicked
    window.voxelActive = true;
    show(first);
  }

  // ---------- about: photo gallery ----------
  const gallery = document.getElementById("gallery");
  if (gallery && window.PHOTOS && window.PHOTOS.length) {
    const dotsEl = gallery.querySelector(".gallery-dots");
    const imgs = window.PHOTOS.map((p, i) => {
      const img = new Image();
      img.src = p.src; img.alt = p.alt; img.decoding = "async"; img.loading = i ? "lazy" : "eager";
      if (p.pos) img.style.objectPosition = p.pos;
      gallery.insertBefore(img, dotsEl);
      return img;
    });
    const dots = imgs.map((_, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", "Photo " + (i + 1));
      b.addEventListener("click", () => go(i));
      dotsEl.appendChild(b); return b;
    });
    let gi = 0, gt = null;
    function go(i) {
      imgs[gi].classList.remove("on");
      gi = i;
      imgs[gi].classList.remove("on"); void imgs[gi].offsetWidth; imgs[gi].classList.add("on");
      dots.forEach((d, k) => d.classList.toggle("on", k === gi));
      clearTimeout(gt); gt = setTimeout(() => go((gi + 1) % imgs.length), 5000);
    }
    if (imgs.length < 2) dotsEl.style.display = "none";
    go(0);
  }

  // ---------- page-to-page "warp" transition ----------
  const warp = document.createElement("div");
  warp.className = "warp";
  warp.innerHTML = "<i></i>";
  document.body.appendChild(warp);
  let warped = null;
  try { warped = sessionStorage.getItem("warp"); sessionStorage.removeItem("warp"); } catch (e) {}
  if (warped) {
    warp.classList.add("out");
    setTimeout(() => warp.classList.remove("out"), 900);
  }
  document.querySelectorAll("a[data-warp]").forEach(a => {
    a.addEventListener("click", e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      const r = a.getBoundingClientRect();
      warp.style.setProperty("--x", (r.left + r.width / 2) + "px");
      warp.style.setProperty("--y", (r.top + r.height / 2) + "px");
      warp.style.setProperty("--wc", getComputedStyle(a).getPropertyValue("--c1") || "#0ea5e9");
      warp.classList.add("in");
      try { sessionStorage.setItem("warp", "1"); } catch (err) {}
      setTimeout(() => { location.href = a.href; }, 650);
    });
  });
  addEventListener("pageshow", e => { if (e.persisted) warp.classList.remove("in"); });

  // ---------- publication filters ----------
  const pubs = [...document.querySelectorAll(".pubs .pub")];
  document.querySelectorAll("#filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#filters button").forEach(b => b.classList.toggle("on", b === btn));
      const f = btn.dataset.f;
      pubs.forEach(p => { p.style.display = f === "all" || p.dataset.t === f ? "" : "none"; });
    });
  });
})();
