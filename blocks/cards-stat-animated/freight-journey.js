/* eslint-disable max-len -- part tables mirror the source renderer one part per line */
/*
 * Freight journey: isometric teal truck -> container ship -> cargo plane (three.js).
 * Procedural port of the source freightJourneyRenderer: same part list, colours,
 * camera (orthographic, iso direction, 4.1 units tall) and clock
 * (accelerate 160ms, cruise 1280ms, exit 480ms, enter 480ms per vehicle).
 * At rest it shows the truck still; while active the truck drives off,
 * then the ship and the plane cruise in and out, looping.
 */
import {
  THREE, COLORS, createRenderer, createStage, roundedBoxFactory, seededRandom,
  cubicBezier, rafLoop, disposeScene,
} from './scene-utils.js';

const VEHICLES = ['truck', 'ship', 'plane'];
const HALF_SPAN = 3.5;
const DURATION = 320; /* --m-duration-slow */
const TIMING = {
  accelerate: DURATION / 2, cruise: DURATION * 4, exit: DURATION * 1.5, enter: DURATION * 1.5,
};
const easeEnter = cubicBezier([0, 0, 0, 1]);
const easeExit = cubicBezier([0.3, 0, 1, 1]);
const REST = { clock: 0, speed: 0 };

function std(cache, color, roughness = 0.65, metalness = 0) {
  const key = `${color}:${roughness}:${metalness}`;
  if (!cache.has(key)) {
    cache.set(key, new THREE.MeshStandardMaterial({
      color: new THREE.Color(color), roughness, metalness,
    }));
  }
  return cache.get(key);
}

