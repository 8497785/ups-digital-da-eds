/* eslint-disable max-len -- part tables mirror the source renderer one part per line */
/*
 * Claims laptop: isometric dark laptop with a claim form on screen (three.js).
 * Procedural port of the source claimsLaptopRenderer. While active it loops a
 * 10.5-beat cycle (1 beat = 320ms): the gold Enter key presses, an upload bar fills,
 * a teal shield with a check spins in, confetti bursts, then the form returns.
 * At rest (inactive) it shows the laptop with the claim form.
 */
import {
  THREE, COLORS, createRenderer, createStage, roundedBoxFactory, seededRandom,
  rafLoop, disposeScene,
} from './scene-utils.js';

const BEAT = 320; /* --m-duration-slow */
const CYCLE = 10.5;

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function phaseAt(elapsed) {
  const n = (((elapsed / BEAT) % CYCLE) + CYCLE) % CYCLE;
  let phase = 'reset';
  if (n < 1) phase = 'pressing';
  else if (n < 4) phase = 'uploading';
  else if (n < 5.5) phase = 'spinning';
  else if (n < 7.5) phase = 'received';
  else if (n < 9.5) phase = 'confetti';
  return {
    phase,
    press: n < 1 ? Math.sin(n * Math.PI) : 0,
    progress: clamp01((n - 1) / 3),
    reveal: clamp01((n - 4) / 1.5),
    burst: clamp01((n - 7.5) / 2),
  };
}

/**
 * Mounts the claims laptop into `host`.
 * @param {HTMLElement} host sized container (the card media area)
 * @param {{ onFail: Function }} options called when WebGL fails; the block shows the poster
 * @returns {{ setPlayback(active:boolean):void, setVisible(v:boolean):void, dispose():void }}
 */
