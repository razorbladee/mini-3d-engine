export type InputAction = string;

export type BoundAction = {
  readonly action: InputAction;
  /** True while any bound key is held. */
  isDown(): boolean;
  /** True only during the frame in which a bound key went down. */
  wasPressed(): boolean;
  /** True only during the frame in which a bound key came up. */
  wasReleased(): boolean;
};

/**
 * Keyboard action mapping.
 *
 * Two defects fixed here (AUDIT-TZ P1-9): the pressed set was only cleared by
 * an endFrame() that nothing ever called, so wasPressed() latched true forever;
 * and bind() allocated a fresh object on every call, which the showcase did
 * once per frame inside the update loop. Engine now drives endFrame(), and
 * bound actions are cached per action name.
 */
export class InputMap {
  private readonly keys = new Set<string>();
  private readonly pressed = new Set<string>();
  private readonly released = new Set<string>();
  private readonly bindings = new Map<InputAction, { keys: string[]; bound: BoundAction }>();

  constructor(private readonly element: EventTarget = globalThis) {
    element.addEventListener('keydown', this.onKeyDown as EventListener);
    element.addEventListener('keyup', this.onKeyUp as EventListener);
  }

  private readonly onKeyDown = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    // Ignore OS auto-repeat: the edge belongs to the first press only.
    if (!this.keys.has(key)) this.pressed.add(key);
    this.keys.add(key);
  };

  private readonly onKeyUp = (event: Event) => {
    const key = (event as KeyboardEvent).key;
    if (this.keys.delete(key)) this.released.add(key);
  };

  /**
   * Returns a stable handle for `action`. Calling it again with the same name
   * returns the identical object and updates the key list.
   */
  bind(action: InputAction, keys: string[]): BoundAction {
    const existing = this.bindings.get(action);
    if (existing) {
      existing.keys = keys;
      return existing.bound;
    }

    const entry = { keys, bound: null as unknown as BoundAction };
    entry.bound = {
      action,
      isDown: () => entry.keys.some((key) => this.keys.has(key)),
      wasPressed: () => entry.keys.some((key) => this.pressed.has(key)),
      wasReleased: () => entry.keys.some((key) => this.released.has(key)),
    };
    this.bindings.set(action, entry);
    return entry.bound;
  }

  /** Clears the per-frame edges. Called by Engine at the end of each frame. */
  endFrame() {
    this.pressed.clear();
    this.released.clear();
    return this;
  }

  dispose() {
    this.element.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.element.removeEventListener('keyup', this.onKeyUp as EventListener);
    this.keys.clear();
    this.pressed.clear();
    this.released.clear();
    this.bindings.clear();
  }
}