function buildTruck(mats, roundBox) {
  const group = new THREE.Group();
  const wheels = [];
  const add = (geometry, material, pos, rot) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const box = (size, pos, mat, r = 0.015) => add(roundBox(size, r), mat, pos);
  const rod = (from, to, radius, mat) => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const mesh = add(
      new THREE.CylinderGeometry(radius, radius, dir.length(), 8),
      mat,
      a.clone().add(b).multiplyScalar(0.5).toArray(),
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return mesh;
  };

  const S = std(mats, COLORS.tealStrong, 0.4, 0.18);
  const C = std(mats, COLORS.tealLight, 0.46, 0.12);
  const E = std(mats, COLORS.chalkLight, 0.48, 0.1);
  const O = std(mats, COLORS.charcoalShade, 0.97);
  const k = std(mats, COLORS.charcoalStrong, 0.62);
  const j = std(mats, COLORS.chalkShade, 0.3, 0.65);
  const M = S;
  const N = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(COLORS.blueLight),
    roughness: 0.16,
    metalness: 0.08,
    transparent: true,
    opacity: 0.58,
    transmission: 0.12,
    thickness: 0.025,
  });
  const P = std(mats, COLORS.goldLight, 0.3);
  const F = std(mats, COLORS.redStrong, 0.4);

  box([2.65, 1.62, 1.29], [-0.62, 1.35, 0], S, 0.045);
  box([2.68, 0.055, 1.32], [-0.62, 2.18, 0], E);
  box([3.9, 0.16, 1.12], [0, 0.48, 0], k);
  box([2.7, 0.08, 1.34], [-0.62, 0.55, 0], j);
  box([1.03, 0.83, 1.28], [1.23, 0.935, 0], M, 0.055);
  box([0.08, 0.7, 1.28], [0.75, 1.65, 0], M, 0.025);
  box([1.03, 0.08, 1.31], [1.23, 2.03, 0], S, 0.03);
  box([0.16, 0.17, 1.13], [1.58, 1.36, 0], k, 0.02);
  [-1, 1].forEach((e) => {
    box([0.09, 0.68, 0.085], [1.71, 1.64, e * 0.6], M, 0.018);
    box([0.12, 0.6, 0.085], [0.83, 1.65, e * 0.6], M, 0.018);
    box([0.26, 0.3, 0.29], [1.01, 1.45, e * 0.3], k, 0.04);
    box([0.36, 0.09, 0.3], [1.1, 1.3, e * 0.3], k, 0.025);
  });
  add(new THREE.TorusGeometry(0.115, 0.014, 6, 24), k, [1.46, 1.49, 0.3], [0, Math.PI / 2 - 0.35, 0]);
  rod([1.49, 1.43, 0.3], [1.38, 1.28, 0.3], 0.018, k);
  box([0.31, 0.54, 1.26], [1.78, 0.91, 0], M, 0.045);
  box([0.12, 0.2, 1.4], [1.97, 0.53, 0], k, 0.025);
  box([0.035, 0.105, 0.34], [2.035, 0.55, 0], E);
  box([0.025, 0.056, 0.2], [2.06, 0.55, 0], k);

  const rivet = new THREE.SphereGeometry(0.009, 6, 4);
  const tyre = new THREE.CylinderGeometry(0.29, 0.29, 0.17, 32);
  const tyreSide = new THREE.TorusGeometry(0.23, 0.064, 8, 32);
  const rim = new THREE.CylinderGeometry(0.16, 0.16, 0.022, 24);
  const hub = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16);
  const lug = new THREE.CylinderGeometry(0.015, 0.015, 0.027, 6);
  const arch = new THREE.TorusGeometry(0.335, 0.026, 6, 32, Math.PI);

  [-1, 1].forEach((e) => {
    const t = e * 0.655;
    box([2.49, 1.34, 0.012], [-0.64, 1.34, t], C, 0.006);
    box([2.54, 0.028, 0.024], [-0.64, 0.75, t + e * 0.012], P);
    [0.64, 2.08].forEach((n) => {
      box([2.59, 0.024, 0.024], [-0.63, n, t + e * 0.01], j);
      for (let r = 0; r < 15; r += 1) add(rivet, j, [-1.85 + r * 0.174, n, t + e * 0.025]);
    });
    [-1.91, 0.66].forEach((n) => box([0.025, 1.47, 0.022], [n, 1.35, t + e * 0.01], j));
    [1.423, 1.86].forEach((y) => box([0.64, 0.035, 0.026], [1.15, y, t], k));
    [0.83, 1.47].forEach((x) => box([0.035, 0.46, 0.026], [x, 1.64, t], k));
    box([0.54, 0.37, 0.024], [1.15, 1.65, t + e * 0.015], N, 0.018);
    box([0.018, 0.83, 0.016], [0.81, 1.1, t], k);
    box([0.71, 0.018, 0.016], [1.17, 0.77, t], k);
    box([0.1, 0.022, 0.025], [0.93, 1.26, t + e * 0.024], j);
    box([0.46, 0.055, 0.19], [1.04, 0.55, e * 0.7], j);
    box([0.36, 0.05, 0.14], [1.03, 0.67, e * 0.66], k);
    for (let i = 0; i < 9; i += 1) box([0.025, 0.008, 0.13], [0.88 + i * 0.035, 0.583, e * 0.7], k, 0.002);
    rod([1.57, 1.69, t], [1.64, 1.69, e * 0.89], 0.015, k);
    rod([1.64, 1.69, e * 0.89], [1.64, 1.36, e * 0.89], 0.015, k);
    box([0.11, 0.27, 0.064], [1.65, 1.56, e * 0.89], k, 0.02);
    box([0.016, 0.22, 0.049], [1.71, 1.56, e * 0.89], j, 0.01);
    box([0.033, 0.16, 0.17], [1.95, 0.89, e * 0.46], k);
    box([0.038, 0.11, 0.12], [1.974, 0.9, e * 0.46], E);
    box([0.036, 0.065, 0.12], [1.96, 1.05, e * 0.47], P);
    box([0.026, 0.14, 0.11], [-1.99, 0.67, e * 0.5], F);

    [-1.3, 1.35].forEach((x) => {
      const first = group.children.length;
      add(tyre, O, [x, 0.32, e * 0.62], [Math.PI / 2, 0, 0]);
      add(tyreSide, O, [x, 0.32, e * 0.718]);
      add(rim, j, [x, 0.32, e * 0.752], [Math.PI / 2, 0, 0]);
      add(hub, k, [x, 0.32, e * 0.774], [Math.PI / 2, 0, 0]);
      for (let n = 0; n < 8; n += 1) {
        const a = (n * Math.PI) / 4;
        add(lug, j, [x + Math.cos(a) * 0.111, 0.32 + Math.sin(a) * 0.111, e * 0.78], [Math.PI / 2, 0, 0]);
      }
      for (let n = 0; n < 32; n += 1) {
        const a = (n * Math.PI) / 16;
        const tread = box([0.035, 0.014, 0.155], [x + Math.cos(a) * 0.29, 0.32 + Math.sin(a) * 0.29, e * 0.62], k, 0.003);
        tread.rotation.z = a - Math.PI / 2;
      }
      const wheel = new THREE.Group();
      wheel.position.set(x, 0.32, e * 0.62);
      group.add(wheel);
      group.children.slice(first, -1).forEach((child) => wheel.attach(child));
      wheels.push(wheel);
      const guard = new THREE.Mesh(arch, S);
      guard.position.set(x, 0.33, e * 0.72);
      guard.castShadow = true;
      group.add(guard);
    });
  });

  [-1, 1].forEach((e) => {
    [1.345, 1.875].forEach((y) => box([0.026, 0.033, 0.53], [1.76, y, e * 0.296], k));
    [e * 0.031, e * 0.561].forEach((z) => box([0.026, 0.53, 0.033], [1.76, 1.61, z], k));
    box([0.029, 0.46, 0.46], [1.78, 1.63, e * 0.296], N, 0.012);
    rod([1.804, 1.39, e * 0.48], [1.809, 1.54, e * 0.2], 0.009, k);
  });
  for (let e = 0; e < 7; e += 1) box([0.028, 0.021, 0.57], [1.955, 0.72 + e * 0.045, 0], k, 0.004);
  for (let e = 0; e < 5; e += 1) box([0.055, 0.035, 0.065], [0.94 + e * 0.15, 2.082, 0.59], P, 0.006);
  [-1, 1].forEach((e) => {
    box([0.025, 1.32, 0.59], [-1.97, 1.34, e * 0.31], C);
    rod([-1.994, 0.76, e * 0.26], [-1.994, 1.94, e * 0.26], 0.012, j);
    [0.8, 1.34, 1.88].forEach((y) => box([0.045, 0.05, 0.12], [-2, y, e * 0.58], j));
  });
  return { group, wheels };
}