export default function mount(host, { onFail = () => {} } = {}) {
  const renderer = createRenderer();
  renderer.toneMapping = THREE.NoToneMapping;
  const { scene, camera } = createStage(renderer, {
    hemi: 1.8, sun: 3, distance: 10, target: [0, 1.03, 0],
  });
  const roundBox = roundedBoxFactory({ bevelScale: 0.5, curveSegments: 6, zClamp: 3 });
  const mat = (color, metalness = 0) => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color), roughness: 0.46, metalness,
  });
  const box = (parent, size, pos, material, r = 0.025) => {
    const mesh = new THREE.Mesh(roundBox(size, r), material);
    mesh.position.set(...pos);
    parent.add(mesh);
    return mesh;
  };

  const base = mat(COLORS.charcoalShade, 0.25);
  const deck = mat(COLORS.charcoalStrong, 0.2);
  const detail = mat(COLORS.charcoalLight, 0.45);
  const ink = mat(COLORS.charcoalStrong);
  const screen = mat(COLORS.chalkLight);
  const teal = mat(COLORS.tealStrong);
  const tint = mat(COLORS.tealTint);
  const white = mat(COLORS.chalkLight);
  const gold = mat(COLORS.goldStrong);
  const details = new THREE.Group();
  scene.add(details);

  /* base and keyboard */
  box(scene, [3.25, 0.14, 2.15], [0, 0.16, 0.28], base);
  box(scene, [3.15, 0.025, 2.04], [0, 0.247, 0.28], deck);
  box(scene, [2.82, 0.035, 0.92], [0, 0.27, -0.15], base);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 12; col += 1) {
      if (row < 2 || col < 9) {
        box(scene, [0.197, 0.027, 0.163], [-1.27 + col * 0.231, 0.3, -0.47 + row * 0.212], deck, 0.008);
        box(details, [0.045, 0.004, 0.012], [-1.29 + col * 0.231, 0.316, -0.48 + row * 0.212], detail, 0.001);
      }
    }
  }
  const enterKey = box(scene, [0.67, 0.11, 0.39], [1.04, 0.33, 0.07], gold, 0.022);
  box(scene, [1.04, 0.025, 0.15], [0, 0.3, 0.39], deck, 0.008);
  box(scene, [1.12, 0.012, 0.57], [0, 0.267, 0.85], detail, 0.003);
  box(scene, [1.06, 0.012, 0.51], [0, 0.276, 0.85], deck, 0.003);
  box(details, [0.34, 0.02, 0.032], [0, 0.17, 1.36], ink, 0.004);
  const hingeGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.5, 20);
  [-1.15, 1.15].forEach((x) => {
    const hinge = new THREE.Mesh(hingeGeo, detail);
    hinge.rotation.z = Math.PI / 2;
    hinge.position.set(x, 0.28, -0.73);
    scene.add(hinge);
    for (let i = 0; i < 9; i += 1) box(details, [0.013, 0.008, 0.11], [x + (i - 4) * 0.032, 0.267, 0.91], ink, 0.002);
  });

  /* lid and screen */
  const lid = new THREE.Group();
  lid.position.set(0, 0.29, -0.73);
  lid.rotation.x = -0.13;
  scene.add(lid);
  box(lid, [3.25, 2.08, 0.12], [0, 1.04, 0], base, 0.04);
  box(lid, [3.1, 1.94, 0.018], [0, 1.06, 0.073], ink, 0.006);
  box(lid, [2.88, 1.68, 0.014], [0, 1.09, 0.09], screen, 0.004);
  box(lid, [0.035, 0.035, 0.012], [0, 2.008, 0.083], detail, 0.004);

  /* claim form UI */
  const form = new THREE.Group();
  lid.add(form);
  box(form, [2.88, 0.23, 0.014], [0, 1.815, 0.105], tint);
  box(form, [0.48, 0.04, 0.012], [-1.03, 1.815, 0.12], teal);
  [1.49, 1.15].forEach((y) => {
    box(form, [0.65, 0.035, 0.014], [-0.84, y + 0.13, 0.12], ink);
    box(form, [2.28, 0.19, 0.018], [0, y - 0.025, 0.113], tint);
    box(form, [1.22, 0.025, 0.012], [-0.38, y - 0.025, 0.13], detail);
  });
  const submit = new THREE.Group();
  submit.position.set(0, 0.64, 0.12);
  form.add(submit);
  box(submit, [1.3, 0.28, 0.05], [0, 0, 0], teal);
  box(submit, [0.54, 0.035, 0.012], [-0.08, 0, 0.033], white);

  /* shield with check */
  const shield = new THREE.Group();
  shield.position.set(0, 1.11, 0.13);
  lid.add(shield);
  const outline = new THREE.Shape();
  outline.moveTo(0, 0.59);
  outline.lineTo(0.48, 0.4);
  outline.lineTo(0.43, -0.13);
  outline.quadraticCurveTo(0.33, -0.45, 0, -0.61);
  outline.quadraticCurveTo(-0.33, -0.45, -0.43, -0.13);
  outline.lineTo(-0.48, 0.4);
  outline.closePath();
  shield.add(new THREE.Mesh(new THREE.ExtrudeGeometry(outline, {
    depth: 0.025, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, steps: 1,
  }), teal));
  box(shield, [0.25, 0.075, 0.025], [-0.13, -0.06, 0.06], white, 0.006).rotation.z = -Math.PI / 4;
  box(shield, [0.47, 0.075, 0.025], [0.09, 0.02, 0.06], white, 0.006).rotation.z = Math.PI / 4;

  /* upload progress bar */
  const upload = new THREE.Group();
  upload.position.set(0, 1.09, 0.13);
  lid.add(upload);
  box(upload, [2.1, 0.15, 0.02], [0, 0, 0], tint, 0.008);
  const fill = box(upload, [2.06, 0.11, 0.025], [0, 0, 0.015], teal, 0.006);

  /* confetti */
  const burst = new THREE.Group();
  burst.position.copy(shield.position);
  lid.add(burst);
  const rand = seededRandom(43);
  const palette = [teal, gold, tint, mat(COLORS.coralStrong)];
  const confetti = Array.from({ length: 36 }, (_, i) => {
    const y = rand() - 0.5;
    const x = (rand() * 2 - 1) * (y < 0 ? 0.44 * (1 + y / 0.65) : 0.44);
    const mesh = box(burst, [0.055, 0.095, 0.014], [x, y, 0.02], palette[i % palette.length], 0.002);
    return {
      mesh, x, y, dx: (rand() * 2 - 1) * 0.75, dy: 0.2 + rand() * 0.5, spin: (rand() * 2 - 1) * Math.PI * 3,
    };
  });

  scene.traverse((o) => { if (o.isMesh && !o.material.isShadowMaterial) o.castShadow = true; });

  let elapsed = 0;
  let last = 0;
  let active = false;
  let visible = false;
  let failed = false;
  let disposed = false;

  const update = () => {
    const r = phaseAt(elapsed);
    const playing = active;
    enterKey.position.y = 0.33 - (playing ? r.press : 0) * 0.09;
    shield.visible = playing && (r.phase === 'spinning' || r.phase === 'received');
    const eased = 1 - (1 - r.reveal) ** 3;
    shield.scale.setScalar(0.05 + eased * 0.95);
    shield.rotation.y = (1 - eased) * Math.PI * 2;
    upload.visible = playing && r.phase === 'uploading';
    fill.scale.x = Math.max(0.001, r.progress);
    fill.position.x = -1.03 * (1 - r.progress);
    burst.visible = playing && r.phase === 'confetti';
    confetti.forEach((c) => {
      const t = r.burst;
      c.mesh.position.set(
        c.x + c.dx * t,
        c.y + c.dy * Math.sin(t * Math.PI) - t * t * 0.55,
        0.02 + Math.sin(t * Math.PI) * 0.12,
      );
      c.mesh.rotation.set(c.spin * t, c.spin * t * 0.7, c.spin * t * 0.4);
      c.mesh.scale.setScalar(Math.max(0.001, 1 - t * t));
    });
    form.visible = !playing || r.phase === 'pressing' || r.phase === 'reset';
    host.dataset.claimsPhase = playing ? r.phase : 'rest';
  };

  const fail = (reason, err) => {
    if (failed) return;
    failed = true;
    // eslint-disable-next-line no-use-before-define
    loop.stop();
    // eslint-disable-next-line no-console
    console.warn(`cards-stat-animated claims-laptop: ${reason}; showing the poster.`, err || '');
    onFail();
  };

  const render = () => {
    if (failed || disposed) return;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    try {
      const height = Math.max(4.1, (4.8 * h) / w);
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
    elapsed += last ? ts - last : 0;
    last = ts;
    render();
    return !failed;
  });

  const sync = () => {
    last = 0;
    if (active && visible && !failed && !disposed) loop.start();
    else loop.stop();
    render();
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
      if (!next) elapsed = 0;
      active = next;
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
