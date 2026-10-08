// Animated voxel scenes for the hero, built with three.js:
//  - "lab": Clément at an optical table, steering a laser onto a silicon photonic
//    chip that emits single photons to a detector.
//  - "clean": Clément in a cleanroom bunny suit holding a silicon wafer.
//  - "talk": Clément presenting his research to a conference audience.
//  - "ai": Clément at his workstation training a neural network on a GPU cluster.
// site.js picks the scene through window.voxelScene.
import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

const stage = document.getElementById("stage");
const canvas = document.getElementById("scene");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
// Orthographic camera + OrbitControls with auto-rotate and a spin-in intro,
// in the style of craftz.dog.
const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 500);
const lab = new THREE.Group(), ai = new THREE.Group(), clean = new THREE.Group(), talk = new THREE.Group(), shared = new THREE.Group();
scene.add(lab, ai, clean, talk, shared);
const GROUPS = { lab, ai, clean, talk };

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

// ---------- room shell (shared by both scenes) ----------
// Walls hide themselves when the camera orbits behind them, so the room stays readable from any angle.
const floor = Vox().fill(-16, -1, -12, 16, 0, 10, (x, y, z) => ((x + z) & 1 ? "#d5dae4" : "#c8ceda"));
const backWall = Vox().fill(-16, 0, -12, 16, 22, -11, (x, y) => (y === 3 ? "#1d4ed8" : y < 3 ? "#b9c3d6" : "#e6ecf5"));
const sideWall = Vox().fill(-17, 0, -12, -16, 22, 10, (x, y, z) =>
  y >= 9 && y <= 16 && z >= -6 && z <= 2 ? (y === 9 || y === 16 || z === -6 || z === 2 ? "#9aa3b5" : "#1e2a5a") // window
  : y === 3 ? "#1d4ed8" : y < 3 ? "#b9c3d6" : "#dfe6f1");
const backWallMesh = backWall.build(0.05), sideWallMesh = sideWall.build(0.05);
shared.add(floor.build(0.05), backWallMesh, sideWallMesh);

// ---------- lab scene ----------
const room = Vox();
// laser-safety sign
room.fill(8, 13, -11, 13, 18, -10, "#facc15").fill(10, 14, -10, 11, 17, -9, "#111827");
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
lab.add(room.build(0.05));

// monitor screen: live photoluminescence spectrum
const screenCanvas = document.createElement("canvas");
screenCanvas.width = 256; screenCanvas.height = 160;
const sctx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.2), new THREE.MeshBasicMaterial({ map: screenTex }));
screen.position.set(-8.5, 14, -8.95);
lab.add(screen);
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
  m.castShadow = true; lab.add(m); return m;
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
wafer.position.set(-0.5, tableTop + 1.1, 3.5); wafer.receiveShadow = true; lab.add(wafer);

// laser beams (green) and the spot on the wafer
const beamMat = new THREE.MeshBasicMaterial({ color: "#39ff88", transparent: true, opacity: 0.9 });
function beam(a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, d.length()), beamMat);
  m.position.copy(a).addScaledVector(d, 0.5); m.lookAt(b); lab.add(m);
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
const glow = (color, size, parent = lab) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  s.scale.setScalar(size); parent.add(s); return s;
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
  lab.add(m); return { m, halo, t: i / 4 };
});
const chipOut = P(-1.5, tableTop + 1.4, 3.5), detIn = P(-5.8, tableTop + 1.5, 3.5);

// ---------- Clément ----------
const person = new THREE.Group();
const body = Vox();
const skin = "#efc4a0", coat = "#f4f6fa", pants = "#2b3a55", hair = "#5a3d26", beard = "#8a6650";
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
lab.add(person);

// ---------- AI scene: workstation + GPU cluster ----------
const office = Vox();
const DESK = 8;
office.fill(-9, DESK - 1, -10, 14, DESK, -3, (x, y, z) => (z === -4 ? "#7a5c3e" : "#9a7b58")); // desk top
for (const [x, z] of [[-9, -10], [13, -10], [-9, -4], [13, -4]]) office.fill(x, 0, z, x + 1, DESK - 1, z + 1, "#4b5563");
office.fill(-2, DESK, -6, 6, DESK + 1, -4, (x, y, z) => ((x + z) & 1 ? "#1f2937" : "#374151")); // keyboard
office.fill(7, DESK, -6, 8, DESK + 1, -5, "#1f2937"); // mouse
office.fill(10, DESK, -6, 11, DESK + 2, -5, "#f4f6fa").add(10, DESK + 2, -6, "#6b4423"); // coffee
// monitor stands
for (const cx of [-6, 2, 10]) office.fill(cx - 1, DESK, -9, cx + 1, DESK + 1, -7, "#4b5563").fill(cx, DESK + 1, -9, cx + 1, DESK + 3, -8, "#4b5563");
// GPU cluster rack against the side wall
office.fill(-15, 0, -11, -11, 18, -4, (x, y, z) => (x === -12 && y > 0 && y < 17 && (y % 2) ? "#111827" : "#1f2937"));
// chair
const chair = Vox()
  .fill(0, 0, 1, 5, 1, 4, "#374151").fill(2, 1, 2, 3, 4, 3, "#6b7280")
  .fill(-1, 4, -1, 6, 5, 5, "#1d4ed8").fill(-1, 5, 4, 6, 12, 5, "#1e3a8a");