function meshKit(mats, parent) {
  const mesh = (geometry, material, pos, into = parent, shadow = true) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(...pos);
    m.castShadow = shadow;
    m.receiveShadow = shadow;
    into.add(m);
    return m;
  };
  return {
    mesh,
    box: (size, pos, material, into) => mesh(new THREE.BoxGeometry(...size), material, pos, into),
    mat: (color, roughness, metalness) => std(mats, color, roughness, metalness),
  };
}

function buildShip(mats, strips, scenery) {
  const group = new THREE.Group();
  const { mesh, box, mat } = meshKit(mats, group);
  const hull = new THREE.Shape();
  hull.moveTo(-2.2, -0.6);
  hull.lineTo(1.4, -0.6);
  hull.quadraticCurveTo(2, -0.45, 2.25, 0);
  hull.quadraticCurveTo(2, 0.45, 1.4, 0.6);
  hull.lineTo(-2.2, 0.6);
  hull.lineTo(-2.2, -0.6);
  const keel = new THREE.ExtrudeGeometry(hull, { depth: 0.24, bevelEnabled: false, curveSegments: 10 });
  keel.rotateX(-Math.PI / 2);
  mesh(keel, mat(COLORS.redStrong), [0, 0, 0]);
  const side = new THREE.ExtrudeGeometry(hull, { depth: 0.46, bevelEnabled: false, curveSegments: 10 });
  side.rotateX(-Math.PI / 2);
  mesh(side, mat(COLORS.blueShade), [0, 0.24, 0]);
  box([3.9, 0.03, 1.12], [-0.15, 0.715, 0], mat(COLORS.charcoalLight));

  const tones = [COLORS.tealStrong, COLORS.goldStrong, COLORS.coralStrong,
    COLORS.blueStrong, COLORS.tealLight, COLORS.redStrong];
  const rand = seededRandom(17);
  let n = 0;
  for (let x = -1.25; x <= 1.3; x += 0.52) {
    const bow = x > 1;
    const lanes = [-0.38, 0, 0.38];
    for (let l = 0; l < lanes.length; l += 1) {
      const z = lanes[l];
      if (!bow || Math.abs(z) <= 0.3) {
        const stack = bow ? 1 : 2 + Math.floor(rand() * 2);
        for (let s = 0; s < stack; s += 1) {
          box([0.5, 0.25, 0.36], [x, 0.86 + s * 0.27, z], mat(tones[n % tones.length]));
          n += 1;
        }
      }
    }
  }
  box([0.5, 0.95, 1], [-1.75, 1.2, 0], mat(COLORS.chalkLight));
  box([0.52, 0.12, 1.02], [-1.75, 1.5, 0], mat(COLORS.charcoalStrong));
  box([0.3, 0.06, 1.3], [-1.6, 1.62, 0], mat(COLORS.chalkShade));
  box([0.24, 0.42, 0.3], [-2, 1.85, 0], mat(COLORS.charcoalStrong));
  box([0.26, 0.08, 0.32], [-2, 1.95, 0], mat(COLORS.goldStrong));

  const water = mat(COLORS.blueLight);
  const wake = mat(COLORS.blueTint);
  const stripGeo = new THREE.BoxGeometry(0.42, 0.012, 0.035);
  const wakeGeo = new THREE.BoxGeometry(0.3, 0.012, 0.04);
  [-1.3, -0.95, 0.95, 1.3, 1.65].forEach((z) => {
    for (let r = 0; r < 7; r += 1) {
      strips.push(mesh(stripGeo, water, [-HALF_SPAN + r * ((2 * HALF_SPAN) / 7) + z * 0.6, 0.02, z], scenery, false));
    }
  });
  [-1, 1].forEach((e) => {
    for (let t = 0; t < 4; t += 1) {
      const r = 0.35 + t * 0.4;
      const w = mesh(wakeGeo, wake, [-2.3 - r, 0.022, e * (0.55 + r * 0.35)], scenery, false);
      w.rotation.y = -e * 0.34;
    }
  });
  return group;
}

