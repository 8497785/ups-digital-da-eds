/*
 * Shared helpers for the cards-stat-animated three.js renderers.
 * Ported from the source site's illustration runtime (index / hatchShadow bundles):
 * isometric camera direction, hatched ground shadow, rounded boxes, seeded RNG,
 * cubic-bezier easing and a pausable requestAnimationFrame loop.
 * Loaded only together with three.js, when an animated card nears the viewport.
 */
import * as THREE from '../../scripts/vendor/three.module.min.js';

export { THREE };

/* Light-theme graphic tokens from the source design system (--m-graphic-*). */
export const COLORS = {
  tealStrong: '#0a8080',
  tealLight: '#9fcbcb',
  tealTint: '#e7f2f2',
  blueStrong: '#0662bb',
  blueShade: '#064d93',
  blueLight: '#99c0e1',
  blueTint: '#e6eff8',
  goldStrong: '#fcc400',
  goldLight: '#ffd84c',
  coralStrong: '#e65533',
  redStrong: '#d23a2e',
  chalkLight: '#fbfaf8',
  chalkShade: '#cfccc6',
  charcoalLight: '#75757e',
  charcoalStrong: '#45454c',
  charcoalShade: '#2c2c31',
  outline: '#85858e',
};

/* Isometric view: 17.5 degree elevation of the projected ground axes. */
export const ISO_ANGLE = 17.5;
const H = Math.asin(Math.tan((ISO_ANGLE * Math.PI) / 180));
export const ISO_DIR = [Math.cos(H) * Math.SQRT1_2, Math.sin(H), Math.cos(H) * Math.SQRT1_2];

export const pixelRatio = () => Math.min(2, window.devicePixelRatio || 1);

/* eslint-disable no-bitwise -- seeded RNG identical to the source */
/** mulberry32-style seeded random, identical to the source so layouts match. */
export function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 1831565813) >>> 0;
    let e = t;
    e = Math.imul(e ^ (e >>> 15), e | 1);
    e ^= e + Math.imul(e ^ (e >>> 7), e | 61);
    return ((e ^ (e >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable no-bitwise */

/** CSS cubic-bezier easing (Newton iterations with bisection fallback). */
export function cubicBezier([x1, y1, x2, y2]) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-5) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i += 1) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t; else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** requestAnimationFrame loop; `frame(ts)` returns false to stop. */
export function rafLoop(frame) {
  let id = 0;
  let running = false;
  const tick = (ts) => {
    id = 0;
    if (!running) return;
    if (frame(ts)) id = requestAnimationFrame(tick);
    else running = false;
  };
  return {
    start() {
      if (running) return;
      running = true;
      id = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (id) cancelAnimationFrame(id);
      id = 0;
    },
  };
}

/**
 * Ground material that only shows received shadows, as diagonal hatch lines
 * (3px pitch at the iso angle), like the source's hatchShadow.
 */
export function hatchShadowMaterial(ratio) {
  const material = new THREE.ShadowMaterial({
    color: new THREE.Color(COLORS.outline),
    opacity: 1,
    toneMapped: false,
  });
  material.onBeforeCompile = (shader) => {
    const r = (ISO_ANGLE * Math.PI) / 180;
    shader.uniforms.hatchPixelRatio = { value: ratio };
    shader.uniforms.hatchNormal = { value: new THREE.Vector2(-Math.sin(r), Math.cos(r)) };
    shader.fragmentShader = `uniform float hatchPixelRatio;
uniform vec2 hatchNormal;
${shader.fragmentShader}`.replace('#include <tonemapping_fragment>', `
      float hatchPosition = dot(gl_FragCoord.xy / hatchPixelRatio, hatchNormal);
      float hatchDistance = abs(mod(hatchPosition + 1.5, 3.0) - 1.5);
      float hatchAA = fwidth(hatchPosition) * 0.5;
      gl_FragColor.a *= 1.0 - smoothstep(0.5 - hatchAA, 0.5 + hatchAA, hatchDistance);
      #include <tonemapping_fragment>
    `);
  };
  material.customProgramCacheKey = () => 'cards-stat-animated-hatch-shadow';
  return material;
}

/**
 * Rounded box as a bevelled extrusion; cached per size so repeated parts share geometry.
 * `zClamp` mirrors the two source variants (depth/4 for freight, depth/3 for the laptop).
 */
export function roundedBoxFactory({ bevelScale = 0.5, curveSegments = 4, zClamp = 4 } = {}) {
  const cache = new Map();
  return (size, radius) => {
    const [w, h, d] = size;
    const key = `${w}:${h}:${d}:${radius}`;
    if (cache.has(key)) return cache.get(key);
    let geometry;
    const s = Math.min(radius, w / 4, h / 4, d / zClamp);
    if (!radius || s <= 0) {
      geometry = new THREE.BoxGeometry(w, h, d);
    } else {
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 + s, -h / 2);
      shape.lineTo(w / 2 - s, -h / 2);
      shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + s);
      shape.lineTo(w / 2, h / 2 - s);
      shape.quadraticCurveTo(w / 2, h / 2, w / 2 - s, h / 2);
      shape.lineTo(-w / 2 + s, h / 2);
      shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - s);
      shape.lineTo(-w / 2, -h / 2 + s);
      shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + s, -h / 2);
      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: d - 2 * s,
        bevelEnabled: true,
        bevelThickness: s,
        bevelSize: s * bevelScale,
        bevelSegments: 2,
        steps: 1,
        curveSegments,
      });
      geometry.translate(0, 0, -d / 2 + s);
    }
    cache.set(key, geometry);
    return geometry;
  };
}

/** Shared lights, hatched ground and orthographic iso camera. */
export function createStage(renderer, {
  hemi, sun, distance, target,
}) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, hemi));
  const light = new THREE.DirectionalLight(0xffffff, sun);
  light.position.set(-3, 7, 5);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, {
    left: -5,
    right: 5,
    top: 5,
    bottom: -5,
  });
  light.shadow.normalBias = 0.02;
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    hatchShadowMaterial(renderer.getPixelRatio()),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.004;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.OrthographicCamera();
  const look = new THREE.Vector3(...target);
  camera.position.copy(look).add(new THREE.Vector3(...ISO_DIR).multiplyScalar(distance));
  camera.lookAt(look);
  camera.near = 0.1;
  camera.far = distance * 4;
  return { scene, camera, light };
}

export function createRenderer(options = {}) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true, antialias: true, ...options,
  });
  renderer.setPixelRatio(pixelRatio());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  return renderer;
}

/** Frees every geometry, material and shadow map of a scene plus the renderer. */
export function disposeScene(scene, renderer) {
  const materials = new Set();
  const geometries = new Set();
  scene.traverse((obj) => {
    if (obj.isDirectionalLight) obj.shadow.dispose();
    if (obj.isMesh) {
      geometries.add(obj.geometry);
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach((m) => materials.add(m));
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  renderer.dispose();
  renderer.domElement.remove();
}
