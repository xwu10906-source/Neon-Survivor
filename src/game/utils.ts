export interface Vector2 {
  x: number;
  y: number;
}

export const distance = (p1: Vector2, p2: Vector2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalize = (v: Vector2): Vector2 => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
