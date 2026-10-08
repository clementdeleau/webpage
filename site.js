// Page interactions: hero slideshow, typed role line, background waves,
// publication filters and scroll reveal.
(function () {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("year").textContent = new Date().getFullYear();

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
  if (!reduceMotion) {
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
  const wc = document.getElementById("waves");
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
  let wavesOn = true;
  new IntersectionObserver(([e]) => { wavesOn = e.isIntersecting; if (wavesOn && !reduceMotion) requestAnimationFrame(waveLoop); }).observe(wc);
  function waveLoop(ms) { if (!wavesOn) return; drawWaves(ms / 1000); requestAnimationFrame(waveLoop); }
  drawWaves(0);

  // ---------- hero slideshow: voxel lab + photos ----------
  const holder = document.getElementById("slides");
  const scan = document.getElementById("scan");
  const dots = document.getElementById("dots");
  const labelText = document.getElementById("label-text");
  const slides = [holder.querySelector(".slide.voxel")];
  (window.PHOTOS || []).forEach(p => {
    const s = document.createElement("div");
    s.className = "slide photo";
    s.dataset.label = p.label;
    const img = new Image();
    img.src = p.src; img.alt = p.label; img.loading = "lazy"; img.decoding = "async";
    if (p.pos) img.style.objectPosition = p.pos;
    s.appendChild(img);
    holder.insertBefore(s, scan);
    slides.push(s);
  });
  let cur = 0, timer = null;
  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.setAttribute("aria-label", "Show slide " + (i + 1));
    b.addEventListener("click", () => show(i, true));
    dots.appendChild(b);
  });
  const dotEls = [...dots.children];
  if (slides.length < 2) dots.style.display = "none";

  function show(n, manual) {
    if (n === cur && !manual) return;
    const prev = slides[cur], next = slides[n];
    if (n !== cur) {
      next.classList.remove("entering"); void next.offsetWidth;
      next.classList.add("active", "entering");
      setTimeout(() => { prev.classList.remove("active"); next.classList.remove("entering"); }, 1100);
      scan.classList.remove("go"); void scan.offsetWidth; scan.classList.add("go");
    }
    cur = n;
    labelText.textContent = next.dataset.label;
    dotEls.forEach((d, i) => d.classList.toggle("on", i === n));
    window.voxelActive = n === 0;
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (reduceMotion || slides.length < 2) return;
    timer = setTimeout(() => show((cur + 1) % slides.length), cur === 0 ? 11000 : 6000);
  }
  window.voxelActive = true;
  dotEls[0].classList.add("on");
  schedule();

  // ---------- publication filters ----------
  const pubs = [...document.querySelectorAll("#pubs .pub")];
  document.querySelectorAll("#filters button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#filters button").forEach(b => b.classList.toggle("on", b === btn));
      const f = btn.dataset.f;
      pubs.forEach(p => { p.style.display = f === "all" || p.dataset.t === f ? "" : "none"; });
    });
  });
})();
