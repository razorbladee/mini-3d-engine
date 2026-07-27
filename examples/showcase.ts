import {
  AmbientLight,
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Engine,
  GLTFLoader,
  HemisphereLight,
  Mesh,
  Node,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  PostProcess,
  PlaneGeometry,
  PointLight,
  Raycaster,
  SimplePhysics,
  SphereGeometry,
  SpotLight,
  StandardMaterial,
  Texture2D,
  TorusGeometry,
  Vector3,
  AnimationClip,
  AnimationMixer,
  AssetManager,
  InputMap,
} from '../src';
import { examples, ExampleId } from './showcase-registry';
import { pointerToNdc } from './showcase-utils';
import './showcase.css';
type Runtime = {
  engine?: Engine;
  controls?: OrbitControls;
  update?: (t: { deltaTime: number; elapsed: number }) => void;
  dispose?: () => void;
};
const root = document.querySelector<HTMLDivElement>('#showcase');
if (!root) throw new Error('The examples page requires a #showcase root');
root.innerHTML =
  '<div class="app-shell"><aside class="sidebar"><div class="mark">◈ <span>mini / lab</span></div><p class="sidebar-kicker">EXAMPLES / 0.9</p><h1>Scene browser</h1><p class="sidebar-copy">Every entry below builds a different scene or subsystem demo.</p><nav id="example-nav"></nav><div class="sidebar-foot"><span class="status-dot"></span> WebGL2 · ' +
  examples.length +
  ' scenes</div></aside><main class="workspace"><header class="workspace-top"><div><p class="eyebrow" id="example-group"></p><h2 id="example-title"></h2></div><div class="top-actions"><button class="quiet" id="reset-camera">Reset camera</button><button class="quiet" id="next-example">Next scene ↗</button></div></header><section class="scene-stage"><div class="scene-copy"><p id="example-summary"></p><p class="control-hint" id="example-hint"></p></div><div class="viewport" id="viewport"></div><div class="stage-footer"><span id="scene-index"></span><span id="scene-status">running</span></div></section></main></div>';
const nav = document.querySelector<HTMLElement>('#example-nav')!,
  viewport = document.querySelector<HTMLElement>('#viewport')!;
