import {
  AmbientLight,
  BasicMaterial,
  BoxGeometry,
  DirectionalLight,
  Engine,
  Mesh,
  Node,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  PostProcess,
  Raycaster,
  SimplePhysics,
  SphereGeometry,
  StandardMaterial,
  Texture2D,
  Vector3,
} from '../src';
import { nextIndex, pointerToNdc } from './showcase-utils';
import './showcase.css';

const root = document.querySelector<HTMLDivElement>('#showcase');
if (!root) throw new Error('The examples page requires a #showcase root');

root.innerHTML = `
<header class="topbar">
  <a class="brand" href="#top" aria-label="Mini engine examples"><b>◈</b><span>mini / field notes</span></a>
  <nav aria-label="Example sections"><a href="#geometry">3D</a><a href="#interaction">Interaction</a><a href="#extensions">Extensions</a></nav>
  <a class="repo" href="https://github.com/razorbladee/mini-3d-engine" target="_blank" rel="noreferrer">Source ↗</a>
</header>
<main id="top">
  <section class="hero">
    <p class="eyebrow">MINI 3D ENGINE · LIVE REFERENCE</p>
    <h1>The engine,<br><em>not screenshots.</em></h1>
    <p>Five running WebGL scenes plus focused extension demos. Drag, click, switch cameras, drop bodies, inspect what the current API actually does.</p>
    <div class="capability-line" aria-label="Covered features"><span>WebGL2</span><span>Scene graph</span><span>TRS matrices</span><span>2 cameras</span><span>Raycasting</span><span>Physics</span></div>
  </section>

  <section class="chapter" id="geometry">
    <div class="chapter-heading"><p>01 / RENDERING</p><h2>Geometry has weight.</h2><span>Real meshes, real transforms, one tiny renderer.</span></div>
    <article class="feature feature-wide">
      <div class="copy"><span class="index">A</span><h3>Primitive parade</h3><p><code>BoxGeometry</code>, <code>SphereGeometry</code>, and <code>PlaneGeometry</code> rendered together. Every frame updates Euler rotations through the scene graph.</p><div class="legend"><i class="violet"></i>box <i class="orange"></i>sphere <i class="green"></i>plane</div></div>
      <div class="viewport"><canvas id="geometry-canvas" aria-label="Animated primitive geometry"></canvas><span class="hud" id="geometry-hud">3 meshes · perspective</span></div>
    </article>
    <div class="split">
      <article class="feature"><div class="copy"><span class="index">B</span><h3>Parent + child</h3><p>A rotating <code>Node</code> carries three children. World matrices inherit translation, rotation, and scale.</p></div><div class="viewport compact"><canvas id="graph-canvas" aria-label="Animated scene graph"></canvas><span class="hud">1 node · 3 children</span></div></article>
      <article class="feature"><div class="copy"><span class="index">C</span><h3>Two projections</h3><p>Compare depth-rich perspective with a flat orthographic projection using the same scene.</p><button class="action" id="camera-toggle">Use orthographic <span>⇄</span></button></div><div class="viewport compact"><canvas id="camera-canvas" aria-label="Camera projection comparison"></canvas><span class="hud" id="camera-hud">PerspectiveCamera · fov 58°</span></div></article>
    </div>
  </section>

  <section class="chapter contrast" id="interaction">
    <div class="chapter-heading"><p>02 / INTERACTION</p><h2>Touch the scene.</h2><span>The useful stuff starts when pixels answer back.</span></div>
    <article class="feature feature-wide inverse">
      <div class="copy"><span class="index">D</span><h3>Raycast + orbit</h3><p>Click a mesh to cast from normalized device coordinates. Drag horizontally to move the camera with <code>OrbitControls</code>.</p><p class="readout" id="pick-result">Waiting for a hit</p></div>
      <div class="viewport dark"><canvas id="interaction-canvas" aria-label="Interactive raycasting scene"></canvas><span class="hud">click to select · drag to move camera</span></div>
    </article>
    <article class="feature feature-wide inverse physics-row">
      <div class="copy"><span class="index">E</span><h3>Gravity, no drama</h3><p>Three bodies share one <code>SimplePhysics</code> world. Gravity integrates velocity and the floor constraint catches each body.</p><button class="action light" id="drop-again">Drop again <span>↓</span></button><p class="readout" id="physics-readout">Simulating 3 bodies</p></div>
      <div class="viewport dark"><canvas id="physics-canvas" aria-label="Physics simulation"></canvas><span class="hud">gravity -9.81 · floor y=0</span></div>
    </article>
  </section>

  <section class="chapter" id="extensions">
    <div class="chapter-heading"><p>03 / EXTENSIONS</p><h2>Small APIs, visible proof.</h2><span>Textures, material metadata, lights, and ordered passes.</span></div>
    <div class="extension-grid">
      <article class="extension texture-demo"><span class="index">F</span><h3>Texture2D</h3><p>Generate, encode, and decode a checker without leaving the browser.</p><canvas id="texture-canvas" aria-label="Generated checker texture"></canvas><button class="action" id="load-texture">Decode texture <span>↗</span></button><p class="readout" id="texture-result">Ready</p></article>
      <article class="extension material-demo"><span class="index">G</span><h3>Materials + lights</h3><p>The public scene API stores PBR values and three light types, ready for richer shaders.</p><div class="material-orbit"><i></i><b></b><em></em></div><dl><div><dt>roughness</dt><dd>0.24</dd></div><div><dt>metalness</dt><dd>0.78</dd></div><div><dt>lights</dt><dd id="light-count">3</dd></div></dl></article>
      <article class="extension post-demo" id="post-demo"><span class="index">H</span><h3>PostProcess</h3><p>Registered passes execute in order. The preview mirrors their visible result.</p><div class="post-art"><i></i><b></b><em></em></div><button class="action" id="post-toggle">Run 2 passes <span>◐</span></button><p class="readout" id="post-result">Passes armed</p></article>
    </div>
  </section>
</main>
<footer><span>mini / 0.1</span><span>Every canvas above is running repository code.</span><a href="#top">Back to top ↑</a></footer>`;