const chairGroup = new THREE.Group(); chairGroup.add(chair.build(0.03)); chairGroup.position.set(-0.5, 0, 0); ai.add(chairGroup);
ai.add(office.build(0.04));

// rack LEDs
const ledGeo = new THREE.BoxGeometry(0.15, 0.35, 0.5);
const ledMats = ["#22d3ee", "#22c55e", "#3b82f6", "#0f172a"].map(c => new THREE.MeshBasicMaterial({ color: c }));
const leds = [];
for (let y = 1; y < 17; y += 2) for (let z = -10; z < -4; z++) {
  const m = new THREE.Mesh(ledGeo, ledMats[0]); m.position.set(-10.9, y + 0.5, z + 0.5); ai.add(m); leds.push(m);
}
function labelPlane(text, w, h, color) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 64;
  const x = c.getContext("2d"); x.fillStyle = "#0b1020"; x.fillRect(0, 0, 256, 64);
  x.fillStyle = color; x.font = "bold 30px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 34);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx }));
}
const rackLabel = labelPlane("GPU CLUSTER", 5.5, 1.4, "#22d3ee");
rackLabel.position.set(-10.95, 16.8, -7.5); rackLabel.rotation.y = Math.PI / 2; ai.add(rackLabel);

// three monitors with live canvases
function makeScreen(w = 320, h = 200) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  return { c, x: c.getContext("2d"), tx };
}
const monitors = [-6, 2, 10].map((cx, i) => {
  const g = new THREE.Group();
  const frameV = Vox().fill(-4, 0, 0, 4, 5, 1, "#111827"); g.add(frameV.build(0.02));
  const sc = makeScreen();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 4.5), new THREE.MeshBasicMaterial({ map: sc.tx }));
  plane.position.set(0, 2.5, 1.02); g.add(plane);
  g.position.set(cx + 0.5, DESK + 3, -9);
  g.rotation.y = [0.3, 0, -0.3][i];
  ai.add(g); return sc;
});
const lossHist = [];
function drawAIScreens(t) {
  const epochT = (t % 14) / 14, epoch = Math.floor(epochT * 200) + 1;
  // 1) loss curves
  let { x, c, tx } = monitors[0];
  x.fillStyle = "#0b1020"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#9fb3ff"; x.font = "bold 16px monospace"; x.fillText("training loss", 10, 22);
  x.strokeStyle = "rgba(120,140,200,.25)"; x.beginPath(); x.moveTo(30, 30); x.lineTo(30, 185); x.lineTo(310, 185); x.stroke();
  const curve = (off, col, noise) => {
    x.beginPath(); x.strokeStyle = col; x.lineWidth = 2.5;
    for (let i = 0; i <= epochT * 280; i += 3) {
      const e = i / 280, y = 185 - 150 * (Math.exp(-e * 5) * 0.9 + 0.06 + off) - Math.sin(i * 0.7 + off * 50) * noise;
      i ? x.lineTo(30 + i, y) : x.moveTo(30 + i, y);
    }
    x.stroke();
  };
  curve(0.0, "#22d3ee", 2); curve(0.04, "#f59e0b", 3);
  x.fillStyle = "#22d3ee"; x.font = "13px monospace"; x.fillText("train", 240, 22); x.fillStyle = "#f59e0b"; x.fillText("val", 290, 22);
  tx.needsUpdate = true;
  // 2) network prediction vs measured spectrum
  ({ x, c, tx } = monitors[1]);
  x.fillStyle = "#0b1020"; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = "#9fb3ff"; x.font = "bold 16px monospace"; x.fillText("NN fit vs measured", 10, 22);
  const err = Math.exp(-epochT * 5);
  const spec = (k, shift) => { x.beginPath(); for (let i = 0; i <= 300; i += 3) { const u = (i - 150 - shift) / 22; const y = 175 - 120 * Math.exp(-u * u) - 25 * Math.exp(-(((i - 70) / 30) ** 2)); i ? x.lineTo(10 + i, y) : x.moveTo(10 + i, y); } x.strokeStyle = k; x.lineWidth = 2.5; x.stroke(); };
  spec("#39ff88", 0); spec("rgba(96,165,250,.95)", err * 45 * Math.sin(t * 3));
  x.fillStyle = "#39ff88"; x.font = "13px monospace"; x.fillText("R² " + (1 - err * 0.6).toFixed(3), 220, 22);
  tx.needsUpdate = true;
  // 3) terminal
  ({ x, c, tx } = monitors[2]);
  if (!lossHist.length || lossHist[lossHist.length - 1].epoch !== epoch) {
    const l = (Math.exp(-epochT * 5) * 0.9 + 0.06) * 0.1;
    lossHist.push({ epoch, line: `epoch ${String(epoch).padStart(3)}/200  loss ${l.toFixed(4)}  val ${(l * 1.15).toFixed(4)}` });
    if (lossHist.length > 9) lossHist.shift();
  }
  x.fillStyle = "#050a14"; x.fillRect(0, 0, c.width, c.height);
  x.font = "12px monospace"; x.fillStyle = "#64748b"; x.fillText("$ python train.py --gpus 8", 8, 18);
  lossHist.forEach((h, i) => { x.fillStyle = i === lossHist.length - 1 ? "#e2e8f0" : "#7dd3fc"; x.fillText(h.line, 8, 38 + i * 17); });
  x.fillStyle = "#22c55e"; x.fillText("█".repeat(Math.round(epochT * 24)), 8, 194);
  tx.needsUpdate = true;
}

