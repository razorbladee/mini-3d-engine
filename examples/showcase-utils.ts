export type RectLike = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

export function pointerToNdc(clientX: number, clientY: number, rect: RectLike) {
  if (rect.width <= 0 || rect.height <= 0) throw new Error('Pointer target must have a positive size');
  // `+ 0` normalizes the negative zero that the y flip produces at the centre of
  // the viewport, so downstream maths and equality checks stay well behaved.
  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1 + 0,
    y: -(((clientY - rect.top) / rect.height) * 2 - 1) + 0,
  };
}

export function nextIndex(current: number, length: number) {
  if (!Number.isInteger(length) || length <= 0) throw new Error('Collection must not be empty');
  return (current + 1) % length;
}
