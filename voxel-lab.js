// Animated voxel scene for the hero: Clément at an optical table, steering a
// laser onto a silicon photonic chip that emits single photons to a detector.
import * as THREE from "three";

const stage = document.getElementById("stage");
const canvas = document.getElementById("scene");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.1, 400);

// ---------- voxel builder ----------
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const cube = new THREE.BoxGeometry(1, 1, 1);
const lambert = new THREE.MeshLambertMaterial();

function Vox() {
  const list = [];
  const api = {
    add(x, y, z, c) { list.push([x, y, z, c]); return api; },
    fill(x0, y0, z0, x1, y1, z1, c) {
      for (let x = x0; x < x1; x++)
        for (let y = y0; y < y1; y++)
          for (let z = z0; z < z1; z++)
            list.push([x, y, z, typeof c === "function" ? c(x, y, z) : c]);
      return api;
    },
    build(jitter = 0.05) {
      const mesh = new THREE.InstancedMesh(cube, lambert, list.length);
      const o = new THREE.Object3D();
      const col = new THREE.Color();
      list.forEach(([x, y, z, c], i) => {
        o.position.set(x + 0.5, y + 0.5, z + 0.5);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        col.set(c).offsetHSL(0, 0, (rand() - 0.5) * jitter);
        mesh.setColorAt(i, col);
      });
      mesh.castShadow = mesh.receiveShadow = true;
      return mesh;
    },
  };
  return api;
}

// ---------- room ----------
const room = Vox();
room.fill(-16, -1, -12, 16, 0, 10, (x, y, z) => ((x + z) & 1 ? "#d5dae4" : "#c8ceda")); // floor tiles
room.fill(-16, 0, -12, 16, 22, -11, (x, y) => (y === 3 ? "#1d4ed8" : y < 3 ? "#b9c3d6" : "#e6ecf5")); // back wall
room.fill(-17, 0, -12, -16, 22, 10, (x, y, z) => (y === 3 ? "#1d4ed8" : y < 3 ? "#b9c3d6" : "#dfe6f1")); // side wall
// laser-safety sign
room.fill(8, 13, -11, 13, 18, -10, "#facc15").fill(10, 14, -10, 11, 17, -9, "#111827");
// window with night sky onto the side wall
room.fill(-17, 9, -6, -16, 17, 3, (x, y, z) => (y === 9 || y === 16 || z === -6 || z === 2 ? "#9aa3b5" : "#1e2a5a"));
// plant
room.fill(11, 0, -9, 14, 3, -6, "#8b5a3c")
  .fill(11, 3, -9, 14, 7, -6, (x, y, z) => (rand() > 0.25 ? "#3fa34d" : "#2f7f3b"))
  .fill(12, 7, -8, 13, 9, -7, "#47b856");

// optical table
const tableTop = 8;
room.fill(-10, tableTop - 1, -4, 10, tableTop, 6, (x, y, z) => ((x & 1) && (z & 1) ? "#2a2f3a" : "#454c5c"));
for (const [x, z] of [[-10, -4], [9, -4], [-10, 5], [9, 5]]) room.fill(x, 0, z, x + 1, tableTop - 1, z + 1, "#6b7385");
room.fill(-9, 2, -4, 9, 3, -3, "#6b7385"); // crossbar

// laser head
room.fill(-9, tableTop, -2, -5, tableTop + 1, 1, "#9aa3b5")
  .fill(-9, tableTop + 1, -2, -5, tableTop + 4, 1, (x, y, z) => (y === tableTop + 2 && z === 0 ? "#22c55e" : "#1f2937"));