const engines: Engine[] = [];
function makeEngine(canvasId: string, camera: PerspectiveCamera | OrthographicCamera = new PerspectiveCamera(58, 1, 0.1, 100)) {
  const canvas = document.querySelector<HTMLCanvasElement>(`#${canvasId}`);
  if (!canvas) throw new Error(`Missing example canvas: ${canvasId}`);
  const engine = new Engine({ canvas, camera });
  engines.push(engine);
  return engine;
}

const geometryEngine = makeEngine('geometry-canvas');
const geometryMeshes = [
  new Mesh(new BoxGeometry(1.5), new BasicMaterial({ color: '#8068dc' })),
  new Mesh(new SphereGeometry(0.95, 20, 12), new BasicMaterial({ color: '#df8f56' })),
  new Mesh(new PlaneGeometry(1.8, 1.8), new BasicMaterial({ color: '#3fa783', doubleSided: true })),
];
geometryMeshes[0].position.set(-2.1, 0, -6);
geometryMeshes[1].position.set(0, 0, -6);
geometryMeshes[2].position.set(2.1, 0, -6);
geometryEngine.scene.add(...geometryMeshes);
geometryEngine.start(({ elapsed }) => {
  geometryMeshes[0].rotation.set(elapsed * 0.55, elapsed * 0.8, 0);
  geometryMeshes[1].rotation.y = elapsed * 0.45;
  geometryMeshes[2].rotation.set(elapsed * 0.35, elapsed * 0.65, elapsed * 0.15);
});

