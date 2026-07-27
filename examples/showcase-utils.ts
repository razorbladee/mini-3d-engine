export type RectLike = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

export function pointerToNdc(clientX: number, clientY: number, rect: RectLike) {
  if (rect.width <= 0 || rect.height <= 0) throw new Error('Pointer target must have a positive size');
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((clientY - rect.top) / rect.height) * 2 - 1),
  };
}

export function nextIndex(current: number, length: number) {
  if (!Number.isInteger(length) || length <= 0) throw new Error('Collection must not be empty');
  return (current + 1) % length;
}
