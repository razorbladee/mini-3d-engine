export type InputAction = string;
export class InputMap {
  private keys = new Set<string>(); private pressed = new Set<string>();
  constructor(private readonly element: EventTarget = globalThis) { element.addEventListener('keydown', this.onKeyDown as EventListener); element.addEventListener('keyup', this.onKeyUp as EventListener); }
  private readonly onKeyDown = (event: Event) => { const key = (event as KeyboardEvent).key; if (!this.keys.has(key)) this.pressed.add(key); this.keys.add(key); };
  private readonly onKeyUp = (event: Event) => { this.keys.delete((event as KeyboardEvent).key); };
  bind(action: InputAction, keys: string[]) { return { action, isDown: () => keys.some((key) => this.keys.has(key)), wasPressed: () => keys.some((key) => this.pressed.has(key)) }; }
  endFrame() { this.pressed.clear(); return this; }
  dispose() { this.element.removeEventListener('keydown', this.onKeyDown as EventListener); this.element.removeEventListener('keyup', this.onKeyUp as EventListener); this.keys.clear(); this.pressed.clear(); }
}