const graphEngine = makeEngine('graph-canvas');
const pivot = new Node();
pivot.position.z = -6;
const graphColors = ['#8068dc', '#df8f56', '#3fa783'];
for (let index = 0; index < 3; index += 1) {
  const child = new Mesh(new BoxGeometry(0.72), new BasicMaterial({ color: graphColors[index] }));
  const angle = index * Math.PI * 2 / 3;
  child.position.set(Math.cos(angle) * 1.65, Math.sin(angle) * 1.1, 0);
  child.scale.set(1, 1 + index * 0.25, 1);
  pivot.add(child);
}
graphEngine.scene.add(pivot);
graphEngine.start(({ elapsed }) => { pivot.rotation.z = elapsed * 0.38; pivot.rotation.y = elapsed * 0.25; });

const perspective = new PerspectiveCamera(58, 1, 0.1, 100);
const orthographic = new OrthographicCamera(-3.2, 3.2, 2.2, -2.2, 0.1, 100);
const cameraEngine = makeEngine('camera-canvas', perspective);
const cameraGroup = new Node();
cameraGroup.position.z = -7;
for (let index = 0; index < 5; index += 1) {
  const mesh = new Mesh(new BoxGeometry(0.85), new BasicMaterial({ color: index % 2 ? '#df8f56' : '#8068dc' }));
  mesh.position.set((index - 2) * 1.05, Math.sin(index * 1.7) * 0.55, index * 0.55);
  cameraGroup.add(mesh);
}
cameraEngine.scene.add(cameraGroup);
cameraEngine.start(({ elapsed }) => { cameraGroup.rotation.y = Math.sin(elapsed * 0.35) * 0.35; });
let orthographicActive = false;
document.querySelector<HTMLButtonElement>('#camera-toggle')!.onclick = (event) => {
  orthographicActive = !orthographicActive;
  cameraEngine.camera = orthographicActive ? orthographic : perspective;
  (event.currentTarget as HTMLButtonElement).firstChild!.textContent = orthographicActive ? 'Use perspective ' : 'Use orthographic ';
  document.querySelector('#camera-hud')!.textContent = orthographicActive ? 'OrthographicCamera · width 6.4' : 'PerspectiveCamera · fov 58°';
};

const interactionCamera = new PerspectiveCamera(58, 1, 0.1, 100);
const interactionEngine = makeEngine('interaction-canvas', interactionCamera);
const pickMeshes: Mesh[] = [];
for (let index = 0; index < 5; index += 1) {
  const material = new BasicMaterial({ color: index % 2 ? '#df8f56' : '#8068dc' });
  const mesh = new Mesh(index % 2 ? new SphereGeometry(0.68, 16, 9) : new BoxGeometry(1.1), material);
  mesh.name = `object-${index + 1}`;
  mesh.position.set((index - 2) * 1.35, index % 2 ? 0.45 : -0.5, -6 - Math.abs(index - 2) * 0.35);
  pickMeshes.push(mesh);
}
interactionEngine.scene.add(...pickMeshes);
const interactionCanvas = interactionEngine.renderer.canvas;
new OrbitControls(interactionCamera, interactionCanvas);
const raycaster = new Raycaster();
interactionCanvas.addEventListener('click', (event) => {
  const ndc = pointerToNdc(event.clientX, event.clientY, interactionCanvas.getBoundingClientRect());
  const hit = raycaster.setFromCamera(ndc, interactionCamera).intersectObjects(pickMeshes)[0];
  for (const mesh of pickMeshes) mesh.scale.set(1, 1, 1);
  if (hit) {
    hit.object.scale.set(1.28, 1.28, 1.28);
    document.querySelector('#pick-result')!.textContent = `${hit.object.name} · distance ${hit.distance.toFixed(2)}`;
  } else document.querySelector('#pick-result')!.textContent = 'Miss · try the center of a mesh';
});
interactionEngine.start(({ elapsed }) => {
  pickMeshes.forEach((mesh, index) => { mesh.rotation.y = elapsed * (0.22 + index * 0.04); });
});