// holographic neural network floating above the desk
const nn = new THREE.Group(); nn.position.set(2, 23, -5); ai.add(nn);
const layers = [4, 6, 6, 3], nodes = [];
const nodeMat = new THREE.MeshBasicMaterial({ color: "#7dd3fc" });
layers.forEach((n, li) => {
  for (let k = 0; k < n; k++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), nodeMat);
    m.position.set((li - 1.5) * 4, (k - (n - 1) / 2) * 1.6, 0);
    nn.add(m); nodes.push({ m, li });
    glow("#22d3ee", 1.6, nn).position.copy(m.position);
  }
});
const edges = [];
for (const a of nodes) for (const b of nodes) if (b.li === a.li + 1) edges.push([a.m.position, b.m.position]);
const edgeGeo = new THREE.BufferGeometry().setFromPoints(edges.flat());
nn.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending })));
const signals = Array.from({ length: 14 }, () => ({ e: edges[Math.floor(rand() * edges.length)], t: rand(), s: glow("#e0f2fe", 0.9, nn) }));
const aiLight = new THREE.PointLight("#38bdf8", 30, 22, 2); aiLight.position.set(2, 16, -4); ai.add(aiLight);

// Clément, seated, facing the monitors (-z)
const seated = new THREE.Group();
const shirt = "#34433f";
const sb = Vox()
  .fill(0, 0, -4, 2, 1, -1, "#1f2937").fill(3, 0, -4, 5, 1, -1, "#1f2937") // shoes
  .fill(0, 1, -3, 2, 5, -1, pants).fill(3, 1, -3, 5, 5, -1, pants) // shins
  .fill(0, 5, -3, 2, 7, 3, pants).fill(3, 5, -3, 5, 7, 3, pants) // thighs
  .fill(0, 7, 1, 5, 13, 3, shirt) // torso
  .fill(0, 13, 0, 5, 18, 4, skin) // head
  .fill(0, 18, 0, 5, 19, 4, hair).fill(0, 14, 3, 5, 18, 4, hair) // hair top/back
  .fill(0, 16, 0, 1, 18, 3, hair).fill(4, 16, 0, 5, 18, 3, hair) // sides
  .fill(0, 13, -1, 5, 15, 0, (x, y) => (x === 2 && y === 14 ? "#b0705c" : beard)); // stubble
seated.add(sb.build(0.03));
function seatedArm(x) {
  const pivot = new THREE.Group(); pivot.position.set(x + 0.5, 13, 2);
  pivot.add(Vox().fill(0, -5, -1, 1, 0, 0, shirt).fill(0, -6, -1, 1, -5, 0, skin).build(0.02));
  seated.add(pivot); return pivot;
}
const typeL = seatedArm(-1), typeR = seatedArm(5);
typeL.position.x -= 0.5; typeR.position.x -= 0.5;
seated.position.set(-0.5, 0, 0);
ai.add(seated);

