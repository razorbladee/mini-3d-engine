import {
  BufferAttribute,
  BufferGeometry,
  Euler,
  Frustum,
  Matrix4,
  NullAudioHooks,
  ParticleSystem,
  PerformanceMetrics,
  PhysicsAdapter,
  Quaternion,
  SphereBounds,
  WebGLRenderer,
  WebGPURenderer,
  inspectScene,
  AabbBounds,
  AmbientLight,
  BasicMaterial,
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  ConeGeometry,
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
  ShaderMaterial,
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
import './showcase-metrics.css';
type Runtime = {
  engine?: Engine;
  controls?: OrbitControls;
  update?: (t: { deltaTime: number; elapsed: number }) => void;
  dispose?: () => void;
  stats?: () => string;
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
function addToolbar(actions: Array<{ label: string; run: () => void }>) {
  const bar = document.createElement('div');
  bar.className = 'lab-toolbar';
  for (const action of actions) {
    const button = document.createElement('button');
    button.className = 'lab-control';
    button.textContent = action.label;
    button.onclick = action.run;
    bar.append(button);
  }
  viewport.append(bar);
  return bar;
}
function addPanel(className = '') {
  const panel = document.createElement('pre');
  panel.className = `lab-panel ${className}`.trim();
  viewport.append(panel);
  return panel;
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
  let disposed = false;
  let detail = 'loading';
  new GLTFLoader()
    .load(url)
    .then((m) => {
      if (disposed) return;
      m.scene.position.z = -5;
      s.add(m.scene);
      let meshes = 0;
      m.scene.traverse((node) => {
        if (node instanceof Mesh) meshes += 1;
      });
      r.controls!.focus(new Vector3(0, 0, -5), Math.max(4, Math.min(12, m.bounds.radius * 2.8)));
      detail = `${label} · ${meshes} meshes · radius ${m.bounds.radius.toFixed(2)} · ${m.animations.length} animations`;
      status(detail);
    })
    .catch((e) => {
      if (!disposed) status(e instanceof Error ? e.message : 'model unavailable');
    });
  r.stats = () => detail;
  r.dispose = () => {
    disposed = true;
  };
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
    const controls = addToolbar([
      { label: 'Play loop', run: () => values.play(clip) },
      { label: 'Play once', run: () => values.play(clip, { loop: false }) },
      { label: 'Pause', run: () => values.pause() },
      { label: 'Resume', run: () => values.resume() },
      { label: 'Stop', run: () => values.stop() },
      {
        label: 'Speed ×2',
        run: () => {
          values.timeScale = values.timeScale === 1 ? 2 : 1;
          status(`timeScale ${values.timeScale}×`);
        },
      },
    ]);
    r.update = ({ deltaTime }) => values.update(deltaTime);
    r.stats = () => `clip ${values.playing ? 'playing' : 'paused'} · t ${values.time.toFixed(1)}s`;
    r.dispose = () => controls.remove();
    return r;
  }
  if (id === 'asset-manager') {
    const manager = new AssetManager();
    const tiles = [-1.6, 0, 1.6].map((x) => {
      const tile = new Mesh(new BoxGeometry(1.15), new BasicMaterial({ color: '#df8f56' }));
      tile.position.set(x, 0, -5);
      s.add(tile);
      return tile;
    });
    let loaderCalls = 0;
    let requestCount = 0;
    let disposed = false;
    const loader = async () => {
      loaderCalls += 1;
      await new Promise((resolve) => setTimeout(resolve, 300));
      return '#59c7a5';
    };
    const requestAll = () => {
      requestCount += tiles.length;
      status('loading 3 requests…');
      const requests = tiles.map((tile) =>
        manager
          .load('shared-tile', loader, { onProgress: (p) => status(p.loaded ? 'cache hit / loaded' : 'loading') })
          .then((color) => {
            tile.material.color.set(BasicMaterial.parseColor(color));
          }),
      );
      void Promise.all(requests).then(() => {
        if (!disposed) status(`${loaderCalls} loader call${loaderCalls === 1 ? '' : 's'} · ${requestCount} requests`);
      });
    };
    const controls = addToolbar([
      { label: 'Request ×3', run: requestAll },
      {
        label: 'Clear cache',
        run: () => {
          manager.clear('shared-tile');
          tiles.forEach((tile) => tile.material.color.set(BasicMaterial.parseColor('#df8f56')));
          status('cache cleared');
        },
      },
    ]);
    requestAll();
    r.stats = () => `requests ${requestCount} · loader calls ${loaderCalls} · cache ${manager.size}`;
    r.dispose = () => {
      disposed = true;
      manager.clear();
      controls.remove();
    };
    return r;
  }
  if (id === 'bounds-input') {
    const input = new InputMap();
    r.engine!.track(input);
    const jump = input.bind('jump', ['ArrowUp', ' ']);
    const bounds = new AabbBounds(new Vector3(-2, -1, -6), new Vector3(2, 1, -4));
    const volume = new Mesh(
      new BoxGeometry(1),
      new BasicMaterial({ color: '#8068dc', wireframe: true, transparent: true, opacity: 0.5 }),
    );
    volume.position.set(0, 0, -5);
    volume.scale.set(4, 2, 2);
    const marker = new Mesh(new BoxGeometry(0.65), new BasicMaterial({ color: '#59c7a5' }));
    marker.position.set(0, 0, -5);
    s.add(volume, marker);
    let outside = false;
    r.update = () => {
      if (!jump.wasPressed()) return;
      outside = !outside;
      marker.position.y = outside ? 1.5 : 0;
      const inside = bounds.contains(marker.position);
      marker.material.color.set(BasicMaterial.parseColor(inside ? '#59c7a5' : '#df8f56'));
      status(inside ? 'inside AABB' : 'outside AABB');
    };
    r.dispose = () => {
      r.engine!.untrack(input);
      input.dispose();
    };
    status('inside AABB · press Space or ArrowUp');
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
const forestVertexShader = `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;
uniform mat4 uShadowMatrix;
uniform float uTime;
uniform float uWind;
uniform float uShaderKind;
out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec2 vUv;
out vec4 vShadowPosition;
void main() {
  vec3 local = position;
  if (uWind > 0.0) {
    float leverage = max(local.y + 0.5, 0.0);
    local.x += sin(uTime * 1.7 + uModel[3].x * 0.7 + uModel[3].z * 0.4) * uWind * leverage;
  }
  if (uShaderKind > 1.5 && uShaderKind < 2.5) {
    local.y += (sin(local.x * 5.0 + uTime * 1.4) + cos(local.z * 4.0 + uTime)) * 0.025;
  }
  vec4 world = uModel * vec4(local, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(uNormalMatrix * normal);
  vUv = uv;
  vShadowPosition = uShadowMatrix * world;
  gl_Position = uProjection * uView * world;
}`;

const forestFragmentShader = `#version 300 es
precision highp float;
#define MAX_LIGHTS 4
uniform vec4 uColor;
uniform sampler2D uMap;
uniform int uHasMap;
uniform vec3 uAmbientColor;
uniform int uDirectionalCount;
uniform vec3 uDirectionalColor[MAX_LIGHTS];
uniform vec3 uDirectionalDirection[MAX_LIGHTS];
uniform float uDirectionalIntensity[MAX_LIGHTS];
uniform sampler2D uShadowMap;
uniform int uShadowEnabled;
uniform float uShadowBias;
uniform float uShadowStrength;
uniform float uTime;
uniform float uShaderKind;
in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec2 vUv;
in vec4 vShadowPosition;
out vec4 outColor;

float hash(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
}

float shadowVisibility() {
  if (uShadowEnabled == 0) return 1.0;
  vec3 projected = vShadowPosition.xyz / max(vShadowPosition.w, 0.0001);
  projected = projected * 0.5 + 0.5;
  if (projected.x <= 0.0 || projected.x >= 1.0 || projected.y <= 0.0 || projected.y >= 1.0 || projected.z <= 0.0 || projected.z >= 1.0) return 1.0;
  vec2 texel = 1.0 / vec2(textureSize(uShadowMap, 0));
  float samples = 0.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float depth = texture(uShadowMap, projected.xy + vec2(float(x), float(y)) * texel).r;
      samples += projected.z - uShadowBias <= depth ? 1.0 : 0.0;
    }
  }
  return mix(1.0, samples / 9.0, uShadowStrength);
}

void main() {
  vec2 textureUv = vUv;
  if (uShaderKind < 0.5) textureUv = vWorldPosition.xz * 0.16;
  else if (uShaderKind > 1.5 && uShaderKind < 2.5) textureUv = vWorldPosition.xz * 0.2 + vec2(uTime * 0.015, 0.0);
  else if (uShaderKind > 3.5) textureUv *= 2.4;
  vec4 texel = uHasMap == 1 ? texture(uMap, textureUv) : vec4(1.0);
  vec3 base = uColor.rgb * texel.rgb;
  float alpha = uColor.a * texel.a;
  vec3 normal = normalize(vWorldNormal);
  vec3 lightDirection = uDirectionalCount > 0 ? normalize(-uDirectionalDirection[0]) : vec3(0.4, 1.0, 0.3);
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float toon = floor((diffuse * 0.82 + 0.18) * 4.0) / 3.0;
  float visibility = uShaderKind > 2.5 && uShaderKind < 3.5 ? 1.0 : shadowVisibility();
  vec3 lightColor = uDirectionalCount > 0 ? uDirectionalColor[0] * uDirectionalIntensity[0] : vec3(1.0);
  vec3 lighting = max(uAmbientColor, vec3(0.16)) + lightColor * toon * visibility;

  if (uShaderKind > 0.5 && uShaderKind < 1.5) {
    float leafVariation = hash(floor(vWorldPosition.xz * 2.2));
    base *= mix(0.76, 1.13, leafVariation);
  } else if (uShaderKind > 1.5 && uShaderKind < 2.5) {
    float ripple = sin(vWorldPosition.x * 3.2 + uTime * 1.3) * cos(vWorldPosition.z * 2.7 - uTime);
    base = mix(base * 0.72, vec3(0.36, 0.76, 0.88), ripple * 0.5 + 0.5);
    lighting += vec3(0.14, 0.2, 0.24);
  } else if (uShaderKind > 2.5 && uShaderKind < 3.5) {
    float cloudBand = floor((normal.y * 0.5 + 0.5) * 3.0) / 3.0;
    lighting = vec3(0.72 + cloudBand * 0.3);
  } else if (uShaderKind > 3.5 && uShaderKind < 4.5) {
    base *= 0.82 + hash(floor(vWorldPosition.xz * 1.5)) * 0.24;
  } else if (uShaderKind > 4.5) {
    float rings = step(0.52, fract(length(vWorldPosition.xz) * 3.0));
    base *= mix(0.86, 1.08, rings * 0.2);
  }

  outColor = vec4(clamp(base * lighting, 0.0, 1.0), alpha);
}`;

const cinematicForestVertexShader = `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;
uniform mat4 uShadowMatrix;
uniform float uTime;
uniform float uWind;
uniform float uShaderKind;
out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec2 vUv;
out vec4 vShadowPosition;
void main() {
  vec3 local = position;
  float phase = uModel[3].x * 0.73 + uModel[3].z * 0.41;
  if (uWind > 0.0) {
    float leverage = max(local.y + 0.55, 0.0);
    float breeze = sin(uTime * 1.35 + phase) * 0.65 + sin(uTime * 2.7 + phase * 1.9) * 0.35;
    local.x += breeze * uWind * leverage;
    local.z += cos(uTime * 1.1 + phase * 0.8) * uWind * leverage * 0.35;
  }
  if (uShaderKind > 1.5 && uShaderKind < 2.5) {
    float waveA = sin(local.x * 4.2 + uTime * 1.5);
    float waveB = cos(local.z * 3.7 - uTime * 1.15);
    local.y += (waveA + waveB) * 0.045;
  }
  vec4 world = uModel * vec4(local, 1.0);
  vWorldPosition = world.xyz;
  vWorldNormal = normalize(uNormalMatrix * normal);
  vUv = uv;
  vShadowPosition = uShadowMatrix * world;
  gl_Position = uProjection * uView * world;
}`;

const cinematicForestFragmentShader = `#version 300 es
precision highp float;
#define MAX_LIGHTS 4
uniform vec4 uColor;
uniform sampler2D uMap;
uniform int uHasMap;
uniform sampler2D uDetailMap;
uniform sampler2D uNormalMap;
uniform float uDetailReady;
uniform float uNormalReady;
uniform vec3 uCameraPosition;
uniform vec3 uAmbientColor;
uniform int uDirectionalCount;
uniform vec3 uDirectionalColor[MAX_LIGHTS];
uniform vec3 uDirectionalDirection[MAX_LIGHTS];
uniform float uDirectionalIntensity[MAX_LIGHTS];
uniform sampler2D uShadowMap;
uniform int uShadowEnabled;
uniform float uShadowBias;
uniform float uShadowStrength;
uniform float uTime;
uniform float uShaderKind;
in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec2 vUv;
in vec4 vShadowPosition;
out vec4 outColor;

float hash(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453);
}

vec4 triplanarBase(vec3 position, vec3 normal, float scale) {
  vec3 blend = pow(abs(normal), vec3(4.0));
  blend /= max(blend.x + blend.y + blend.z, 0.0001);
  vec4 xMap = texture(uMap, position.yz * scale);
  vec4 yMap = texture(uMap, position.xz * scale);
  vec4 zMap = texture(uMap, position.xy * scale);
  return xMap * blend.x + yMap * blend.y + zMap * blend.z;
}

float softShadow() {
  if (uShadowEnabled == 0) return 1.0;
  vec3 projected = vShadowPosition.xyz / max(vShadowPosition.w, 0.0001);
  projected = projected * 0.5 + 0.5;
  if (projected.x <= 0.0 || projected.x >= 1.0 || projected.y <= 0.0 || projected.y >= 1.0 || projected.z <= 0.0 || projected.z >= 1.0) return 1.0;
  vec2 texel = 1.0 / vec2(textureSize(uShadowMap, 0));
  float result = 0.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      float closest = texture(uShadowMap, projected.xy + vec2(float(x), float(y)) * texel).r;
      result += projected.z - uShadowBias <= closest ? 1.0 : 0.0;
    }
  }
  return mix(1.0, result / 9.0, uShadowStrength);
}

void main() {
  vec3 geometricNormal = normalize(vWorldNormal);
  bool terrain = uShaderKind < 0.5;
  bool foliage = uShaderKind > 0.5 && uShaderKind < 1.5;
  bool water = uShaderKind > 1.5 && uShaderKind < 2.5;
  bool cloud = uShaderKind > 2.5 && uShaderKind < 3.5;
  bool rock = uShaderKind > 3.5 && uShaderKind < 4.5;
  bool wood = uShaderKind > 4.5;

  vec4 texel = vec4(1.0);
  if (uHasMap == 1) {
    if (terrain) texel = triplanarBase(vWorldPosition, geometricNormal, 0.18);
    else if (rock) texel = triplanarBase(vWorldPosition, geometricNormal, 0.42);
    else {
      vec2 uv = vUv;
      if (water) uv = vWorldPosition.xz * 0.18 + vec2(uTime * 0.018, -uTime * 0.01);
      else if (wood) uv *= vec2(2.8, 1.6);
      texel = texture(uMap, uv);
    }
  }

  vec3 normal = geometricNormal;
  if (water) {
    vec2 flowA = vWorldPosition.xz * 0.22 + vec2(uTime * 0.025, uTime * 0.012);
    vec2 flowB = vWorldPosition.zx * 0.31 + vec2(-uTime * 0.018, uTime * 0.02);
    vec3 waves = uNormalReady > 0.5
      ? texture(uNormalMap, flowA).xyz + texture(uNormalMap, flowB).xyz - 1.0
      : vec3(sin(flowA.x * 8.0), 1.0, cos(flowB.y * 7.0));
    normal = normalize(vec3(waves.x * 0.42, 1.0, waves.z * 0.42));
  }

  vec3 base = uColor.rgb * texel.rgb;
  float alpha = uColor.a * texel.a;
  float detail = uDetailReady > 0.5 ? texture(uDetailMap, vWorldPosition.xz * 0.32).r : hash(vWorldPosition.xz);
  if (terrain) {
    float slope = 1.0 - max(geometricNormal.y, 0.0);
    base *= mix(vec3(0.82 + detail * 0.28), vec3(0.62, 0.58, 0.48), slope * 0.55);
  } else if (foliage) {
    base *= 0.8 + detail * 0.35;
  } else if (rock) {
    base *= 0.72 + detail * 0.42;
  } else if (wood) {
    float rings = sin((vWorldPosition.y + length(vWorldPosition.xz) * 0.3) * 18.0) * 0.5 + 0.5;
    base *= 0.88 + rings * 0.14;
  }

  vec3 lightDirection = uDirectionalCount > 0 ? normalize(-uDirectionalDirection[0]) : normalize(vec3(0.5, 1.0, 0.35));
  vec3 lightColor = uDirectionalCount > 0 ? uDirectionalColor[0] * uDirectionalIntensity[0] : vec3(1.0);
  vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
  float diffuse = max(dot(normal, lightDirection), 0.0);
  float visibility = cloud ? 1.0 : softShadow();
  float halfLambert = diffuse * 0.72 + 0.28;
  vec3 lighting = max(uAmbientColor, vec3(0.12)) + lightColor * halfLambert * visibility;

  if (foliage) {
    float transmission = pow(max(dot(-normal, lightDirection), 0.0), 2.0);
    lighting += vec3(0.2, 0.38, 0.12) * transmission;
  }
  if (water) {
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float sparkle = pow(max(dot(normal, halfVector), 0.0), 72.0) * visibility;
    vec3 deepWater = vec3(0.035, 0.22, 0.32);
    vec3 reflectedSky = vec3(0.46, 0.72, 0.88);
    base = mix(deepWater, reflectedSky, fresnel * 0.82 + detail * 0.08) + sparkle * vec3(1.0, 0.9, 0.68);
    lighting = vec3(1.0);
    alpha = mix(0.78, 0.94, fresnel);
  }
  if (cloud) {
    float rim = pow(1.0 - max(dot(geometricNormal, viewDirection), 0.0), 2.0);
    float billow = 0.82 + detail * 0.2;
    base = mix(vec3(0.72, 0.78, 0.84), vec3(1.0, 0.98, 0.9), max(geometricNormal.y, 0.0)) * billow;
    lighting = vec3(1.0) + rim * vec3(0.18, 0.22, 0.3);
    alpha *= 0.78 + detail * 0.2;
  }

  vec3 color = base * lighting;
  float distanceToCamera = length(uCameraPosition - vWorldPosition);
  float fog = smoothstep(18.0, 42.0, distanceToCamera);
  color = mix(color, vec3(0.48, 0.64, 0.76), fog * 0.62);
  color = color / (color + vec3(1.0));
  color = pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
  outColor = vec4(clamp(color, 0.0, 1.0), alpha);
}`;

const cinematicSkyVertexShader = `#version 300 es
in vec3 position;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vSkyDirection;
void main() {
  vSkyDirection = position;
  vec4 clip = uProjection * uView * uModel * vec4(position, 1.0);
  gl_Position = vec4(clip.xy, clip.w * 0.9995, clip.w);
}`;

const cinematicSkyFragmentShader = `#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uSunDirection;
in vec3 vSkyDirection;
out vec4 outColor;

float noise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  local = local * local * (3.0 - 2.0 * local);
  float a = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
  float b = fract(sin(dot(cell + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
  float c = fract(sin(dot(cell + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
  float d = fract(sin(dot(cell + vec2(1.0), vec2(127.1, 311.7))) * 43758.5453);
  return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
}

void main() {
  vec3 direction = normalize(vSkyDirection);
  float height = direction.y * 0.5 + 0.5;
  vec3 horizon = vec3(0.62, 0.76, 0.84);
  vec3 zenith = vec3(0.08, 0.24, 0.46);
  vec3 color = mix(horizon, zenith, smoothstep(0.25, 0.95, height));
  float sunset = pow(1.0 - abs(direction.y), 6.0);
  color += vec3(0.32, 0.17, 0.08) * sunset;

  float sunDot = max(dot(direction, normalize(uSunDirection)), 0.0);
  color += vec3(1.0, 0.72, 0.32) * pow(sunDot, 28.0) * 0.55;
  color += vec3(1.0, 0.93, 0.72) * pow(sunDot, 320.0) * 2.4;

  vec2 cloudUv = direction.xz / max(direction.y + 0.42, 0.12) * 1.7;
  cloudUv += vec2(uTime * 0.006, -uTime * 0.003);
  float clouds = noise(cloudUv) * 0.62 + noise(cloudUv * 2.1 + 7.0) * 0.28 + noise(cloudUv * 4.3) * 0.1;
  clouds = smoothstep(0.56, 0.72, clouds) * smoothstep(0.05, 0.4, direction.y);
  color = mix(color, vec3(0.9, 0.93, 0.94), clouds * 0.42);

  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}`;

type ForestMaterialOptions = {
  color: string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  doubleSided?: boolean;
};

function lowPolyForest(mode: 'standard' | 'shader' | 'textured' | 'cinematic' = 'standard'): Runtime {
  const shaderMode = mode !== 'standard';
  const enhancedMode = mode === 'cinematic';
  const texturedMode = mode === 'textured' || enhancedMode;
  const r = three();
  const engine = r.engine!;
  const scene = engine.scene;
  const shaderMaterials: ShaderMaterial[] = [];
  const materialsByKind = new Map<number, BasicMaterial[]>();
  const forestMaterial = (options: ForestMaterialOptions, shaderKind = 0, wind = 0, unlit = false) => {
    const materialOptions = texturedMode ? { ...options, color: '#ffffff' } : options;
    const material = shaderMode
      ? new ShaderMaterial({
          ...materialOptions,
          vertexShader: enhancedMode ? cinematicForestVertexShader : forestVertexShader,
          fragmentShader: enhancedMode ? cinematicForestFragmentShader : forestFragmentShader,
          lights: true,
          uniforms: {
            uTime: 0,
            uWind: wind,
            uShaderKind: shaderKind,
            ...(enhancedMode ? { uDetailReady: 0, uNormalReady: 0 } : {}),
          },
        })
      : unlit
        ? new BasicMaterial(materialOptions)
        : new StandardMaterial(materialOptions);
    if (material instanceof ShaderMaterial) shaderMaterials.push(material);
    const group = materialsByKind.get(shaderKind) ?? [];
    group.push(material);
    materialsByKind.set(shaderKind, group);
    return material;
  };
  (engine.renderer as WebGLRenderer).setClearColor(
    enhancedMode ? '#6f94b5' : texturedMode ? '#82b5cb' : shaderMode ? '#735fa3' : '#8fc4dc',
  );
  r.controls!.focus(new Vector3(0, 1.1, -4), 19);

  const ambient = new AmbientLight('#dff2df', 0.16);
  const sky = new HemisphereLight('#d8efff', 0.38);
  sky.groundColor = '#566a3d';
  const sun = new DirectionalLight('#fff0bd', 1.65);
  sun.direction.set(-0.55, -1, -0.35);
  sun.castShadow = true;
  sun.shadowMapSize = 2048;
  sun.shadowSize = 30;
  sun.shadowDistance = 32;
  sun.shadowBias = 0.0022;
  sun.shadowStrength = 0.86;
  sun.shadowCenter.set(0, 1.5, -4);
  scene.add(ambient, sky, sun);

  let atmosphereDome: Mesh | null = null;
  let atmosphereMaterial: ShaderMaterial | null = null;
  if (enhancedMode) {
    atmosphereMaterial = new ShaderMaterial({
      vertexShader: cinematicSkyVertexShader,
      fragmentShader: cinematicSkyFragmentShader,
      doubleSided: true,
      uniforms: {
        uTime: 0,
        uSunDirection: new Float32Array([0.46, 0.83, 0.3]),
      },
    });
    atmosphereDome = new Mesh(new SphereGeometry(1, 32, 16), atmosphereMaterial);
    atmosphereDome.name = 'Procedural atmosphere dome';
    atmosphereDome.scale.setScalar(60);
    atmosphereDome.castShadow = false;
    atmosphereDome.receiveShadow = false;
    scene.add(atmosphereDome);
  }

  const pondX = 3.2;
  const pondZ = -4.2;
  const terrainHeight = (x: number, z: number) => {
    const pondDistance = Math.hypot((x - pondX) / 3.1, (z - pondZ) / 2.15);
    if (pondDistance < 1.15) return -0.48 + Math.max(0, pondDistance - 0.78) * 0.3;
    return Math.sin(x * 0.38) * 0.34 + Math.cos(z * 0.29) * 0.26 + Math.sin((x + z) * 0.21) * 0.16;
  };

  const terrainPositions: number[] = [];
  const cells = 16;
  const step = 1.4;
  const start = (-cells * step) / 2;
  const point = (column: number, row: number) => {
    const x = start + column * step;
    const z = -4 + start + row * step;
    return [x, terrainHeight(x, z), z] as const;
  };
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const a = point(column, row);
      const b = point(column, row + 1);
      const c = point(column + 1, row + 1);
      const d = point(column + 1, row);
      terrainPositions.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  const terrain = new Mesh(
    new BufferGeometry(terrainPositions),
    forestMaterial({ color: '#789a4c', roughness: 0.96, metalness: 0 }, 0),
  );
  terrain.name = 'Faceted rolling terrain';
  scene.add(terrain);

  const water = new Mesh(
    new CylinderGeometry(1, 0.08, 18),
    forestMaterial({ color: '#4d9db4', roughness: 0.18, metalness: 0.08, transparent: true, opacity: 0.82 }, 2),
  );
  water.name = 'Low-poly pond';
  water.position.set(pondX, -0.35, pondZ);
  water.scale.set(3.05, 1, 2.05);
  scene.add(water);

  const trunkGeometry = new CylinderGeometry(0.16, 1, 6);
  const crownGeometry = new ConeGeometry(1, 1, 7);
  const trunkMaterial = forestMaterial({ color: '#76513a', roughness: 0.92 }, 5);
  const crownMaterials = [
    forestMaterial({ color: '#315f3d', roughness: 0.9 }, 1, 0.045),
    forestMaterial({ color: '#477b43', roughness: 0.88 }, 1, 0.045),
    forestMaterial({ color: '#5b8a45', roughness: 0.86 }, 1, 0.045),
  ];
  const treePositions = [
    [-8.4, -9.5],
    [-6.7, -6.4],
    [-8.8, -2.1],
    [-6.2, 1.4],
    [-3.8, -10.4],
    [-3.1, -5.6],
    [-4.4, -0.8],
    [-1.2, -8.2],
    [-0.5, -2.2],
    [1.2, 1.8],
    [4.8, -9.6],
    [7.2, -7.2],
    [7.9, -2.5],
    [5.8, 0.5],
    [9.2, 2.8],
  ] as const;
  const trees: Node[] = [];
  treePositions.forEach(([x, z], index) => {
    const tree = new Node();
    tree.name = `Tree ${index + 1}`;
    tree.position.set(x, terrainHeight(x, z), z);
    const trunkHeight = 1.55 + (index % 4) * 0.18;
    const trunk = new Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = trunkHeight / 2;
    trunk.scale.y = trunkHeight;
    const lower = new Mesh(crownGeometry, crownMaterials[index % crownMaterials.length]);
    lower.position.y = trunkHeight + 0.65;
    lower.scale.set(1.15 + (index % 3) * 0.08, 1.85, 1.15 + (index % 3) * 0.08);
    const upper = new Mesh(crownGeometry, crownMaterials[(index + 1) % crownMaterials.length]);
    upper.position.y = trunkHeight + 1.55;
    upper.scale.set(0.78, 1.45, 0.78);
    tree.add(trunk, lower, upper);
    scene.add(tree);
    trees.push(tree);
  });

  const grassGeometry = new BufferGeometry([-0.08, 0, 0, 0.08, 0, 0, 0, 0.55, 0, 0, 0, -0.08, 0, 0, 0.08, 0, 0.48, 0]);
  const grassMaterial = forestMaterial({ color: '#88a94e', roughness: 1, doubleSided: true }, 1, 0.16);
  let seed = 1357;
  const random = () => ((seed = (seed * 48271) % 2147483647) - 1) / 2147483646;
  const grasses: Mesh[] = [];
  while (grasses.length < 34) {
    const x = (random() - 0.5) * 20;
    const z = -4 + (random() - 0.5) * 20;
    if (Math.hypot((x - pondX) / 3.3, (z - pondZ) / 2.4) < 1.25) continue;
    const grass = new Mesh(grassGeometry, grassMaterial);
    grass.position.set(x, terrainHeight(x, z) + 0.02, z);
    grass.rotation.y = random() * Math.PI;
    grass.scale.setScalar(0.7 + random() * 0.65);
    scene.add(grass);
    grasses.push(grass);
  }

  const shrubGeometry = new SphereGeometry(0.62, 7, 4);
  const shrubMaterials = [
    forestMaterial({ color: '#426f3d', roughness: 0.96 }, 1, 0.075),
    forestMaterial({ color: '#527f42', roughness: 0.96 }, 1, 0.075),
  ];
  const shrubPositions = [
    [-7.5, -11.2],
    [-5.4, -3.7],
    [-2.4, -11.5],
    [-1.8, 0.6],
    [2.1, -9.7],
    [4.8, -0.9],
    [8.7, -5.8],
    [7.1, 2.5],
  ] as const;
  const shrubs = shrubPositions.map(([x, z], index) => {
    const shrub = new Node();
    shrub.name = `Shrub ${index + 1}`;
    shrub.position.set(x, terrainHeight(x, z), z);
    [
      [-0.38, 0.35, 0, 0.82],
      [0.32, 0.42, 0.08, 0.96],
      [0, 0.58, -0.24, 0.72],
    ].forEach(([px, py, pz, scale], puffIndex) => {
      const puff = new Mesh(shrubGeometry, shrubMaterials[(index + puffIndex) % shrubMaterials.length]);
      puff.position.set(px, py, pz);
      puff.scale.set(scale, scale * 0.8, scale);
      shrub.add(puff);
    });
    scene.add(shrub);
    return shrub;
  });

  const barkMaterial = forestMaterial({ color: '#684633', roughness: 0.98 }, 5);
  const cutWoodMaterial = forestMaterial({ color: '#bd925e', roughness: 0.92 }, 5);
  const logGeometry = new CylinderGeometry(0.26, 2.4, 8);
  const logCapGeometry = new CylinderGeometry(0.265, 0.035, 8);
  const logs: Node[] = [];
  const addLog = (x: number, z: number, alongX: boolean) => {
    const log = new Node();
    log.name = `Fallen log ${logs.length + 1}`;
    const y = terrainHeight(x, z) + 0.3;
    const body = new Mesh(logGeometry, barkMaterial);
    if (alongX) body.rotation.z = Math.PI / 2;
    else body.rotation.x = Math.PI / 2;
    log.position.set(x, y, z);
    log.add(body);
    for (const side of [-1, 1]) {
      const cap = new Mesh(logCapGeometry, cutWoodMaterial);
      if (alongX) {
        cap.rotation.z = Math.PI / 2;
        cap.position.x = side * 1.2;
      } else {
        cap.rotation.x = Math.PI / 2;
        cap.position.z = side * 1.2;
      }
      log.add(cap);
    }
    scene.add(log);
    logs.push(log);
  };
  addLog(-2.2, -12.4, true);
  addLog(5.7, 1.9, false);

  const stumpGeometry = new CylinderGeometry(0.34, 1, 8);
  const stumpTopGeometry = new CylinderGeometry(0.345, 0.035, 8);
  const stumps = [
    [-6.9, -0.1, 0.72],
    [0.7, -11.4, 0.58],
    [6.1, -7.9, 0.82],
    [8.6, 0.1, 0.64],
  ].map(([x, z, height], index) => {
    const stump = new Node();
    stump.name = `Stump ${index + 1}`;
    const ground = terrainHeight(x, z);
    stump.position.set(x, ground, z);
    const trunk = new Mesh(stumpGeometry, barkMaterial);
    trunk.position.y = height / 2;
    trunk.scale.y = height;
    const top = new Mesh(stumpTopGeometry, cutWoodMaterial);
    top.position.y = height + 0.018;
    stump.add(trunk, top);
    scene.add(stump);
    return stump;
  });

  const cliffGeometry = new SphereGeometry(1, 7, 4);
  const cliffMaterials = [
    forestMaterial({ color: '#686f68', roughness: 0.98 }, 4),
    forestMaterial({ color: '#7c8175', roughness: 0.98 }, 4),
    forestMaterial({ color: '#59645c', roughness: 0.98 }, 4),
  ];
  const cliffOrigin = new Vector3(8.2, 0, -11.7);
  const cliffPieces = [
    [-1.4, 0.8, 0.1, 1.35, 1.8, 1.1],
    [0, 1.15, 0, 1.55, 2.5, 1.35],
    [1.35, 0.72, 0.25, 1.1, 1.5, 1.25],
    [-0.65, 1.75, -0.15, 0.95, 1.55, 0.9],
    [0.7, 2.05, -0.2, 0.82, 1.5, 0.78],
    [0.1, 2.85, -0.35, 0.62, 1.05, 0.58],
  ] as const;
  const cliffs = cliffPieces.map(([x, y, z, sx, sy, sz], index) => {
    const rock = new Mesh(cliffGeometry, cliffMaterials[index % cliffMaterials.length]);
    rock.name = `Rock formation ${index + 1}`;
    const worldX = cliffOrigin.x + x;
    const worldZ = cliffOrigin.z + z;
    rock.position.set(worldX, terrainHeight(worldX, worldZ) + y, worldZ);
    rock.scale.set(sx, sy, sz);
    rock.rotation.y = index * 0.73;
    scene.add(rock);
    return rock;
  });

  const rockGeometry = new SphereGeometry(0.42, 7, 4);
  const rockMaterial = forestMaterial({ color: '#7b7f72', roughness: 0.98 }, 4);
  for (let index = 0; index < 11; index += 1) {
    const angle = (index / 11) * Math.PI * 2;
    const x = pondX + Math.cos(angle) * 3.15;
    const z = pondZ + Math.sin(angle) * 2.12;
    const rock = new Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, terrainHeight(x, z) + 0.18, z);
    rock.scale.set(0.75 + (index % 3) * 0.16, 0.45 + (index % 2) * 0.12, 0.65 + (index % 4) * 0.1);
    rock.rotation.y = angle;
    scene.add(rock);
  }

  const cloudGeometry = new SphereGeometry(1, 8, 4);
  const cloudMaterial = forestMaterial({ color: '#f3f4e8', transparent: true, opacity: 0.9 }, 3, 0, true);
  const clouds = [
    [-7, 6.4, -8],
    [0.5, 7.2, -11],
    [7.5, 6.7, -5],
  ].map(([x, y, z], cloudIndex) => {
    const cloud = new Node();
    cloud.name = `Cloud ${cloudIndex + 1}`;
    cloud.position.set(x, y, z);
    [
      [-0.9, 0, 0, 1.15],
      [0, 0.25, 0, 1.35],
      [1.05, -0.05, 0, 0.95],
    ].forEach(([px, py, pz, scale]) => {
      const puff = new Mesh(cloudGeometry, cloudMaterial);
      puff.position.set(px, py, pz);
      puff.scale.set(scale, scale * 0.62, scale * 0.75);
      cloud.add(puff);
    });
    scene.add(cloud);
    return cloud;
  });

  let disposed = false;
  let loadedTextures = 0;
  const totalTextures = enhancedMode ? 8 : 6;
  const reportTextureProgress = () =>
    status(
      `${enhancedMode ? 'cinematic shaders' : 'shader + textures'} · ${loadedTextures}/${totalTextures} maps loaded`,
    );
  if (texturedMode) {
    const textureSources = new Map<number, string>([
      [
        0,
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/terrain/grasslight-big.jpg',
      ],
      [
        1,
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/minecraft/grass.png',
      ],
      [
        2,
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/water.jpg',
      ],
      [
        3,
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/planets/earth_clouds_1024.png',
      ],
      [
        4,
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/minecraft/dirt.png',
      ],
      [
        5,
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/hardwood2_diffuse.jpg',
      ],
    ]);
    status(`loading ${totalTextures} web textures…`);
    for (const [kind, url] of textureSources) {
      void Texture2D.load(url, {
        wrapS: 'repeat',
        wrapT: 'repeat',
        generateMipmaps: true,
        anisotropy: enhancedMode ? 8 : 2,
      })
        .then((loaded) => {
          if (disposed) return;
          for (const material of materialsByKind.get(kind) ?? []) material.map = loaded;
          loadedTextures += 1;
          reportTextureProgress();
        })
        .catch(() => {
          if (!disposed) status(`texture ${kind} unavailable · color fallback active`);
        });
    }
    if (enhancedMode) {
      const loadAuxiliary = (url: string, apply: (texture: Texture2D) => void) =>
        Texture2D.load(url, { wrapS: 'repeat', wrapT: 'repeat', generateMipmaps: true, anisotropy: 8 })
          .then((loaded) => {
            if (disposed) return;
            apply(loaded);
            loadedTextures += 1;
            reportTextureProgress();
          })
          .catch(() => {
            if (!disposed) status('detail texture unavailable · procedural fallback active');
          });
      void loadAuxiliary(
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/perlin-512.png',
        (detail) => {
          for (const material of shaderMaterials) {
            material.uniforms.uDetailMap = detail;
            material.uniforms.uDetailReady = 1;
          }
        },
      );
      void loadAuxiliary(
        'https://raw.githubusercontent.com/mrdoob/three.js/3cc8908cad65fe9a75c4fcf29c4f897c593443d5/examples/textures/waternormals.jpg',
        (normalMap) => {
          for (const material of materialsByKind.get(2) ?? [])
            if (material instanceof ShaderMaterial) {
              material.uniforms.uNormalMap = normalMap;
              material.uniforms.uNormalReady = 1;
            }
        },
      );
    }
  }

  const controls = addToolbar([
    {
      label: 'Toggle shadows',
      run: () => {
        sun.castShadow = !sun.castShadow;
        status(`directional shadows ${sun.castShadow ? 'on' : 'off'}`);
      },
    },
  ]);
  r.update = ({ deltaTime, elapsed }) => {
    for (const material of shaderMaterials) material.uniforms.uTime = elapsed;
    if (atmosphereDome && atmosphereMaterial) {
      atmosphereDome.position.copy(engine.camera.position);
      atmosphereMaterial.uniforms.uTime = elapsed;
    }
    water.position.y = -0.35 + Math.sin(elapsed * 0.8) * 0.015;
    clouds.forEach((cloud, index) => {
      cloud.position.x += deltaTime * 0.09 * (index + 1);
      if (cloud.position.x > 12) cloud.position.x = -12;
    });
  };
  r.stats = () =>
    `${enhancedMode ? `cinematic GLSL + textures ${loadedTextures}/${totalTextures}` : texturedMode ? `shader + web textures ${loadedTextures}/${totalTextures}` : shaderMode ? `custom GLSL ${shaderMaterials.length} materials` : 'standard materials'} · shadows ${sun.castShadow ? '2048² PCF' : 'off'} · trees ${trees.length} · shrubs ${shrubs.length} · logs ${logs.length} · stumps ${stumps.length} · cliffs ${cliffs.length} · grass ${grasses.length} · clouds ${clouds.length}`;
  r.dispose = () => {
    disposed = true;
    controls.remove();
  };
  if (!texturedMode)
    status(
      shaderMode
        ? 'shader forest · toon light, wind and water GLSL'
        : 'procedural low-poly world · directional shadows on',
    );
  return r;
}
function customGeometry(): Runtime {
  const positions = [
    -1, -1, 1, 1, -1, 1, 0, 1, 0, 1, -1, 1, 1, -1, -1, 0, 1, 0, 1, -1, -1, -1, -1, -1, 0, 1, 0, -1, -1, -1, -1, -1, 1,
    0, 1, 0, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1,
  ];
  let geometry = new BufferGeometry(positions);
  const position = new BufferAttribute(geometry.positions, 3);
  const mesh = new Mesh(geometry, mat('#df8f56', 0.28, 0.25));
  mesh.position.z = -5;
  const r = scene3D([mesh]);
  const panel = addPanel();
  let flattened = false;
  const describe = () => {
    panel.textContent = `position: ${position.count} × ${position.itemSize}\nnormal: ${geometry.attributes.normal.count} × 3\nuv: ${geometry.attributes.uv.count} × 2\nradius: ${geometry.boundingRadius.toFixed(2)}`;
  };
  const controls = addToolbar([
    {
      label: 'Replace vertex data',
      run: () => {
        flattened = !flattened;
        const next = positions.map((value, index) => (index % 3 === 1 && value > 0 ? (flattened ? 0.25 : 1) : value));
        geometry = new BufferGeometry(next);
        mesh.geometry = geometry;
        describe();
      },
    },
  ]);
  describe();
  r.update = ({ elapsed }) => {
    mesh.rotation.y = elapsed * 0.4;
  };
  r.stats = () => `custom vertices ${geometry.vertexCount} · ${flattened ? 'flattened' : 'pyramid'}`;
  r.dispose = () => {
    panel.remove();
    controls.remove();
  };
  return r;
}
function materialFlags(): Runtime {
  const materials = [
    new BasicMaterial({ color: '#8068dc' }),
    new BasicMaterial({ color: '#df8f56', wireframe: true }),
    new BasicMaterial({ color: '#59c7a5', doubleSided: true }),
    new BasicMaterial({ color: '#e19bc9', transparent: true, opacity: 0.42 }),
  ];
  const meshes = materials.map((material, i) => {
    const mesh = new Mesh(i === 2 ? new PlaneGeometry(1.5, 1.5) : new TorusGeometry(0.7, 0.25, 24, 12), material);
    mesh.position.set((i - 1.5) * 1.65, 0, -5.5);
    return mesh;
  });
  const r = scene3D(meshes);
  const panel = addPanel();
  panel.textContent = 'left → right\nBasic unlit\nWireframe\nDouble-sided plane\nTransparent';
  r.update = ({ elapsed }) => meshes.forEach((mesh, i) => (mesh.rotation.y = elapsed * (0.25 + i * 0.08)));
  r.stats = () => 'unlit · wireframe · double-sided · alpha';
  r.dispose = () => panel.remove();
  return r;
}
function transformLab(): Runtime {
  const r = three();
  studio(r.engine!.scene);
  const eulerNode = new Mesh(new BoxGeometry(1), mat('#8068dc'));
  const quaternionNode = new Mesh(new BoxGeometry(1), mat('#df8f56'));
  const matrixNode = new Mesh(new BoxGeometry(1), mat('#59c7a5'));
  eulerNode.position.set(-1.8, 0, -5);
  quaternionNode.position.set(0, 0, -5);
  matrixNode.matrixOverride = new Matrix4().elements;
  r.engine!.scene.add(eulerNode, quaternionNode, matrixNode);
  const q = new Quaternion();
  const matrix = new Matrix4();
  const panel = addPanel();
  panel.textContent = 'purple: Euler\norange: Quaternion\ngreen: Matrix4 override';
  r.update = ({ elapsed }) => {
    eulerNode.rotation.set(elapsed * 0.3, elapsed * 0.6, 0);
    q.setFromAxisAngle(new Vector3(0, 1, 0), elapsed * 0.6);
    quaternionNode.setRotationFromQuaternion(q.x, q.y, q.z, q.w);
    matrix.compose(new Vector3(1.8, 0, -5), new Vector3(1, 1, 1), new Euler(elapsed * 0.3, elapsed * 0.6, 0));
    matrixNode.matrixOverride = matrix.elements;
  };
  r.stats = () => 'Euler · Quaternion · Matrix4';
  r.dispose = () => panel.remove();
  return r;
}
function frustumCulling(): Runtime {
  const r = three();
  const frustum = new Frustum();
  const geometry = new SphereGeometry(0.34, 14, 10);
  const objects = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    const mesh = new Mesh(geometry, new BasicMaterial({ color: '#59c7a5' }));
    mesh.position.set(Math.cos(angle) * 6, Math.sin(angle * 2) * 2.2, -6 + Math.sin(angle) * 5);
    r.engine!.scene.add(mesh);
    return mesh;
  });
  const probe = new Vector3(0, 0, -5);
  let visible = 0;
  let pointInside = false;
  r.update = () => {
    r.engine!.camera.updateViewMatrix();
    frustum.setFromCamera(r.engine!.camera);
    pointInside = frustum.intersectsPoint(probe);
    visible = 0;
    for (const mesh of objects) {
      const inside = frustum.intersectsSphere(new SphereBounds(mesh.position, geometry.boundingRadius));
      mesh.material.color.set(BasicMaterial.parseColor(inside ? '#59c7a5' : '#653c55'));
      if (inside) visible += 1;
    }
    status(`${visible}/${objects.length} spheres · probe point ${pointInside ? 'inside' : 'outside'}`);
  };
  r.stats = () => `frustum spheres ${visible}/${objects.length} · point ${pointInside ? 'in' : 'out'}`;
  return r;
}
function particles(): Runtime {
  const r = three();
  const system = new ParticleSystem(96, new Vector3(0, -4.5, 0));
  const geometry = new SphereGeometry(0.09, 8, 6);
  const views = Array.from({ length: system.maxParticles }, () => {
    const mesh = new Mesh(geometry, new BasicMaterial({ color: '#df8f56' }));
    mesh.visible = false;
    r.engine!.scene.add(mesh);
    return mesh;
  });
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const burst = () => {
    for (let i = 0; i < 24; i += 1)
      system.emit(
        new Vector3(0, -0.8, -5),
        new Vector3((random() - 0.5) * 3, 2.5 + random() * 3, (random() - 0.5) * 2),
        1.5 + random(),
      );
  };
  burst();
  const controls = addToolbar([
    { label: 'Emit burst', run: burst },
    { label: 'Clear', run: () => system.clear() },
  ]);
  let timer = 0;
  r.update = ({ deltaTime }) => {
    timer += deltaTime;
    if (timer > 0.12) {
      timer = 0;
      system.emit(new Vector3(0, -0.8, -5), new Vector3((random() - 0.5) * 2, 4 + random(), 0), 2);
    }
    system.update(deltaTime);
    views.forEach((view, i) => {
      const particle = system.particles[i];
      view.visible = Boolean(particle);
      if (particle) view.position.copy(particle.position);
    });
  };
  r.stats = () => `particles ${system.particles.length}/${system.maxParticles}`;
  r.dispose = () => controls.remove();
  return r;
}
function performanceLab(): Runtime {
  const r = three();
  studio(r.engine!.scene);
  const geometry = new BoxGeometry(0.28);
  const material = new StandardMaterial({ color: '#8068dc', roughness: 0.45 });
  const meshes = Array.from({ length: 180 }, (_, i) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(((i % 15) - 7) * 0.42, (Math.floor(i / 15) - 5.5) * 0.42, -6 - (i % 3) * 0.2);
    r.engine!.scene.add(mesh);
    return mesh;
  });
  let stressed = true;
  const controls = addToolbar([
    {
      label: 'Toggle 180 meshes',
      run: () => {
        stressed = !stressed;
        meshes.forEach((mesh) => (mesh.visible = stressed));
      },
    },
  ]);
  r.update = ({ elapsed }) => meshes.forEach((mesh, i) => (mesh.rotation.y = elapsed * 0.2 + i * 0.03));
  r.stats = () => `workload ${stressed ? 180 : 0} meshes`;
  r.dispose = () => controls.remove();
  return r;
}
function inspectorLab(): Runtime {
  const r = three();
  studio(r.engine!.scene);
  r.engine!.scene.name = 'Inspector scene';
  const rig = new Node();
  rig.name = 'Orbit rig';
  const meshes = ['Alpha', 'Beta', 'Gamma'].map((name, i) => {
    const mesh = new Mesh(new BoxGeometry(0.7), mat(['#8068dc', '#df8f56', '#59c7a5'][i]));
    mesh.name = name;
    mesh.position.set((i - 1) * 1.3, 0, -5);
    rig.add(mesh);
    return mesh;
  });
  r.engine!.scene.add(rig);
  const panel = addPanel('inspector-panel');
  let attached = true;
  const controls = addToolbar([
    { label: 'Toggle Beta', run: () => (meshes[1].visible = !meshes[1].visible) },
    {
      label: 'Add / remove rig',
      run: () => {
        if (attached) r.engine!.scene.remove(rig);
        else r.engine!.scene.add(rig);
        attached = !attached;
      },
    },
  ]);
  let elapsedSinceSnapshot = 1;
  r.update = ({ deltaTime, elapsed }) => {
    rig.rotation.y = Math.sin(elapsed * 0.4) * 0.25;
    elapsedSinceSnapshot += deltaTime;
    if (elapsedSinceSnapshot > 0.25) {
      elapsedSinceSnapshot = 0;
      panel.textContent = JSON.stringify(inspectScene(r.engine!.scene), null, 2);
    }
  };
  r.stats = () => `snapshot nodes ${meshes.length + 2}`;
  r.dispose = () => {
    panel.remove();
    controls.remove();
  };
  return r;
}
function resourceLifecycle(): Runtime {
  const r = three();
  const renderer = r.engine!.renderer as WebGLRenderer;
  const shared = new BoxGeometry(0.9);
  let sharedTexture: Texture2D | undefined;
  let disposed = false;
  const meshes = [-1.3, 0, 1.3].map((x) => {
    const mesh = new Mesh(shared, new BasicMaterial({ color: '#ffffff' }));
    mesh.position.set(x, 0, -5);
    r.engine!.scene.add(mesh);
    return mesh;
  });
  const controls = addToolbar([
    {
      label: 'Release shared geometry',
      run: () => {
        renderer.releaseGeometry(shared);
        status('geometry released; next frame uploads once again');
      },
    },
    {
      label: 'Release shared texture',
      run: () => {
        if (sharedTexture) renderer.releaseTexture(sharedTexture);
        status('texture released; next frame uploads once again');
      },
    },
  ]);
  void texture('checker').then((loaded) => {
    if (disposed) return;
    sharedTexture = loaded;
    meshes.forEach((mesh) => (mesh.material.map = loaded));
  });
  r.update = ({ elapsed }) => meshes.forEach((mesh, i) => (mesh.rotation.y = elapsed * 0.35 + i));
  r.stats = () => {
    const gpu = renderer.resourceStats;
    return `GPU geometry ${gpu.geometries} · textures ${gpu.textures} · programs ${gpu.programs}`;
  };
  r.dispose = () => {
    disposed = true;
    controls.remove();
  };
  return r;
}
function inputActions(): Runtime {
  const r = three();
  const input = new InputMap();
  r.engine!.track(input);
  const left = input.bind('left', ['ArrowLeft']);
  const right = input.bind('right', ['ArrowRight']);
  const jump = input.bind('jump', [' ', 'ArrowUp']);
  const marker = new Mesh(new BoxGeometry(0.7), new BasicMaterial({ color: '#59c7a5' }));
  marker.position.z = -5;
  r.engine!.scene.add(marker);
  const panel = addPanel();
  let lastEdge = 'none';
  let enterBinding = false;
  const controls = addToolbar([
    {
      label: 'Rebind jump',
      run: () => {
        enterBinding = !enterBinding;
        input.bind('jump', enterBinding ? ['Enter'] : [' ', 'ArrowUp']);
        status(`jump: ${enterBinding ? 'Enter' : 'Space / ArrowUp'}`);
      },
    },
  ]);
  r.update = ({ deltaTime }) => {
    if (left.isDown()) marker.position.x -= deltaTime * 2;
    if (right.isDown()) marker.position.x += deltaTime * 2;
    if (jump.wasPressed()) lastEdge = 'jump pressed';
    if (jump.wasReleased()) lastEdge = 'jump released';
    panel.textContent = `left down: ${left.isDown()}\nright down: ${right.isDown()}\njump pressed: ${jump.wasPressed()}\njump released: ${jump.wasReleased()}\nlast edge: ${lastEdge}`;
  };
  r.stats = () => `input ${lastEdge}`;
  r.dispose = () => {
    r.engine!.untrack(input);
    input.dispose();
    panel.remove();
    controls.remove();
  };
  return r;
}
function physicsAdapterLab(): Runtime {
  const r = three();
  studio(r.engine!.scene);
  plane(r.engine!.scene);
  const adapter: PhysicsAdapter = new SimplePhysics();
  const bodies: Mesh[] = [];
  let serial = 0;
  const add = () => {
    const mesh = new Mesh(new SphereGeometry(0.38, 16, 10), mat(serial % 2 ? '#df8f56' : '#8068dc'));
    mesh.position.set(((serial % 5) - 2) * 0.8, 3 + (serial % 3), -5);
    adapter.addBody(mesh, new Vector3(0, 0, 0));
    r.engine!.scene.add(mesh);
    bodies.push(mesh);
    serial += 1;
  };
  add();
  add();
  const controls = addToolbar([
    { label: 'Add body', run: add },
    {
      label: 'Remove body',
      run: () => {
        const mesh = bodies.pop();
        if (mesh) {
          adapter.removeBody(mesh);
          r.engine!.scene.remove(mesh);
        }
      },
    },
  ]);
  r.update = ({ deltaTime }) => adapter.step(deltaTime);
  r.stats = () => `adapter bodies ${bodies.length}`;
  r.dispose = () => {
    adapter.dispose?.();
    controls.remove();
  };
  return r;
}
function gltfFeatures(): Runtime {
  const r = three();
  studio(r.engine!.scene);
  const sources = {
    glTF: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF/Box.gltf',
    GLB: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Box/glTF-Binary/Box.glb',
  };
  let current: Node | null = null;
  let format: keyof typeof sources = 'glTF';
  let generation = 0;
  let detail = 'loading';
  const load = async () => {
    const ownGeneration = ++generation;
    status(`loading ${format}…`);
    try {
      const result = await new GLTFLoader().load(sources[format]);
      if (ownGeneration !== generation) return;
      if (current) r.engine!.scene.remove(current);
      current = result.scene;
      r.engine!.scene.add(current);
      let meshes = 0;
      current.traverse((node) => {
        if (node instanceof Mesh) meshes += 1;
      });
      detail = `${format} · ${meshes} meshes · radius ${result.bounds.radius.toFixed(2)} · ${result.animations.length} animations`;
      status(detail);
    } catch (error) {
      if (ownGeneration === generation) status(error instanceof Error ? error.message : 'glTF load failed');
    }
  };
  const controls = addToolbar([
    {
      label: 'Switch glTF / GLB',
      run: () => {
        format = format === 'glTF' ? 'GLB' : 'glTF';
        void load();
      },
    },
  ]);
  void load();
  r.stats = () => detail;
  r.dispose = () => {
    generation += 1;
    controls.remove();
  };
  return r;
}
function audioHooksLab(): Runtime {
  const r = three();
  const silent = new NullAudioHooks();
  const speaker = new Mesh(new TorusGeometry(1, 0.32, 28, 12), new BasicMaterial({ color: '#8068dc' }));
  speaker.position.z = -5;
  r.engine!.scene.add(speaker);
  const events: string[] = [];
  const hooks = {
    play: (id: string) => events.unshift(`play(${id})`),
    stop: (id: string) => events.unshift(`stop(${id})`),
    setVolume: (id: string, volume: number) => events.unshift(`volume(${id}, ${volume.toFixed(1)})`),
  };
  silent.play('safe-no-op');
  const panel = addPanel();
  const renderEvents = () => (panel.textContent = events.slice(0, 6).join('\n') || 'No audio events yet');
  const controls = addToolbar([
    { label: 'Play', run: () => (hooks.play('ambient'), renderEvents()) },
    { label: 'Stop', run: () => (hooks.stop('ambient'), renderEvents()) },
    { label: 'Volume 50%', run: () => (hooks.setVolume('ambient', 0.5), renderEvents()) },
  ]);
  renderEvents();
  r.update = ({ elapsed }) => speaker.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.05);
  r.stats = () => `audio events ${events.length} · backend mock`;
  r.dispose = () => {
    panel.remove();
    controls.remove();
  };
  return r;
}
function rendererBackends(): Runtime {
  const r = three();
  const mesh = new Mesh(new BoxGeometry(1.4), new BasicMaterial({ color: '#59c7a5' }));
  mesh.position.z = -5;
  r.engine!.scene.add(mesh);
  let capability = 'WebGL2 active';
  const panel = addPanel();
  const refresh = () => {
    const gl = r.engine!.renderer as WebGLRenderer;
    panel.textContent = `Active: WebGLRenderer\nCanvas: ${gl.canvas.width} × ${gl.canvas.height}\nWebGPU: ${'gpu' in navigator ? 'API detected; backend reserved' : 'not available'}`;
  };
  const controls = addToolbar([
    {
      label: 'Probe WebGPU',
      run: () => {
        try {
          new WebGPURenderer(document.createElement('canvas'));
        } catch (error) {
          capability = error instanceof Error ? error.message : 'WebGPU probe failed';
          status(capability);
        }
        refresh();
      },
    },
  ]);
  refresh();
  r.update = ({ elapsed }) => (mesh.rotation.y = elapsed * 0.4);
  r.stats = () => capability;
  r.dispose = () => {
    panel.remove();
    controls.remove();
  };
  return r;
}
function build(id: ExampleId): Runtime {
  if (id === 'low-poly-forest') return lowPolyForest();
  if (id === 'shader-forest') return lowPolyForest('shader');
  if (id === 'textured-shader-forest') return lowPolyForest('textured');
  if (id === 'cinematic-shader-forest') return lowPolyForest('cinematic');
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
  if (id === 'custom-geometry') return customGeometry();
  if (id === 'material-flags') return materialFlags();
  if (id === 'transform-lab') return transformLab();
  if (id === 'frustum-culling') return frustumCulling();
  if (id === 'particles') return particles();
  if (id === 'performance-metrics') return performanceLab();
  if (id === 'scene-inspector') return inspectorLab();
  if (id === 'resource-lifecycle') return resourceLifecycle();
  if (id === 'input-actions') return inputActions();
  if (id === 'physics-adapter') return physicsAdapterLab();
  if (id === 'gltf-features') return gltfFeatures();
  if (id === 'audio-hooks') return audioHooksLab();
  if (id === 'renderer-backends') return rendererBackends();
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
function startWithMetrics(current: Runtime) {
  if (!current.engine) return;
  const metrics = new PerformanceMetrics();
  const hud = document.createElement('div');
  hud.className = 'metrics-hud';
  viewport.append(hud);
  let smoothedFps = 0;
  let nextHudUpdate = 0;
  const sceneUpdate = current.update;
  current.engine.start((frame) => {
    sceneUpdate?.(frame);
    metrics.update(frame.deltaTime);
    const instantFps = metrics.fps;
    smoothedFps = smoothedFps ? smoothedFps * 0.9 + instantFps * 0.1 : instantFps;
    if (frame.elapsed < nextHudUpdate) return;
    nextHudUpdate = frame.elapsed + 0.25;
    let meshes = 0;
    let vertices = 0;
    current.engine!.scene.traverse((node) => {
      if (node instanceof Mesh && node.visible) {
        meshes += 1;
        vertices += node.geometry.vertexCount;
      }
    });
    const canvas = current.engine!.renderer.canvas;
    const detail = current.stats?.();
    hud.textContent = [
      `FPS ${smoothedFps.toFixed(0)}  ·  ${Math.min(frame.deltaTime * 1000, 999).toFixed(1)} ms`,
      `meshes ${meshes}  ·  vertices ${vertices.toLocaleString()}`,
      `canvas ${canvas.width}×${canvas.height}  ·  DPR ${(globalThis.devicePixelRatio || 1).toFixed(1)}`,
      detail,
    ]
      .filter(Boolean)
      .join('\n');
  });
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
    startWithMetrics(runtime);
    runtime.engine.resize();
  }
}
document.querySelector<HTMLButtonElement>('#reset-camera')!.onclick = () => runtime.controls?.reset();
document.querySelector<HTMLButtonElement>('#next-example')!.onclick = () => {
  const i = examples.findIndex((x) => x.id === active);
  select(examples[(i + 1) % examples.length].id);
};
select(active);
