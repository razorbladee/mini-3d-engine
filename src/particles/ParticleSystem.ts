import { Vector3 } from '../math/Vector3';
export type Particle = { position: Vector3; velocity: Vector3; life: number; age: number };
export class ParticleSystem {
  readonly particles: Particle[] = [];
  constructor(
    public maxParticles = 256,
    public gravity = new Vector3(0, -9.81, 0),
  ) {}
  emit(position = new Vector3(), velocity = new Vector3(), life = 1) {
    if (this.particles.length >= this.maxParticles) return this;
    this.particles.push({ position: position.clone(), velocity: velocity.clone(), life, age: 0 });
    return this;
  }
  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += Math.max(0, deltaTime);
      p.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      if (p.age >= p.life) this.particles.splice(i, 1);
    }
    return this;
  }
  clear() {
    this.particles.length = 0;
    return this;
  }
}