// ---------- cleanroom scene: bunny suit, wafer, lithography tool ----------
const suit = "#f1f5f9", suitShade = "#dbe3ee";
const fab = Vox();
// yellow-light panels (lithography bay) on the back wall
for (const x0 of [-12, -2, 8]) fab.fill(x0, 18, -11, x0 + 6, 20, -10, "#fde047");
// wet bench with sink and fume hood
fab.fill(-14, 0, -10, -4, 7, -5, (x, y) => (y === 6 ? "#cbd5e1" : "#e2e8f0"))
  .fill(-12, 7, -9, -9, 8, -6, "#94a3b8") // sink rim
  .fill(-14, 7, -10, -13, 16, -5, "#cbd5e1").fill(-5, 7, -10, -4, 16, -5, "#cbd5e1").fill(-14, 15, -10, -4, 16, -5, "#cbd5e1")
  .fill(-8, 7, -8, -6, 8, -6, "#334155"); // spin coater base
// lithography tool (e-beam style column on a cabinet)
fab.fill(4, 0, -10, 14, 10, -3, (x, y, z) => (z === -4 && y >= 4 && y <= 7 && x >= 6 && x <= 11 ? "#0f172a" : y === 9 ? "#cbd5e1" : "#e5e7eb"))
  .fill(7, 10, -8, 11, 18, -5, (x, y) => (y % 3 === 0 ? "#94a3b8" : "#cbd5e1"))
  .fill(6, 18, -9, 12, 19, -4, "#64748b")
  .add(5, 8, -3, "#22c55e").add(5, 7, -3, "#22d3ee").add(5, 6, -3, "#facc15");
// wafer carrier on a small cart
fab.fill(-14, 0, 2, -9, 5, 6, (x, y) => (y === 4 ? "#94a3b8" : y === 0 ? "#64748b" : "#cbd5e1"))
  .fill(-13, 5, 3, -10, 7, 5, "#93c5fd");
clean.add(fab.build(0.03));
const waferMats = (metal) => [new THREE.MeshStandardMaterial({ color: "#7d82a8" }), new THREE.MeshStandardMaterial({ map: waferTex, metalness: metal, roughness: 0.2 }), new THREE.MeshStandardMaterial({ color: "#7d82a8" })];
// spinning wafer on the spin coater
const spinWafer = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.15, 40), waferMats(0.6));
spinWafer.position.set(-6.9, 8.2, -6.9); clean.add(spinWafer);
// Clément in a bunny suit, holding a wafer
const bunny = new THREE.Group();
bunny.add(Vox()
  .fill(1, 0, -9, 3, 1, -6, "#e2e8f0").fill(4, 0, -9, 6, 1, -6, "#e2e8f0") // booties
  .fill(1, 1, -9, 3, 7, -7, suitShade).fill(4, 1, -9, 6, 7, -7, suitShade) // legs
  .fill(1, 7, -9, 6, 14, -7, (x, y, z) => (x === 3 && z === -8 ? "#cbd5e1" : suit)) // body + zip
  .fill(1, 14, -10, 6, 20, -6, suit) // hood
  .fill(1, 16, -6, 6, 18, -5, (x, y) => (y === 17 ? "#7dd3fc" : skin)) // eyes behind the visor
  .fill(1, 14, -6, 6, 16, -5, "#e2e8f0") // face mask
  .fill(2, 20, -9, 5, 21, -7, suitShade)
  .build(0.02));
function suitArm(x) {
  const pivot = new THREE.Group(); pivot.position.set(x, 14, -8);
  pivot.add(Vox().fill(0, -6, -1, 1, 0, 1, suit).fill(0, -7, -1, 1, -6, 1, "#a78bfa").build(0.02)); // nitrile gloves
  bunny.add(pivot); return pivot;
}
const holdR = suitArm(6), holdL = suitArm(0);
bunny.position.set(-1, 0, 2);
clean.add(bunny);
const heldWafer = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.15, 48), waferMats(0.8));
heldWafer.position.set(2, 10.6, 0.6); clean.add(heldWafer);
const waferGlint = glow("#e0e7ff", 2.4, clean);
// laminar air flow: particles drifting down from the ceiling filters
const dustN = 160, dustPos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) { dustPos[i * 3] = rand() * 30 - 15; dustPos[i * 3 + 1] = rand() * 22; dustPos[i * 3 + 2] = rand() * 20 - 11; }
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
clean.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: "#fef9c3", size: 0.2, transparent: true, opacity: 0.8 })));
const yellow = new THREE.PointLight("#fde047", 60, 40, 1.6); yellow.position.set(0, 20, -4); clean.add(yellow);

