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
    "Postdoctoral researcher in integrated photonics",
    "Single-photon sources on silicon nitride",
    "Electro-optic lithium niobate resonators",
    "On-chip optical sensors",
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

  // ---------- hero slideshow: voxel scenes + photos ----------
  const holder = document.getElementById("slides");
  if (holder) {
    const scan = document.getElementById("scan");
    const dots = document.getElementById("dots");
    const labelText = document.getElementById("label-text");
    const voxelEl = holder.querySelector(".slide.voxel");
    const list = window.SLIDES || [{ voxel: "lab", label: voxelEl.dataset.label }];
    const els = list.map(item => {
      if (item.voxel) return voxelEl;
      const s = document.createElement("div");
      s.className = "slide photo";
      const img = new Image();
      img.src = item.src; img.alt = item.label; img.decoding = "async";
      if (item.pos) img.style.objectPosition = item.pos;
      s.appendChild(img);
      holder.insertBefore(s, scan);
      return s;
    });
    let cur = 0, timer = null;
    list.forEach((_, i) => {
      const b = document.createElement("button");
      b.setAttribute("aria-label", "Show slide " + (i + 1));
      b.addEventListener("click", () => show(i));
      dots.appendChild(b);
    });
    const dotEls = [...dots.children];
    if (list.length < 2) dots.style.display = "none";

    function apply(i) {
      const item = list[i];
      labelText.textContent = item.label;
      dotEls.forEach((d, k) => d.classList.toggle("on", k === i));
      window.voxelActive = !!item.voxel;
      if (item.voxel) window.voxelScene = item.voxel;
    }
    function show(n) {
      if (n === cur) return;
      const prev = els[cur], next = els[n];
      next.classList.remove("entering"); void next.offsetWidth;
      next.classList.add("active", "entering");
      if (prev !== next) setTimeout(() => prev.classList.remove("active"), 1100);
      setTimeout(() => next.classList.remove("entering"), 1100);
      scan.classList.remove("go"); void scan.offsetWidth; scan.classList.add("go");
      cur = n;
      apply(n);
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (list.length < 2) return;
      timer = setTimeout(() => show((cur + 1) % list.length), list[cur].hold || 6000);
    }
    // ?slide=N opens the hero on a given slide (handy for sharing a specific scene)
    const startAt = Math.min(Math.max(parseInt(new URLSearchParams(location.search).get("slide"), 10) || 0, 0), list.length - 1);
    if (startAt) { voxelEl.classList.remove("active"); els[startAt].classList.add("active"); cur = startAt; }
    apply(cur);
    schedule();
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