// mirror posts
const BEAM_Y = tableTop + 2.5;
const M1 = [6.5, -0.5], M2 = [6.5, 3.5], M3 = [-0.5, 3.5];
for (const [mx, mz] of [M1, M2, M3]) room.fill(Math.floor(mx), tableTop, Math.floor(mz), Math.floor(mx) + 1, tableTop + 2, Math.floor(mz) + 1, "#9aa3b5");
// sample stage under the turning mirror
room.fill(-3, tableTop, 1, 2, tableTop + 1, 6, "#565e70");
// single-photon detector
room.fill(-9, tableTop, 2, -6, tableTop + 3, 5, (x, y, z) => (x === -6 && y === tableTop + 1 && z === 3 ? "#22d3ee" : "#334155"));
// cart with monitor at the back
room.fill(-13, 0, -10, -5, 1, -6, "#6b7385").fill(-13, 1, -10, -12, 9, -9, "#6b7385").fill(-6, 1, -10, -5, 9, -9, "#6b7385")
  .fill(-13, 9, -10, -5, 10, -6, "#9aa3b5")
  .fill(-12, 10, -9, -6, 11, -8, "#1f2937")
  .fill(-13, 11, -10, -4, 17, -9, "#1f2937");
scene.add(room.build(0.05));

// monitor screen: live photoluminescence spectrum
const screenCanvas = document.createElement("canvas");
screenCanvas.width = 256; screenCanvas.height = 160;
const sctx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.2), new THREE.MeshBasicMaterial({ map: screenTex }));
screen.position.set(-8.5, 14, -8.95);
scene.add(screen);
function drawScreen(t) {
  sctx.fillStyle = "#0b1020"; sctx.fillRect(0, 0, 256, 160);
  sctx.strokeStyle = "rgba(120,140,200,.25)";
  for (let i = 1; i < 6; i++) { sctx.beginPath(); sctx.moveTo(i * 42, 20); sctx.lineTo(i * 42, 150); sctx.stroke(); }
  sctx.fillStyle = "#9fb3ff"; sctx.font = "bold 14px sans-serif"; sctx.fillText("PL spectrum", 10, 16);
  sctx.fillStyle = "#22d3ee"; sctx.fillText("g²(0) < 0.5", 160, 16);
  sctx.beginPath(); sctx.strokeStyle = "#39ff88"; sctx.lineWidth = 2.5;
  const amp = 0.85 + 0.15 * Math.sin(t * 2.2);
  for (let x = 0; x <= 256; x += 2) {
    const u = (x - 150) / 14;
    const y = 148 - (amp * 110 * Math.exp(-u * u) + 18 * Math.exp(-(((x - 70) / 30) ** 2)) + Math.random() * 5);
    x ? sctx.lineTo(x, y) : sctx.moveTo(x, y);
  }
  sctx.stroke();
  screenTex.needsUpdate = true;
}

// ---------- optics ----------
const mirrorMat = new THREE.MeshStandardMaterial({ color: "#dfe7ff", metalness: 0.9, roughness: 0.15 });
function mirror(x, z, rotY, tilt = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.6, 1.6), mirrorMat);
  m.position.set(x, BEAM_Y, z); m.rotation.set(0, rotY, tilt);
  m.castShadow = true; scene.add(m); return m;
}
mirror(M1[0], M1[1], -Math.PI / 4);
const m2 = mirror(M2[0], M2[1], Math.PI / 4);
mirror(M3[0], M3[1], Math.PI / 2, Math.PI / 4);