// ---------- conference scene: a talk in front of an audience ----------
const hall = Vox();
hall.fill(-16, -1, -12, 16, 0, 10, (x, y, z) => (((x * 3 + z) % 7 + 7) % 7 === 0 ? "#1e3a8a" : "#1e293b")); // carpet
hall.fill(-14, 0, -11, 14, 3, -3, (x, y) => (y === 2 ? "#6b4f35" : "#3f2e20")); // stage
hall.fill(10, 3, -7, 13, 10, -5, (x, y, z) => (z === -6 && y === 7 ? "#2563eb" : "#7a5a3c")) // podium
  .fill(10, 10, -7, 13, 11, -6, "#5b4330").add(11, 11, -7, "#111827");
const hallBackMesh = Vox().fill(-16, 0, -12, 16, 22, -11, (x, y) => (y < 2 ? "#0f172a" : "#172554")).build(0.04);
const hallSideMesh = Vox().fill(-17, 0, -12, -16, 22, 10, (x, y, z) => (((z % 6) + 6) % 6 === 0 && y > 2 && y < 18 ? "#1d4ed8" : "#172554")).build(0.04);
talk.add(hall.build(0.04), hallBackMesh, hallSideMesh);
// projected slides
const slide = makeScreen(480, 270);
const slideMesh = new THREE.Mesh(new THREE.PlaneGeometry(20, 11.25), new THREE.MeshBasicMaterial({ map: slide.tx }));
slideMesh.position.set(-4, 13, -10.9); talk.add(slideMesh);
function drawSlide(t) {
  const { x, c, tx } = slide, k = Math.floor(t / 5) % 3, W = c.width, H = c.height;
  x.fillStyle = "#f8fafc"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#1d4ed8"; x.fillRect(0, 0, W, 8);
  x.fillStyle = "#0b1a33"; x.font = "bold 24px sans-serif";
  x.fillText(["Single photons on a chip", "Photon antibunching", "Integrated LPG sensors"][k], 20, 46);
  x.strokeStyle = "#0ea5e9"; x.lineWidth = 3;
  x.font = "15px sans-serif";
  if (k === 0) {
    x.beginPath(); x.moveTo(40, 175); x.lineTo(440, 175); x.stroke();
    x.beginPath(); x.arc(300, 128, 40, 0, 7); x.stroke();
    x.fillStyle = "#ec4899"; x.beginPath(); x.arc(130, 175, 7 + Math.sin(t * 6) * 2, 0, 7); x.fill();
    x.fillStyle = "#0b1a33"; x.fillText("CNT emitter → cavity → waveguide circuit", 40, 235);
  } else if (k === 1) {
    x.beginPath();
    for (let i = 0; i <= 400; i += 4) { const u = (i - 200) / 24, y = 210 - 130 * (1 - 0.8 * Math.exp(-Math.abs(u))); i ? x.lineTo(40 + i, y) : x.moveTo(40 + i, y); }
    x.stroke(); x.fillStyle = "#0b1a33"; x.fillText("g²(τ)", 40, 75); x.fillText("τ", 445, 225);
  } else {
    for (const [sh, col] of [[0, "#0ea5e9"], [40 + Math.sin(t) * 10, "#f59e0b"]]) {
      x.strokeStyle = col; x.beginPath();
      for (let i = 0; i <= 400; i += 4) { const u = (i - 160 - sh) / 26, y = 90 + 110 * Math.exp(-u * u); i ? x.lineTo(40 + i, y) : x.moveTo(40 + i, y); }
      x.stroke();
    }
    x.fillStyle = "#0b1a33"; x.fillText("resonance shift with refractive index", 40, 240);
  }
  x.fillStyle = "#94a3b8"; x.font = "12px sans-serif"; x.fillText("C. Deleau · RIKEN", W - 120, H - 12);
  tx.needsUpdate = true;
}
// speaker: Clément on stage, facing the audience, pointing at the slide with a laser pointer
const speaker = new THREE.Group();
speaker.add(Vox()
  .fill(1, 0, -9, 3, 1, -6, "#1f2937").fill(4, 0, -9, 6, 1, -6, "#1f2937")
  .fill(1, 1, -9, 3, 7, -7, "#1e293b").fill(4, 1, -9, 6, 7, -7, "#1e293b")
  .fill(1, 7, -9, 6, 14, -7, (x, y, z) => (x === 3 && y >= 11 && z === -8 ? "#e2e8f0" : "#1d4ed8")) // blazer, open collar
  .fill(1, 14, -10, 6, 19, -6, skin)
  .fill(1, 19, -10, 6, 20, -6, hair).fill(1, 16, -10, 6, 19, -9, hair).fill(1, 17, -10, 2, 19, -6, hair).fill(5, 17, -10, 6, 19, -6, hair)
  .fill(1, 18, -6, 6, 19, -5, hair)
  .fill(1, 17, -6, 6, 18, -5, (x) => (x === 2 || x === 4 ? "#1e3a8a" : skin)) // eyes
  .fill(1, 14, -6, 6, 16, -5, (x, y) => (x === 3 && y === 15 ? "#b0705c" : beard)).fill(1, 16, -6, 2, 17, -5, beard).fill(5, 16, -6, 6, 17, -5, beard)
  .build(0.03));
