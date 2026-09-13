import * as THREE from 'three';
import { world } from '../world';
import { audio } from './AudioEngine';
import { spatial } from './Attenuation';

let playerAcc = 0;
export function playerFootsteps(dt: number, speed: number, grounded: boolean, pos: THREE.Vector3): void {
  if (!grounded) { playerAcc = 0; return; }
  playerAcc += speed * dt;
  if (playerAcc > 2.2) {
    playerAcc = 0;
    audio.play(Math.random() < 0.5 ? 'step' : 'step2', { gain: speed > 6 ? 0.55 : 0.38 });
  }
}
export function botFootsteps(bot: { pos: THREE.Vector3; stepAcc: number }, dt: number, speed: number): void {
  bot.stepAcc += speed * dt;
  if (bot.stepAcc > 2.2) {
    bot.stepAcc = 0;
    const sp = spatial(world.player.pos, world.player.yaw, bot.pos);
    if (sp.gain > 0.12) audio.play(Math.random() < 0.5 ? 'step' : 'step2', { gain: 0.5 * sp.gain, pan: sp.pan });
  }
}