function buildPlane(mats, clouds, scenery) {
  const group = new THREE.Group();
  const { mesh, box, mat } = meshKit(mats, group);
  const body = mat(COLORS.chalkLight);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 2.7, 20), body, [0.05, 0, 0]).rotation.z = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.3, 20, 12), body, [1.4, 0, 0]).scale.set(1.5, 1, 1);
  mesh(new THREE.CylinderGeometry(0.3, 0.07, 0.9, 20), body, [-1.75, 0.12, 0]).rotation.z = Math.PI / 2 - 0.25;
  box([0.18, 0.08, 0.5], [1.55, 0.13, 0], mat(COLORS.charcoalStrong));
  const flat = (points, depth) => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    return geo;
  };
  const wing = flat([[0.45, 0.2], [-0.45, 1.6], [-0.75, 1.6], [-0.4, 0.2]], 0.06);
  const tail = flat([[-1.55, 0.1], [-1.95, 0.75], [-2.15, 0.75], [-2.05, 0.1]], 0.04);
  const shade = mat(COLORS.chalkShade);
  const engineGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.55, 16);
  [-1, 1].forEach((e) => {
    mesh(wing, shade, [0, -0.1, 0]).scale.z = e;
    mesh(tail, shade, [0, 0.3, 0]).scale.z = e;
    mesh(engineGeo, mat(COLORS.charcoalLight), [0.1, -0.28, e * 0.75]).rotation.z = Math.PI / 2;
    box([0.06, 0.08, 0.32], [0.1, -0.14, e * 0.75], mat(COLORS.charcoalStrong));
  });
  const fin = new THREE.Shape();
  fin.moveTo(-1.45, 0.2);
  fin.lineTo(-2, 1);
  fin.lineTo(-2.25, 1);
  fin.lineTo(-2.2, 0.2);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.05, bevelEnabled: false });
  finGeo.translate(0, 0, -0.025);
  mesh(finGeo, mat(COLORS.tealStrong), [0, 0, 0]);

  const puff = mat(COLORS.chalkLight);
  const rand = seededRandom(29);
  for (let i = 0; i < 4; i += 1) {
    const cloud = new THREE.Group();
    const y = 0.4 + rand() * 1.6;
    const z = -1.6 - rand() * 1.2;
    cloud.position.set(-HALF_SPAN + i * ((2 * HALF_SPAN) / 4), y, z);
    for (let p = 0; p < 3; p += 1) {
      const r = 0.18 + rand() * 0.14;
      mesh(new THREE.SphereGeometry(r, 14, 10), puff, [p * 0.26 - 0.26, p === 1 ? 0.08 : 0, 0], cloud, false);
    }
    scenery.add(cloud);
    clouds.push(cloud);
  }
  return group;
}