const physicsEngine = makeEngine('physics-canvas');
const physics = new SimplePhysics();
const bodies: Mesh[] = [];
const floor = new Mesh(new BoxGeometry(1), new BasicMaterial({ color: '#34323f' }));
floor.position.set(0, -0.62, -7);
floor.scale.set(6, 0.12, 1.1);
physicsEngine.scene.add(floor);
function resetBodies() {
  for (const body of bodies) physicsEngine.scene.remove(body);
  bodies.length = 0;
  for (let index = 0; index < 3; index += 1) {
    const body = new Mesh(index === 1 ? new SphereGeometry(0.58, 16, 9) : new BoxGeometry(0.9), new BasicMaterial({ color: graphColors[index] }));
    body.position.set((index - 1) * 1.45, 2.2 + index * 1.15, -7);
    physics.addBody(body, new Vector3(index === 0 ? 0.12 : index === 2 ? -0.12 : 0, 0, 0));
    physicsEngine.scene.add(body);
    bodies.push(body);
  }
}
resetBodies();
document.querySelector<HTMLButtonElement>('#drop-again')!.onclick = resetBodies;
physicsEngine.start(({ deltaTime }) => {
  physics.step(deltaTime);
  bodies.forEach((body, index) => { body.rotation.z += deltaTime * (index + 1) * 0.45; });
  const airborne = bodies.filter((body) => body.position.y > 0).length;
  document.querySelector('#physics-readout')!.textContent = airborne ? `${airborne} bodies airborne` : 'All bodies settled';
});

const textureCanvas = document.querySelector<HTMLCanvasElement>('#texture-canvas')!;
const textureContext = textureCanvas.getContext('2d');
if (!textureContext) throw new Error('Texture example requires a 2D canvas');
textureCanvas.width = 480;
textureCanvas.height = 320;
for (let y = 0; y < 8; y += 1) for (let x = 0; x < 12; x += 1) {
  textureContext.fillStyle = (x + y) % 2 ? '#ece8fb' : '#8068dc';
  textureContext.fillRect(x * 40, y * 40, 40, 40);
}
textureContext.fillStyle = '#272632';
textureContext.font = '600 30px system-ui';
textureContext.fillText('Texture2D', 24, 292);
document.querySelector<HTMLButtonElement>('#load-texture')!.onclick = async () => {
  const result = document.querySelector('#texture-result')!;
  result.textContent = 'Decoding…';
  try {
    const texture = await Texture2D.load(textureCanvas.toDataURL());
    result.textContent = `Decoded ${texture.image.width} × ${texture.image.height}`;
  } catch (error) {
    result.textContent = error instanceof Error ? error.message : 'Texture decode failed';
  }
};

const materialScene = new Node();
const standard = new StandardMaterial({ color: '#8068dc', roughness: 0.24, metalness: 0.78 });
void standard;
materialScene.add(new AmbientLight('#fff7ed', 0.35), new DirectionalLight('#ffffff', 1.2), new PointLight('#8068dc', 2));
let lightCount = 0;
materialScene.traverse((node) => { if (node instanceof AmbientLight || node instanceof DirectionalLight || node instanceof PointLight) lightCount += 1; });
document.querySelector('#light-count')!.textContent = String(lightCount);

const post = new PostProcess();
const applied: string[] = [];
post.add({ apply: () => { applied.push('contrast'); } }).add({ apply: () => { applied.push('grade'); } });
let postState = 0;
const postLooks = ['graded', 'mono', ''];
document.querySelector<HTMLButtonElement>('#post-toggle')!.onclick = () => {
  applied.length = 0;
  post.render({} as WebGLTexture, {} as WebGLFramebuffer, {} as WebGL2RenderingContext);
  postState = nextIndex(postState, postLooks.length);
  const demo = document.querySelector('#post-demo')!;
  demo.classList.remove('graded', 'mono');
  if (postLooks[postState]) demo.classList.add(postLooks[postState]);
  document.querySelector('#post-result')!.textContent = `${applied.join(' → ')} · look ${postState + 1}/3`;
};

const resizeAll = () => engines.forEach((engine) => engine.resize());
window.addEventListener('load', resizeAll, { once: true });
