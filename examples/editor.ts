import { Engine, Mesh, BoxGeometry, PlaneGeometry, SphereGeometry, BasicMaterial } from '../src';
import './editor.css';

const root = document.querySelector<HTMLDivElement>('#editor')!;
root.innerHTML = `<header class="topbar"><div class="brand"><span class="mark">◈</span><span>mini / studio</span></div><div class="project">untitled scene <span class="dot"></span> saved locally</div><div class="top-actions"><button id="save">Save</button><button class="primary" id="play">▶ Preview</button></div></header><main class="workspace"><aside class="left"><div class="panel-title"><span>Scene</span><button id="add">＋</button></div><div class="scene-list" id="scene-list"></div><div class="left-footer"><span class="status-dot"></span> WebGL2 ready</div></aside><section class="stage"><div class="toolbar"><button class="tool active">↖ Select</button><button class="tool">✥ Move</button><button class="tool">⟳ Rotate</button><button class="tool">⇲ Scale</button><span class="spacer"></span><button class="tool" id="frame">⌖ Frame</button></div><div class="viewport"><canvas id="viewport"></canvas><div class="crosshair"></div><div class="hint">Drag a value in the inspector to edit</div><div class="stats">60 FPS<br><span>WebGL2</span></div></div><footer class="timeline"><span class="timeline-label">Timeline</span><div class="track"><i></i><b></b></div><span class="time">00:00.00</span><button>＋ Add keyframe</button></footer></section><aside class="right"><div class="panel-title">Inspector</div><div id="inspector" class="inspector"></div></aside></main>`;

const canvas = document.querySelector<HTMLCanvasElement>('#viewport')!;
const engine = new Engine({ canvas });
canvas.style.width = '100%';
canvas.style.height = '100%';
const objects: { name: string; node: Mesh }[] = [];
let selected: Mesh | null = null;
function addObject(kind: 'Cube' | 'Plane' | 'Sphere') {
  const geometry =
    kind === 'Cube' ? new BoxGeometry(1.8) : kind === 'Plane' ? new PlaneGeometry(3, 3) : new SphereGeometry(1, 16, 8);
  const node = new Mesh(
    geometry,
    new BasicMaterial({ color: kind === 'Cube' ? '#8b7cff' : kind === 'Plane' ? '#df9c62' : '#59c7a5' }),
  );
  node.name = `${kind} ${objects.length + 1}`;
  node.position.z = -5;
  if (kind === 'Plane') node.position.y = -1.5;
  engine.scene.add(node);
  objects.push({ name: node.name, node });
  select(node);
  renderTree();
}
function select(node: Mesh) {
  selected = node;
  renderTree();
  renderInspector();
}
function renderTree() {
  const list = document.querySelector<HTMLDivElement>('#scene-list')!;
  list.innerHTML =
    `<div class="tree-root">⌄ Scene <small>${objects.length} objects</small></div>` +
    objects
      .map(
        ({ name, node }) =>
          `<button class="tree-item ${node === selected ? 'selected' : ''}" data-name="${name}"><span class="cube-icon">${name.startsWith('Sphere') ? '●' : name.startsWith('Plane') ? '▱' : '◇'}</span>${name}<em>Mesh</em></button>`,
      )
      .join('');
  list
    .querySelectorAll<HTMLButtonElement>('.tree-item')
    .forEach((btn) => (btn.onclick = () => select(objects.find((o) => o.name === btn.dataset.name)!.node)));
}
function renderInspector() {
  const panel = document.querySelector<HTMLDivElement>('#inspector')!;
  if (!selected) {
    panel.innerHTML = '<div class="empty">Select an object<br><span>to inspect its properties</span></div>';
    return;
  }
  const n = selected;
  panel.innerHTML = `<div class="object-heading"><span class="object-icon">◇</span><div><strong>${n.name}</strong><small>Mesh</small></div><button id="delete">⌫</button></div><label class="section-label">Transform</label>${field('Position X', 'px', n.position.x)}${field('Position Y', 'py', n.position.y)}${field('Position Z', 'pz', n.position.z)}${field('Scale', 'scale', n.scale.x)}<label class="section-label material-label">Material</label><div class="color-row"><span>Color</span><input id="color" type="color" value="#8b7cff"><code>#8B7CFF</code></div><div class="property-row"><span>Visible</span><input id="visible" type="checkbox" ${n.visible ? 'checked' : ''}></div>`;
  document.querySelector<HTMLButtonElement>('#delete')!.onclick = () => {
    engine.scene.remove(n);
    const i = objects.findIndex((o) => o.node === n);
    objects.splice(i, 1);
    selected = null;
    renderTree();
    renderInspector();
  };
  document.querySelector<HTMLInputElement>('#visible')!.onchange = (e) =>
    (n.visible = (e.target as HTMLInputElement).checked);
}
function field(label: string, id: string, value: number) {
  return `<div class="property-row"><span>${label}</span><input id="${id}" type="number" step="0.1" value="${value.toFixed(2)}"></div>`;
}
function bindFields() {
  ['px', 'py', 'pz', 'scale'].forEach((id) =>
    document.addEventListener('change', (e) => {
      const el = e.target as HTMLInputElement;
      if (el.id === id && selected) {
        const v = Number(el.value);
        if (id === 'px') selected.position.x = v;
        if (id === 'py') selected.position.y = v;
        if (id === 'pz') selected.position.z = v;
        if (id === 'scale') selected.scale.set(v, v, v);
      }
    }),
  );
}
(document.querySelector('#add') as HTMLButtonElement).onclick = () => addObject('Cube');
document.querySelector('#save')!.addEventListener('click', () => {
  localStorage.setItem(
    'mini-scene',
    JSON.stringify(objects.map((o) => ({ name: o.name, position: o.node.position, scale: o.node.scale }))),
  );
  document.querySelector('.project')!.innerHTML = 'untitled scene <span class="dot green"></span> saved just now';
});
document
  .querySelector('#play')!
  .addEventListener('click', () => (document.querySelector('.hint')!.textContent = 'Preview mode enabled'));
document.querySelector('#frame')!.addEventListener('click', () => {
  if (selected) selected.position.z = -5;
});
bindFields();
addObject('Cube');
addObject('Sphere');
select(objects[0].node);
engine.start();