function buildVehicle(kind, mats, roundBox) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const scenery = new THREE.Group();
  root.add(body, scenery);
  const strips = [];
  const clouds = [];
  let wheels = [];
  let model;
  if (kind === 'truck') ({ group: model, wheels } = buildTruck(mats, roundBox));
  else if (kind === 'ship') model = buildShip(mats, strips, scenery);
  else model = buildPlane(mats, clouds, scenery);
  body.add(model);
  [...strips, ...clouds].forEach((o) => { o.userData.home = o.position.x; });
  return {
    root, body, wheels, strips, clouds,
  };
}

const wrap = (x) => {
  const span = HALF_SPAN * 2;
  return ((((x + HALF_SPAN) % span) + span) % span) - HALF_SPAN;
};

function phaseAt(clock) {
  const leg = TIMING.cruise + TIMING.exit + TIMING.enter;
  const total = leg * VEHICLES.length;
  const c = ((clock % total) + total) % total;
  const index = Math.floor(c / leg);
  const o = c - index * leg;
  if (o < TIMING.cruise) return { index, phase: 'cruise', progress: o / TIMING.cruise };
  if (o < TIMING.cruise + TIMING.exit) {
    return { index, phase: 'exit', progress: (o - TIMING.cruise) / TIMING.exit };
  }
  return {
    index: (index + 1) % VEHICLES.length,
    phase: 'enter',
    progress: (o - TIMING.cruise - TIMING.exit) / TIMING.enter,
  };
}

function advance(state, dt, active) {
  if (!active) return { ...REST };
  const step = Math.max(0, dt) / TIMING.accelerate;
  const speed = Math.min(1, state.speed + step);
  return { clock: state.clock + (Math.max(0, dt) * (state.speed + speed)) / 2, speed };
}

/**
 * Mounts the freight journey into `host`.
 * @param {HTMLElement} host sized container (the card media area)
 * @param {{ onFail: Function }} options called when WebGL fails; the block shows the poster
 * @returns {{ setPlayback(active:boolean):void, setVisible(v:boolean):void, dispose():void }}
 */