function speakerArm(x) {
  const pivot = new THREE.Group(); pivot.position.set(x + 0.5, 14, -8);
  pivot.add(Vox().fill(-0.5, -6, -1, 0.5, 0, 1, "#1d4ed8").fill(-0.5, -7, -1, 0.5, -6, 1, skin).build(0.02));
  speaker.add(pivot); return pivot;
}
const pointArm = speakerArm(0), restArm = speakerArm(6);
speaker.position.set(2, 3, 2);
talk.add(speaker);
const laserDot = glow("#ff3b3b", 1.6, talk);
const laserBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1), new THREE.MeshBasicMaterial({ color: "#ff3b3b", transparent: true, opacity: 0.75 }));
talk.add(laserBeam);
// audience, seated facing the stage
const audience = [];
const shirts = ["#ef4444", "#f59e0b", "#10b981", "#6366f1", "#e2e8f0", "#0ea5e9", "#a855f7", "#64748b"];
const hairs = ["#1f2937", "#5a3d26", "#a16207", "#111827", "#9ca3af"];
let seatN = 0;
for (const [row, z] of [[0, 0], [1, 3], [2, 6]]) {
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(Vox().fill(0, 0, 0, 3, 3, 3, "#334155").fill(0, 3, 2, 3, 6, 3, "#334155").build(0.03)); // chair
    body.add(Vox()
      .fill(0, 3, 0, 3, 6, 2, shirts[(seatN * 3 + row) % shirts.length])
      .fill(0, 6, 0, 3, 9, 3, (x, y, zz) => (y === 8 || zz === 2 ? hairs[seatN % hairs.length] : skin)).build(0.03));
    g.add(body);
    g.position.set(-13 + i * 5 + (row % 2) * 2, 0, z);
    talk.add(g); audience.push({ body, ph: rand() * 6 });
    seatN++;
  }
}
const stageLight = new THREE.SpotLight("#fff7ed", 400, 70, 0.5, 0.5, 1.4);
stageLight.position.set(8, 32, 14); stageLight.target.position.set(2, 10, -4);
talk.add(stageLight, stageLight.target);
const handPos = new THREE.Vector3(), dotPos = new THREE.Vector3();

// ---------- lights ----------
scene.add(new THREE.HemisphereLight("#dfe6ff", "#3b3f5c", 1.6));
const sun = new THREE.DirectionalLight("#ffffff", 2.2);
sun.position.set(18, 34, 22); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
scene.add(sun);
const beamLight = new THREE.PointLight("#39ff88", 18, 14, 2); beamLight.position.set(-0.5, tableTop + 3, 3.5); lab.add(beamLight);

// ---------- camera + interaction ----------
const VIEWS = {
  lab: { target: new THREE.Vector3(-1, 7, -1), pos: new THREE.Vector3(32, 30, 44), size: 25 },
  ai: { target: new THREE.Vector3(1, 11, -3), pos: new THREE.Vector3(38, 30, 40), size: 27 },
  clean: { target: new THREE.Vector3(0, 9, -3), pos: new THREE.Vector3(30, 28, 46), size: 24 },
  talk: { target: new THREE.Vector3(0, 9, -2), pos: new THREE.Vector3(26, 32, 48), size: 23 },
};
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.enableZoom = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.6;
controls.minPolarAngle = 0.35;
controls.maxPolarAngle = 1.3;
canvas.style.cursor = "grab";
canvas.addEventListener("pointerdown", () => { canvas.style.cursor = "grabbing"; });
addEventListener("pointerup", () => { canvas.style.cursor = "grab"; });