let active: ExampleId = examples[0].id;
let runtime: Runtime = {};
let activeCanvas: HTMLCanvasElement | null = null;
const models = {
  box: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxAnimated/glTF/BoxAnimated.gltf',
  cesium: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CesiumMan/glTF/CesiumMan.gltf',
  fox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF/Fox.gltf',
};
function status(v: string) {
  document.querySelector('#scene-status')!.textContent = v;
}
function mat(color: string, r = 0.38, m = 0.08, map?: Texture2D) {
  return new StandardMaterial({ color, roughness: r, metalness: m, map });
}
function canvas() {
  activeCanvas = document.createElement('canvas');
  activeCanvas.className = 'scene-canvas';
  viewport.append(activeCanvas);
  return activeCanvas;
}
function three(): Runtime {
  const c = canvas(),
    e = new Engine({ canvas: c, camera: new PerspectiveCamera(58, 1, 0.1, 100) });
  return { engine: e, controls: new OrbitControls(e.camera, c) };
}
function studio(s: Node) {
  s.add(new AmbientLight('#fff7ed', 0.35));
  const d = new DirectionalLight('#fff5dc', 1.5);
  d.direction.set(-0.5, -0.8, -0.35);
  s.add(d);
  const p = new PointLight('#8068dc', 3);
  p.position.set(-3, 2, 2);
  p.distance = 14;
  s.add(p);
}
function plane(s: Node) {
  const f = new Mesh(new PlaneGeometry(18, 18), mat('#403b52', 0.72, 0.03));
  f.rotation.x = -Math.PI / 2;
  f.position.y = -1.05;
  s.add(f);
}
function scene3D(shapes: Mesh[]): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  shapes.forEach((m) => s.add(m));
  return r;
}
function texture(kind: 'stripes' | 'checker' | 'noise') {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  if (kind === 'stripes')
    for (let i = 0; i < 16; i++) {
      x.fillStyle = i % 2 ? '#d75e42' : '#f2c36b';
      x.fillRect(i * 16, 0, 16, 256);
    }
  else if (kind === 'checker')
    for (let y = 0; y < 16; y++)
      for (let i = 0; i < 16; i++) {
        x.fillStyle = (i + y) % 2 ? '#8068dc' : '#e9d9b5';
        x.fillRect(i * 16, y * 16, 16, 16);
      }
  else {
    const d = x.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 90 + Math.random() * 80;
      d.data[i] = v;
      d.data[i + 1] = v * 0.7;
      d.data[i + 2] = v * 0.4;
      d.data[i + 3] = 255;
    }
    x.putImageData(d, 0, 0);
  }
  return Texture2D.load(c.toDataURL());
}
function primitives(): Runtime {
  const a = new Mesh(new BoxGeometry(1.8), mat('#8068dc', 0.26, 0.16)),
    b = new Mesh(new SphereGeometry(1.05, 28, 18), mat('#df8f56', 0.2, 0.48)),
    c = new Mesh(new PlaneGeometry(2.3, 2.3), mat('#3fa783', 0.6));
  a.position.set(-2.2, 0, -5);
  b.position.set(0, 0, -5);
  c.position.set(2.2, 0, -5);
  c.rotation.x = -0.35;
  const r = scene3D([a, b, c]);
  plane(r.engine!.scene);
  r.update = ({ elapsed }) => {
    a.rotation.set(elapsed * 0.5, elapsed * 0.75, 0);
    b.rotation.y = elapsed * 0.4;
    c.rotation.z = elapsed * 0.3;
  };
  return r;
}
function advanced(): Runtime {
  const a = new Mesh(new CylinderGeometry(0.8, 1.6, 24), mat('#8068dc', 0.3, 0.25)),
    b = new Mesh(new TorusGeometry(1, 0.28, 32, 16), mat('#df8f56', 0.22, 0.55)),
    c = new Mesh(new CapsuleGeometry(0.55, 1.5, 20, 10), mat('#3fa783', 0.32, 0.18));
  a.position.set(-2, 0, -5);
  b.position.set(0, 0, -5);
  c.position.set(2, 0, -5);
  const r = scene3D([a, b, c]);
  plane(r.engine!.scene);
  r.update = ({ elapsed }) =>
    [a, b, c].forEach((m, i) => {
      m.rotation.x = elapsed * (0.25 + i * 0.12);
      m.rotation.y = elapsed * (0.4 + i * 0.15);
    });
  return r;
}
function materials(): Runtime {
  const ms = [0.12, 0.42, 0.72, 0.3].map((q, i) => {
    const m = new Mesh(
      new SphereGeometry(0.86, 28, 18),
      mat(['#8068dc', '#df8f56', '#3fa783', '#e19bc9'][i], q, [0.05, 0.1, 0.2, 0.85][i]),
    );
    m.position.set((i - 1.5) * 1.65, 0, -5.5);
    return m;
  });
  return scene3D(ms);
}
function graph(): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  const n = new Node();
  n.position.z = -5.8;
  for (let i = 0; i < 4; i++) {
    const m = new Mesh(
      i % 2 ? new SphereGeometry(0.46, 20, 12) : new BoxGeometry(0.72),
      mat(['#8068dc', '#df8f56', '#3fa783', '#e19bc9'][i], 0.24, 0.3),
    );
    const a = (i * Math.PI) / 2;
    m.position.set(Math.cos(a) * 1.9, Math.sin(a) * 0.7, 0);
    n.add(m);
  }
  s.add(n);
  r.update = ({ elapsed }) => {
    n.rotation.y = elapsed * 0.35;
    n.rotation.z = Math.sin(elapsed * 0.4) * 0.2;
  };
  return r;
}
function procedural(): Runtime {
  const ms = [
    new Mesh(new SphereGeometry(1, 28, 18), mat('#fff', 0.28, 0.2)),
    new Mesh(new BoxGeometry(1.6), mat('#fff', 0.45, 0.05)),
    new Mesh(new SphereGeometry(1, 28, 18), mat('#fff', 0.7, 0.05)),
  ];
  ms.forEach((m, i) => m.position.set((i - 1) * 2, 0, -5));
  const r = scene3D(ms);
  Promise.all([texture('stripes'), texture('checker'), texture('noise')]).then((ts) => {
    ts.forEach((t, i) => ((ms[i].material as StandardMaterial).map = t));
    status('3 procedural maps active');
  });
  return r;
}
function lighting(): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  const h = new HemisphereLight('#b8d4ff', 0.8);
  h.groundColor = '#4b3d54';
  // A real cone now that SpotLight is more than a renamed DirectionalLight
  // (AUDIT-TZ P2-4): position, angle, penumbra and distance all matter.
  const sp = new SpotLight('#ffcc88', 6);
  sp.position.set(0, 4.2, -4);
  sp.direction.set(0, -1, 0);
  sp.angle = Math.PI / 7;
  sp.penumbra = 0.45;
  sp.distance = 12;
  s.add(h, sp);
  plane(s);
  const a = new Mesh(new SphereGeometry(1.1, 28, 18), mat('#df8f56', 0.25, 0.35)),
    b = new Mesh(new TorusGeometry(1, 0.3, 28, 14), mat('#8068dc', 0.35, 0.55));
  a.position.set(-1.4, 0, -5);
  b.position.set(1.4, 0, -5);
  s.add(a, b);
  // Sweep the cone so the falloff edge is visible.
  r.update = ({ elapsed }) => {
    sp.direction.set(Math.sin(elapsed * 0.6) * 0.4, -1, Math.cos(elapsed * 0.6) * 0.2);
    b.rotation.x = elapsed * 0.4;
  };
  return r;
}
function image(kind: 'wood' | 'brick' | 'cloth'): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  const urls = {
    wood: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Wood_planks_texture.jpg/960px-Wood_planks_texture.jpg',
    brick:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Red_brick_texture_house_wall.jpg/960px-Red_brick_texture_house_wall.jpg',
    cloth: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Cloth_texture.jpg/960px-Cloth_texture.jpg',
  };
  const m = new Mesh(
    kind === 'wood'
      ? new PlaneGeometry(4.8, 3.2)
      : kind === 'cloth'
        ? new SphereGeometry(1.5, 28, 18)
        : new BoxGeometry(2.6),
    mat('#fff', 0.5, 0.1),
  );
  m.position.z = -5;
  s.add(m);
  Texture2D.load(urls[kind])
    .then((t) => ((m.material as StandardMaterial).map = t))
    .catch(() => status(kind + ' texture unavailable'));
  return r;
}
function model(url: string, label: string): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  status('loading ' + label);
  new GLTFLoader()
    .load(url)
    .then((m) => {
      m.scene.position.z = -5;
      s.add(m.scene);
      r.controls!.focus(new Vector3(0, 0, -5), Math.max(4, Math.min(12, m.bounds.radius * 2.8)));
      status(label + ' loaded · ' + m.animations.length + ' animations');
    })
    .catch((e) => status(e instanceof Error ? e.message : 'model unavailable'));
  return r;
}
function ray(): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  const ms = Array.from({ length: 6 }, (_, i) => {
    const m = new Mesh(
      i % 2 ? new SphereGeometry(0.65, 22, 14) : new BoxGeometry(1.05),
      mat(i % 2 ? '#df8f56' : '#8068dc', 0.25, 0.32),
    );
    m.position.set((i - 2.5) * 1.35, Math.sin(i * 1.3) * 0.6, -5.5);
    return m;
  });
  s.add(...ms);
  const q = new Raycaster();
  activeCanvas!.onclick = (e) => {
    const hit = q
      .setFromCamera(pointerToNdc(e.clientX, e.clientY, activeCanvas!.getBoundingClientRect()), r.engine!.camera)
      .intersectObjects(ms)[0];
    if (hit) {
      r.controls!.focus(hit.point, 5);
      status('focused object');
    }
  };
  return r;
}
function physics(): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  plane(s);
  const p = new SimplePhysics(),
    bs: Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const m = new Mesh(
      i % 2 ? new SphereGeometry(0.5, 22, 14) : new BoxGeometry(0.8),
      mat(['#8068dc', '#df8f56', '#3fa783', '#e19bc9', '#d7b35a'][i], 0.3, 0.25),
    );
    m.position.set((i - 2) * 1.1, 1.5 + i * 0.8, -5.5);
    p.addBody(m, new Vector3((i - 2) * 0.12, 0, 0));
    s.add(m);
    bs.push(m);
  }
  r.update = ({ deltaTime }) => {
    p.step(deltaTime);
    bs.forEach((m, i) => (m.rotation.z += deltaTime * (i + 1) * 0.35));
  };
  return r;
}
function production(id: ExampleId): Runtime {
  const r = three(),
    s = r.engine!.scene;
  studio(s);
  if (id === 'transparent') {
    const ms = [
      new Mesh(
        new SphereGeometry(1, 24, 16),
        new StandardMaterial({ color: '#8068dc', opacity: 0.45, transparent: true }),
      ),
      new Mesh(
        new TorusGeometry(1, 0.28, 24, 12),
        new StandardMaterial({ color: '#df8f56', opacity: 0.6, transparent: true }),
      ),
    ];
    ms[0].position.set(-1, 0, -5);
    ms[1].position.set(1, 0, -5);
    s.add(...ms);
    return r;
  }
  if (id === 'animation') {
    const m = new Mesh(new SphereGeometry(1, 24, 16), mat('#df8f56', 0.25, 0.3));
    m.position.z = -5;
    s.add(m);
    const values = new AnimationMixer(),
      clip = new AnimationClip('pulse', 2, [
        {
          keyframes: [
            { time: 0, value: 0.7 },
            { time: 1, value: 1.5 },
            { time: 2, value: 0.7 },
          ],
          apply: (v) => m.scale.set(v, v, v),
        },
      ]);
    values.play(clip);
    r.update = ({ deltaTime }) => values.update(deltaTime);
    return r;
  }
  if (id === 'asset-manager') {
    const manager = new AssetManager();
    let count = 0;
    manager.load(
      'demo',
      async () => {
        count++;
        await new Promise((x) => setTimeout(x, 300));
        return count;
      },
      { onProgress: (p) => status(p.loaded ? 'asset loaded' : 'loading asset') },
    );
    manager.load('demo', async () => {
      count++;
      return count;
    });
    return r;
  }
  if (id === 'bounds-input') {
    const input = new InputMap();
    const point = new Node();
    point.position.z = -5;
    s.add(new Mesh(new BoxGeometry(1), mat('#8068dc')).add(point));
    r.update = () => {
      if (input.bind('jump', ['ArrowUp', ' ']).wasPressed()) status('input received');
    };
    return r;
  }
  return r;
}
/**
 * Camera lab: the same scene through a perspective and an orthographic camera.
 * Previously this id fell through to a 2D canvas placeholder (AUDIT-TZ P3-4).
 */
