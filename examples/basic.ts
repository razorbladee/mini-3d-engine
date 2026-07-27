import {Engine,Mesh,BoxGeometry,BasicMaterial} from '../src';
const canvas=document.querySelector<HTMLCanvasElement>('#app')!;
canvas.style.width='100vw';canvas.style.height='100vh';canvas.style.display='block';
const engine=new Engine({canvas});
const cube=new Mesh(new BoxGeometry(2),new BasicMaterial({color:'#4f8cff'})); cube.position.z=-5; engine.scene.add(cube);
engine.start(()=>{cube.position.y=Math.sin(performance.now()/700)*0.25;});