let viewSize = 19;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  const pr = renderer.getPixelRatio();
  if (canvas.width !== Math.floor(w * pr) || canvas.height !== Math.floor(h * pr)) renderer.setSize(w, h, false);
  const hh = viewSize * 0.75, hw = hh * (w / h);
  if (camera.right !== hw || camera.top !== hh) {
    camera.left = -hw; camera.right = hw; camera.top = hh; camera.bottom = -hh;
    camera.updateProjectionMatrix();
  }
}

// craftz.dog-style intro: the camera swirls in and settles, then OrbitControls take over
// After that, scene changes only glide the orbit target and zoom.
let intro = 0, introFrom = null, wantSize = 25;
const wantTarget = new THREE.Vector3();
const easeOutCirc = x => Math.sqrt(1 - Math.pow(x - 1, 4));
function enterView(name, first) {
  const v = VIEWS[name];
  wantSize = v.size; wantTarget.copy(v.target);
  if (!first) return;
  viewSize = v.size;
  controls.target.copy(v.target);
  introFrom = v.pos.clone().sub(v.target);
  intro = 1;
  resize();
}

// ---------- cascade transitions ----------
// Outgoing voxels fly up and away (top layers first); incoming voxels rain down
// from above and stack up from the floor.
const DROP = 45;
const easeInCubic = x => x * x * x, easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const cascadeData = new Map();
function cascadeOf(group) {
  if (cascadeData.has(group)) return cascadeData.get(group);
  const items = [], loose = [], m = new THREE.Matrix4();
  group.traverse(o => {
    if (o.isInstancedMesh) {
      const n = o.count, base = new Float32Array(n * 3), jit = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        o.getMatrixAt(i, m);
        base[i * 3] = m.elements[12]; base[i * 3 + 1] = m.elements[13]; base[i * 3 + 2] = m.elements[14];
        jit[i] = rand();
      }
      o.frustumCulled = false;
      items.push({ mesh: o, base, jit });
    } else if (o.isMesh || o.isSprite || o.isPoints || o.isLine) loose.push(o);
  });
  const data = { items, loose };
  cascadeData.set(group, data);
  return data;
}
function cascade(group, mode, P) {
  const { items } = cascadeOf(group), m = new THREE.Matrix4();
  for (const { mesh, base, jit } of items) {
    for (let i = 0; i < mesh.count; i++) {
      const y = base[i * 3 + 1], h = Math.min(Math.max((y + 1) / 24, 0), 1);
      const delay = (mode === "in" ? h : 1 - h) * 0.55 + jit[i] * 0.15;
      const p = Math.min(Math.max((P - delay) / 0.3, 0), 1);
      const off = mode === "in" ? (1 - easeOutCubic(p)) * DROP : easeInCubic(p) * DROP;
      m.makeTranslation(base[i * 3], y + off, base[i * 3 + 2]);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
const setLoose = (groups, on) => groups.forEach(g => cascadeOf(g).loose.forEach(o => { o.visible = on; }));
const setsFor = name => (name === "talk" ? [talk] : [GROUPS[name], shared]);
let cur = null, trans = null, lastT = null;
function startTransition(next) {
  if (cur === null) {
    for (const k in GROUPS) GROUPS[k].visible = false;
    shared.visible = false;
    const groups = setsFor(next);
    groups.forEach(g => { g.visible = true; cascade(g, "in", 0); });
    setLoose(groups, false);
    cur = next; enterView(next, true);
    trans = { phase: "in", groups, P: 0 };
    return;
  }
  const keep = setsFor(next);
  const groups = setsFor(cur).filter(g => !keep.includes(g));
  setLoose(groups, false);
  trans = { phase: "out", next, groups, P: 0 };
  enterView(next, false);
}
function advance(dt) {
  trans.P = Math.min(trans.P + dt / (trans.phase === "out" ? 0.9 : 1.3), 1);
  trans.groups.forEach(g => cascade(g, trans.phase, trans.P));
  if (trans.P < 1) return;
  if (trans.phase === "out") {
    trans.groups.forEach(g => { g.visible = false; });
    const prev = setsFor(cur);
    cur = trans.next;
    const groups = setsFor(cur).filter(g => !prev.includes(g) || !g.visible);
    groups.forEach(g => { g.visible = true; cascade(g, "in", 0); });
    setLoose(groups, false);
    trans = { phase: "in", groups, P: 0 };
    return;
  }
  setLoose(setsFor(cur), true);
  trans = null;
}

function frame(t) {
  const dt = lastT === null ? 0 : Math.min(Math.max(t - lastT, 0), 0.1);
  lastT = t;
  resize();
  if (window.voxelActive === false) return;
  const want = GROUPS[window.voxelScene] ? window.voxelScene : "lab";
  if (!trans && want !== cur) startTransition(want);
  if (trans) advance(dt);
  const which = cur;
  controls.target.lerp(wantTarget, 0.05);
  viewSize += (wantSize - viewSize) * 0.05;
  if (intro > 0 && intro <= 110) {
    const k = easeOutCirc(intro / 110), rot = -(1 - k) * Math.PI * 3;
    const p = introFrom;
    camera.position.set(
      controls.target.x + p.x * Math.cos(rot) + p.z * Math.sin(rot),
      controls.target.y + p.y * (2.2 - 1.2 * k),
      controls.target.z + p.z * Math.cos(rot) - p.x * Math.sin(rot));
    camera.lookAt(controls.target);
    intro++;
  } else {
    controls.update();
  }
  backWallMesh.visible = hallBackMesh.visible = camera.position.z > -11;
  sideWallMesh.visible = hallSideMesh.visible = camera.position.x > -16;
  if (which === "clean") {
    spinWafer.rotation.y = t * 12;
    holdR.rotation.x = holdL.rotation.x = -1.0 + Math.sin(t * 0.8) * 0.05;
    heldWafer.rotation.set(0.35 + Math.sin(t * 0.8) * 0.15, t * 0.2, Math.sin(t * 0.5) * 0.1);
    heldWafer.position.y = 10.6 + Math.sin(t * 0.8) * 0.3;
    waferGlint.position.set(2 + Math.sin(t * 1.3) * 1.5, heldWafer.position.y + 0.4, 0.6 + Math.cos(t * 1.3) * 1.2);
    waferGlint.material.opacity = 0.5 + 0.5 * Math.sin(t * 2.6);
    bunny.rotation.y = Math.sin(t * 0.4) * 0.05;
    for (let i = 0; i < dustN; i++) { dustPos[i * 3 + 1] -= 0.04; if (dustPos[i * 3 + 1] < 0) dustPos[i * 3 + 1] = 22; }
    dustGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    return;
  }
  if (which === "talk") {
    pointArm.rotation.set(0.35, 0, -2.1 + Math.sin(t * 0.9) * 0.12);
    restArm.rotation.set(-0.5 + Math.sin(t * 1.7) * 0.25, 0, 0.1);
    speaker.rotation.y = Math.sin(t * 0.6) * 0.15;
    pointArm.updateWorldMatrix(true, false);
    handPos.set(0, -7, 0); pointArm.localToWorld(handPos);
    dotPos.set(-4 + Math.sin(t * 0.7) * 6, 13 + Math.sin(t * 1.1) * 3, -10.8);
    laserDot.position.copy(dotPos);
    laserBeam.position.lerpVectors(handPos, dotPos, 0.5);
    laserBeam.scale.z = handPos.distanceTo(dotPos);
    laserBeam.lookAt(dotPos);
    audience.forEach(a => { a.body.position.y = Math.max(0, Math.sin(t * 1.5 + a.ph)) * 0.25; a.body.rotation.y = Math.sin(t * 0.5 + a.ph) * 0.12; });
    drawSlide(t);
    renderer.render(scene, camera);
    return;
  }
  if (which === "ai") {
    typeL.rotation.x = 1.05 + Math.sin(t * 14) * 0.06;
    typeR.rotation.x = 1.05 + Math.sin(t * 14 + 1.7) * 0.06;
    seated.rotation.y = Math.sin(t * 0.4) * 0.05;
    nn.rotation.y = Math.sin(t * 0.3) * 0.5;
    nn.position.y = 23 + Math.sin(t * 1.2) * 0.4;
    signals.forEach(sg => {
      sg.t += 0.02;
      if (sg.t > 1) { sg.t = 0; sg.e = edges[Math.floor(rand() * edges.length)]; }
      sg.s.position.lerpVectors(sg.e[0], sg.e[1], sg.t);
    });
    if (Math.floor(t * 8) !== frame.ledTick) {
      frame.ledTick = Math.floor(t * 8);
      leds.forEach(l => { if (rand() < 0.3) l.material = ledMats[Math.floor(rand() * ledMats.length)]; });
    }
    drawAIScreens(t);
    renderer.render(scene, camera);
    return;
  }

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
function start() { if (!running) { running = true; requestAnimationFrame(loop); } }
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);

frame(2.0);
stage.classList.add("ready");
start();