function cameras(): Runtime {
  const c = canvas();
  const perspective = new PerspectiveCamera(58, 1, 0.1, 100);
  const orthographic = new OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
  const engine = new Engine({ canvas: c, camera: perspective });
  const controls = new OrbitControls(engine.camera, c);
  const s = engine.scene;
  studio(s);
  plane(s);

  // A row receding into the distance: perspective converges, ortho does not.
  const shapes = [0, 1, 2, 3].map((i) => {
    const m = new Mesh(i % 2 ? new SphereGeometry(0.6, 24, 16) : new BoxGeometry(1), mat('#8068dc', 0.3, 0.25));
    m.position.set(-2.4 + i * 1.6, 0, -4 - i * 1.6);
    return m;
  });
  s.add(...shapes);

  let usingPerspective = true;
  const toggle = document.createElement('button');
  toggle.className = 'lab-toggle';
  toggle.textContent = 'Switch to orthographic';
  toggle.onclick = () => {
    usingPerspective = !usingPerspective;
    engine.camera = usingPerspective ? perspective : orthographic;
    controls.camera = engine.camera;
    controls.updateCamera();
    engine.resize();
    toggle.textContent = usingPerspective ? 'Switch to orthographic' : 'Switch to perspective';
    status(usingPerspective ? 'perspective projection' : 'orthographic projection');
  };
  viewport.append(toggle);

  status('perspective projection');
  return { engine, controls, dispose: () => toggle.remove() };
}

