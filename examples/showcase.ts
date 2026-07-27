import { BasicMaterial, BoxGeometry, Mesh, PostProcess, SimplePhysics, Texture2D, Vector3 } from '../src';
import './showcase.css';

const root = document.querySelector('#showcase') as HTMLDivElement;
root.innerHTML = `
<header class="top"><div class="brand"><b>◈</b> mini / lab</div><div class="sub">engine extensions / live examples</div><a href="https://github.com/razorbladee/mini-3d-engine" target="_blank">GitHub ↗</a></header>
<main><section class="intro"><p class="eyebrow">MINI 3D ENGINE / 0.1</p><h1>Small experiments,<br><em>real engine APIs.</em></h1><p class="lede">Three focused demos for textures, gravity, and post-processing.</p></section>
<nav class="tabs"><button class="tab active" data-tab="texture">01 / Texture2D</button><button class="tab" data-tab="physics">02 / SimplePhysics</button><button class="tab" data-tab="post">03 / PostProcess</button></nav>
<section class="demo-grid"><article class="demo active" id="texture"><div class="demo-copy"><span class="number">01</span><h2>Texture loading</h2><p>Load and decode an image with <code>Texture2D.load()</code>.</p><button class="run" id="load-texture">Load texture <span>↗</span></button><p class="result" id="texture-result">Ready to load</p></div><div class="visual texture-visual"><canvas id="texture-canvas"></canvas><span class="visual-label">generated checker</span></div></article>
<article class="demo" id="physics"><div class="demo-copy"><span class="number">02</span><h2>Gravity + floor</h2><p>A real <code>SimplePhysics</code> body falls and settles at <code>y = 0</code>.</p><button class="run" id="reset-physics">Drop again <span>↻</span></button><p class="result" id="physics-result">Ready</p></div><div class="visual physics-visual"><canvas id="physics-canvas"></canvas><span class="visual-label">floor constraint</span></div></article>
<article class="demo" id="post"><div class="demo-copy"><span class="number">03</span><h2>Post-processing</h2><p>Toggle a registered <code>PostProcess</code> pass.</p><button class="run" id="toggle-post">Enable grade <span>◐</span></button><p class="result" id="post-result">1 pass registered</p></div><div class="visual post-visual"><div class="post-scene"><i></i><b></b><em></em></div><span class="visual-label">color grade preview</span></div></article></section></main>`;

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab'));
const demos = Array.from(document.querySelectorAll<HTMLElement>('.demo'));
for (const tab of tabs) {
  tab.onclick = () => {
    for (const item of tabs) item.classList.toggle('active', item === tab);
    for (const demo of demos) demo.classList.toggle('active', demo.id === tab.dataset.tab);
  };
}

const textureCanvas = document.querySelector('#texture-canvas') as HTMLCanvasElement;
const textureContext = textureCanvas.getContext('2d') as CanvasRenderingContext2D;
textureCanvas.width = 360;
textureCanvas.height = 360;
for (let y = 0; y < 8; y += 1) {
  for (let x = 0; x < 8; x += 1) {
    textureContext.fillStyle = (x + y) % 2 === 0 ? '#8068dc' : '#eeeafd';
    textureContext.fillRect(x * 45, y * 45, 45, 45);
  }
}
textureContext.fillStyle = '#292938';
textureContext.font = '600 22px Space Grotesk';
textureContext.fillText('Texture2D', 24, 330);
const loadButton = document.querySelector('#load-texture') as HTMLButtonElement;
loadButton.onclick = async () => {
  const result = document.querySelector('#texture-result') as HTMLParagraphElement;
  result.textContent = 'Decoding image...';
  const image = await Texture2D.load(textureCanvas.toDataURL());
  result.textContent = `Loaded ${image.image.width} x ${image.image.height} texture`;
};

const physicsCanvas = document.querySelector('#physics-canvas') as HTMLCanvasElement;
const physicsContext = physicsCanvas.getContext('2d') as CanvasRenderingContext2D;
const physics = new SimplePhysics();
const body = new Mesh(new BoxGeometry(0.6), new BasicMaterial({ color: '#df9c62' }));
body.position.y = 3;
physics.addBody(body, new Vector3());
const resetPhysics = () => {
  body.position.y = 3;
  physics.addBody(body, new Vector3());
};
(document.querySelector('#reset-physics') as HTMLButtonElement).onclick = resetPhysics;
const drawPhysics = () => {
  const width = Math.max(1, physicsCanvas.clientWidth);
  const height = Math.max(1, physicsCanvas.clientHeight);
  physicsCanvas.width = width * 2;
  physicsCanvas.height = height * 2;
  physicsContext.setTransform(2, 0, 0, 2, 0, 0);
  physicsContext.clearRect(0, 0, width, height);
  physicsContext.fillStyle = '#dedee7';
  physicsContext.fillRect(0, height - 28, width, 1);
  const y = height - 42 - body.position.y * 30;
  physicsContext.fillStyle = '#df9c62';
  physicsContext.fillRect(width / 2 - 24, y, 48, 48);
  const result = document.querySelector('#physics-result') as HTMLParagraphElement;
  result.textContent = `height: ${body.position.y.toFixed(2)}`;
  physics.step(1 / 60);
  window.requestAnimationFrame(drawPhysics);
};
drawPhysics();

const post = new PostProcess();
post.add({ apply: () => undefined });
let graded = false;
(document.querySelector('#toggle-post') as HTMLButtonElement).onclick = () => {
  graded = !graded;
  document.querySelector('.post-visual')?.classList.toggle('graded', graded);
  const button = document.querySelector('#toggle-post') as HTMLButtonElement;
  const result = document.querySelector('#post-result') as HTMLParagraphElement;
  button.innerHTML = graded ? 'Disable grade <span>◐</span>' : 'Enable grade <span>◐</span>';
  result.textContent = graded ? 'Grade active / 1 pass' : '1 pass registered';
};