// silicon wafer with a die grid
const wc = document.createElement("canvas"); wc.width = wc.height = 256;
const wctx = wc.getContext("2d");
const g = wctx.createLinearGradient(0, 0, 256, 256);
g.addColorStop(0, "#5b5f86"); g.addColorStop(0.5, "#9aa0c8"); g.addColorStop(1, "#6f5c96");
wctx.fillStyle = g; wctx.fillRect(0, 0, 256, 256);
wctx.strokeStyle = "rgba(255,255,255,.35)"; wctx.lineWidth = 1;
for (let i = 0; i <= 256; i += 21) { wctx.beginPath(); wctx.moveTo(i, 0); wctx.lineTo(i, 256); wctx.moveTo(0, i); wctx.lineTo(256, i); wctx.stroke(); }
const waferTex = new THREE.CanvasTexture(wc); waferTex.colorSpace = THREE.SRGBColorSpace;
const wafer = new THREE.Mesh(
  new THREE.CylinderGeometry(2.3, 2.3, 0.2, 48),
  [new THREE.MeshStandardMaterial({ color: "#7d82a8", metalness: 0.7, roughness: 0.3 }),
   new THREE.MeshStandardMaterial({ map: waferTex, metalness: 0.6, roughness: 0.25 }),
   new THREE.MeshStandardMaterial({ color: "#7d82a8" })]
);
wafer.position.set(-0.5, tableTop + 1.1, 3.5); wafer.receiveShadow = true; scene.add(wafer);

// laser beams (green) and the spot on the wafer
const beamMat = new THREE.MeshBasicMaterial({ color: "#39ff88", transparent: true, opacity: 0.9 });
function beam(a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, d.length()), beamMat);
  m.position.copy(a).addScaledVector(d, 0.5); m.lookAt(b); scene.add(m);
}
const P = (x, y, z) => new THREE.Vector3(x, y, z);
const path = [P(-5, BEAM_Y, -0.5), P(M1[0], BEAM_Y, M1[1]), P(M2[0], BEAM_Y, M2[1]), P(M3[0], BEAM_Y, M3[1]), P(-0.5, tableTop + 1.25, 3.5)];
for (let i = 0; i < path.length - 1; i++) beam(path[i], path[i + 1]);
const segLens = path.slice(1).map((p, i) => p.distanceTo(path[i]));
const totalLen = segLens.reduce((a, b) => a + b, 0);
function along(s) {
  for (let i = 0; i < segLens.length; i++) {
    if (s <= segLens[i]) return path[i].clone().lerp(path[i + 1], s / segLens[i]);
    s -= segLens[i];
  }
  return path[path.length - 1].clone();
}
const glowTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"); const r = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,.6)"); r.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = r; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
const glow = (color, size) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size); scene.add(s); return s;
};
const spot = glow("#7dffb0", 2.4); spot.position.copy(path[path.length - 1]);
const aperture = glow("#39ff88", 1.6); aperture.position.copy(path[0]);

// light pulses travelling along the beam
const pulses = Array.from({ length: 6 }, (_, i) => ({ s: (i / 6) * totalLen, sprite: glow("#b6ffd2", 0.9) }));
// single photons (magenta voxels) from the chip to the detector
const photonMat = new THREE.MeshBasicMaterial({ color: "#7dd3fc" });
const photons = Array.from({ length: 4 }, (_, i) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), photonMat);
  const halo = glow("#22d3ee", 1.4);
  scene.add(m); return { m, halo, t: i / 4 };
});
const chipOut = P(-1.5, tableTop + 1.4, 3.5), detIn = P(-5.8, tableTop + 1.5, 3.5);

// ---------- Clément ----------
const person = new THREE.Group();
const body = Vox();
const skin = "#efc4a0", coat = "#f4f6fa", pants = "#2b3a55", hair = "#3a2a1f", beard = "#8a6650";
body.fill(1, 0, -9, 3, 1, -6, "#1f2937").fill(4, 0, -9, 6, 1, -6, "#1f2937") // shoes
  .fill(1, 1, -9, 3, 7, -7, pants).fill(4, 1, -9, 6, 7, -7, pants) // legs
  .fill(1, 7, -9, 6, 14, -7, (x, y, z) => (z === -8 && x === 3 ? (y % 2 ? "#cbd2de" : coat) : coat)) // lab coat
  .fill(0, 4, -9, 7, 7, -8, coat) // coat tails
  .fill(3, 13, -8, 4, 14, -7, "#7aa2ff") // shirt collar
  .fill(1, 14, -10, 6, 19, -6, skin) // head
  .fill(1, 19, -10, 6, 20, -6, hair).fill(1, 16, -10, 6, 19, -9, hair) // hair top/back
  .fill(1, 17, -10, 2, 19, -6, hair).fill(5, 17, -10, 6, 19, -6, hair) // sideburns
  .fill(1, 18, -6, 6, 19, -5, hair) // fringe
  .fill(1, 17, -6, 6, 18, -5, (x) => (x === 3 ? "#1f2937" : "#ff8a3d")) // laser goggles
  .fill(1, 14, -6, 6, 16, -5, (x, y) => (x === 3 && y === 15 ? "#b0705c" : beard)) // stubble + smile
  .fill(1, 16, -6, 2, 17, -5, beard).fill(5, 16, -6, 6, 17, -5, beard); // sideburns