export default function mount(host, { onFail = () => {} } = {}) {
  const renderer = createRenderer({ powerPreference: 'low-power' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  const { scene, camera } = createStage(renderer, {
    hemi: 1.6, sun: 3.5, distance: 14, target: [0, 1.05, 0],
  });
  const mats = new Map();
  const roundBox = roundedBoxFactory({ bevelScale: 0.5, curveSegments: 4, zClamp: 4 });
  const vehicles = VEHICLES.map((kind) => buildVehicle(kind, mats, roundBox));
  vehicles.forEach((v) => scene.add(v.root));

  let state = { ...REST };
  let last = 0;
  let active = false;
  let visible = false;
  let failed = false;
  let disposed = false;

  const update = () => {
    const p = phaseAt(state.clock);
    const travel = camera.right * 1.6 + 3;
    const n = Math.max(0, state.clock - TIMING.cruise);
    vehicles.forEach((v, i) => {
      v.root.visible = i === p.index;
      if (!v.root.visible) return;
      let x = 0;
      if (p.phase === 'exit') x = easeExit(p.progress) * travel;
      if (p.phase === 'enter') x = (easeEnter(p.progress) - 1) * travel;
      v.root.position.x = x;
      const kind = VEHICLES[i];
      if (kind === 'truck') {
        v.wheels.forEach((w) => { w.rotation.z = -n * 0.004; });
        v.body.position.y = Math.abs(Math.sin(n * 0.012)) * 0.008 * state.speed;
      } else if (kind === 'ship') {
        v.body.position.y = -0.12 + Math.sin(n * 0.0018) * 0.02;
        v.body.rotation.x = Math.sin(n * 0.0013) * 0.012;
        v.strips.forEach((s) => { s.position.x = wrap(s.userData.home - n * 5e-4); });
      } else {
        v.body.position.y = 1.15 + Math.sin(n * 0.0016) * 0.05;
        v.body.rotation.x = Math.sin(n * 0.0011) * 0.025;
        v.clouds.forEach((c) => { c.position.x = wrap(c.userData.home - n * 4e-4); });
      }
    });
    host.dataset.vehicle = VEHICLES[p.index];
    host.dataset.phase = p.phase;
  };

  const fail = (reason, err) => {
    if (failed) return;
    failed = true;
    // eslint-disable-next-line no-use-before-define
    loop.stop();
    // eslint-disable-next-line no-console
    console.warn(`cards-stat-animated freight-journey: ${reason}; showing the poster.`, err || '');
    onFail();
  };

  const render = () => {
    if (failed || disposed) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    try {
      const height = 4.1;
      camera.left = (-height * w) / h / 2;
      camera.right = (height * w) / h / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      update();
      renderer.render(scene, camera);
    } catch (err) {
      fail('render failed', err);
    }
  };

  const loop = rafLoop((ts) => {
    if (failed || disposed || !visible || !active) return false;
    if (last) state = advance(state, ts - last, active);
    last = ts;
    render();
    return !failed;
  });

  const sync = () => {
    last = 0;
    if (active && visible && !failed && !disposed) loop.start();
    else loop.stop();
  };

  const onContextLost = (e) => {
    e.preventDefault();
    fail('WebGL context lost');
  };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  host.append(renderer.domElement);
  const resize = new ResizeObserver(render);
  resize.observe(host);
  render();

  return {
    setPlayback(next) {
      /* start the cycle at the end of the truck's cruise so it drives off right away */
      if (next && !active) state = { clock: TIMING.cruise, speed: 0 };
      active = next;
      if (!active) {
        state = { ...REST };
        render();
      }
      sync();
    },
    setVisible(next) {
      visible = next;
      sync();
    },
    dispose() {
      disposed = true;
      loop.stop();
      resize.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      disposeScene(scene, renderer);
    },
  };
}
