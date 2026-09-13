export const input = {
  lookDX: 0, lookDY: 0, moveX: 0, moveY: 0,
  fire: false, ads: false, sprintLock: false,
  _jump: false, _reload: false, _grenade: false,
};
export function addLook(dx: number, dy: number): void { input.lookDX += dx; input.lookDY += dy; }
export function consumeLook(): { dx: number; dy: number } {
  const dx = input.lookDX, dy = input.lookDY;
  input.lookDX = 0; input.lookDY = 0;
  return { dx, dy };
}
export function queueJump() { input._jump = true; }
export function consumeJump(): boolean { const j = input._jump; input._jump = false; return j; }
export function queueReload() { input._reload = true; }
export function consumeReload(): boolean { const r = input._reload; input._reload = false; return r; }
export function queueGrenade() { input._grenade = true; }
export function consumeGrenade(): boolean { const g = input._grenade; input._grenade = false; return g; }
export function resetInput(): void {
  input.lookDX = 0; input.lookDY = 0; input.moveX = 0; input.moveY = 0;
  input.fire = false; input.ads = false; input.sprintLock = false;
  input._jump = false; input._reload = false; input._grenade = false;
}