/** Texture decoder: procedural canvas source uploaded through Texture2D. */
function textureLab(): Runtime {
  const r = three();
  const s = r.engine!.scene;
  studio(s);

  const target = new Mesh(new BoxGeometry(2.2), mat('#ffffff', 0.45, 0.1));
  target.position.z = -5;
  s.add(target);

  const kinds: ('stripes' | 'checker' | 'noise')[] = ['checker', 'stripes', 'noise'];
  let index = 0;
  const apply = async () => {
    const kind = kinds[index % kinds.length];
    status(`decoding ${kind}`);
    try {
      const decoded = await texture(kind);
      (target.material as StandardMaterial).map = decoded;
      status(`${kind} decoded (${decoded.image.width}x${decoded.image.height})`);
    } catch {
      status(`${kind} failed to decode`);
    }
  };

  const button = document.createElement('button');
  button.className = 'lab-toggle';
  button.textContent = 'Decode next map';
  button.onclick = () => {
    index += 1;
    void apply();
  };
  viewport.append(button);
  void apply();

  r.update = ({ elapsed }) => {
    target.rotation.y = elapsed * 0.4;
    target.rotation.x = Math.sin(elapsed * 0.3) * 0.25;
  };
  r.dispose = () => button.remove();
  return r;
}

/** Post-process passes: an ordered chain whose output feeds the next stage. */
function postprocessLab(): Runtime {
  const r = three();
  const s = r.engine!.scene;
  studio(s);
  plane(s);

  const shapes = [
    new Mesh(new TorusGeometry(1, 0.3, 28, 16), mat('#8068dc', 0.28, 0.45)),
    new Mesh(new SphereGeometry(0.8, 24, 16), mat('#df8f56', 0.2, 0.5)),
  ];
  shapes[0].position.set(-1.3, 0, -5);
  shapes[1].position.set(1.3, 0, -5);
  s.add(...shapes);

  // The chain is exercised on a stand-in texture: each pass receives what the
  // previous one produced, which is exactly the behaviour P1-7 restored.
  const chain = new PostProcess();
  const trace: string[] = [];
  for (const name of ['grade', 'vignette', 'grain']) {
    chain.add({
      apply: (input) => {
        trace.push(`${String(input)} -> ${name}`);
        return `${name}` as unknown as WebGLTexture;
      },
    });
  }

  const button = document.createElement('button');
  button.className = 'lab-toggle';
  button.textContent = 'Run pass chain';
  const gl = (r.engine!.renderer as { gl?: WebGL2RenderingContext }).gl ?? ({} as WebGL2RenderingContext);
  button.onclick = () => {
    trace.length = 0;
    chain.render('scene' as unknown as WebGLTexture, {} as WebGLFramebuffer, gl);
    status(`${chain.length} passes: ${trace.join(', ')}`);
  };
  viewport.append(button);
  status(`${chain.length} passes ready`);

  r.update = ({ elapsed }) => {
    shapes[0].rotation.x = elapsed * 0.5;
    shapes[1].rotation.y = elapsed * 0.6;
  };
  r.dispose = () => button.remove();
  return r;
}
function build(id: ExampleId): Runtime {
  if (id === 'primitives') return primitives();
  if (id === 'advanced-primitives') return advanced();
  if (id === 'materials') return materials();
  if (id === 'scene-graph') return graph();
  if (id === 'procedural-textures') return procedural();
  if (id === 'wood-texture') return image('wood');
  if (id === 'brick-texture') return image('brick');
  if (id === 'cloth-texture') return image('cloth');
  if (id === 'models-box') return model(models.box, 'BoxAnimated');
  if (id === 'models-cesium') return model(models.cesium, 'CesiumMan');
  if (id === 'models-fox') return model(models.fox, 'Fox');
  if (id === 'lighting') return lighting();
  if (id === 'raycasting') return ray();
  if (id === 'physics') return physics();
  if (id === 'animation' || id === 'asset-manager' || id === 'transparent' || id === 'bounds-input')
    return production(id);
  if (id === 'cameras') return cameras();
  if (id === 'texture') return textureLab();
  if (id === 'postprocess') return postprocessLab();
  // Exhaustive: every ExampleId above is handled, so this is unreachable.
  throw new Error(`No scene registered for example ${id}`);
}
function renderNav() {
  const groups = [...new Set(examples.map((x) => x.group))];
  nav.innerHTML = groups
    .map(
      (g) =>
        '<div class="nav-group"><p>' +
        g +
        '</p>' +
        examples
          .filter((x) => x.group === g)
          .map(
            (x) =>
              '<button class="nav-item ' +
              (x.id === active ? 'active' : '') +
              '" data-id="' +
              x.id +
              '"><span class="nav-dot"></span><span>' +
              x.title +
              '</span></button>',
          )
          .join('') +
        '</div>',
    )
    .join('');
  nav
    .querySelectorAll<HTMLButtonElement>('.nav-item')
    .forEach((b) => (b.onclick = () => select(b.dataset.id as ExampleId)));
}
function select(id: ExampleId) {
  // Scenes may register their own teardown (extra DOM, listeners); run it
  // before the engine goes away so nothing leaks between scenes.
  runtime.dispose?.();
  runtime.controls?.dispose();
  runtime.engine?.dispose();
  viewport.innerHTML = '';
  active = id;
  const m = examples.find((x) => x.id === id)!;
  document.querySelector('#example-group')!.textContent = m.group.toUpperCase();
  document.querySelector('#example-title')!.textContent = m.title;
  document.querySelector('#example-summary')!.textContent = m.summary;
  document.querySelector('#example-hint')!.textContent = m.hint;
  document.querySelector('#scene-index')!.textContent =
    String(examples.indexOf(m) + 1).padStart(2, '0') + ' / ' + String(examples.length).padStart(2, '0');
  status('running');
  renderNav();
  runtime = build(id);
  if (runtime.engine) {
    runtime.engine.start(runtime.update);
    runtime.engine.resize();
  }
}
document.querySelector<HTMLButtonElement>('#reset-camera')!.onclick = () => runtime.controls?.reset();
document.querySelector<HTMLButtonElement>('#next-example')!.onclick = () => {
  const i = examples.findIndex((x) => x.id === active);
  select(examples[(i + 1) % examples.length].id);
};
select(active);