// badge
body.add(5, 12, -7, "#1d4ed8");
person.add(body.build(0.03));
function arm(x) {
  const pivot = new THREE.Group(); pivot.position.set(x, 14, -8);
  const a = Vox().fill(0, -6, -1, 1, 0, 1, coat).fill(0, -7, -1, 1, -6, 1, skin);
  pivot.add(a.build(0.02)); person.add(pivot); return pivot;
}
const rightArm = arm(6), leftArm = arm(0);
person.position.set(0, 0, 1);
scene.add(person);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight("#dfe6ff", "#3b3f5c", 1.6));
const sun = new THREE.DirectionalLight("#ffffff", 2.2);
sun.position.set(18, 34, 22); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
scene.add(sun);
const beamLight = new THREE.PointLight("#39ff88", 18, 14, 2); beamLight.position.set(-0.5, tableTop + 3, 3.5); scene.add(beamLight);

// ---------- camera + interaction ----------
const target = new THREE.Vector3(-1, 8.5, -1);
let drag = 0, dragging = false, lastX = 0;
canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener("pointermove", e => { if (dragging) { drag += (e.clientX - lastX) * 0.006; lastX = e.clientX; } });
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.style.cursor = "grab";
canvas.style.touchAction = "pan-y";

function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
}

function frame(t) {
  resize();
  if (window.voxelActive === false) return;
  const ang = 0.55 + Math.sin(t * 0.12) * 0.3 + drag;
  camera.position.set(target.x + Math.sin(ang) * 52, 30, target.z + Math.cos(ang) * 52);
  camera.lookAt(target);

  // Clément tweaks the mirror; idle sway on the other arm and head
  rightArm.rotation.x = -1.15 + Math.sin(t * 1.6) * 0.12;
  rightArm.rotation.z = 0.15;
  leftArm.rotation.x = -0.25 + Math.sin(t * 0.9) * 0.06;
  person.rotation.y = Math.sin(t * 0.5) * 0.04;
  m2.rotation.y = Math.PI / 4 + Math.sin(t * 1.6) * 0.03;

  beamMat.opacity = 0.75 + Math.sin(t * 9) * 0.15;
  spot.scale.setScalar(2.2 + Math.sin(t * 7) * 0.4);
  pulses.forEach(p => { p.s = (p.s + 0.25) % totalLen; p.sprite.position.copy(along(p.s)); });
  photons.forEach(p => {
    p.t = (p.t + 0.006) % 1;
    const pos = chipOut.clone().lerp(detIn, p.t); pos.y += Math.sin(p.t * Math.PI) * 1.2;
    p.m.position.copy(pos); p.m.rotation.set(t * 3, t * 2, 0); p.halo.position.copy(pos);
  });
  drawScreen(t);
  renderer.render(scene, camera);
}

let visible = true, running = false;
function loop(ms) {
  if (!visible) { running = false; return; }
  frame(ms / 1000);
  requestAnimationFrame(loop);
}
function start() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } }
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);

frame(2.0);
stage.classList.add("ready");
start();
