export interface WeaponDef {
  name: string;
  rpm: number;
  magSize: number;
  reserveMax: number;
  damageBody: number;
  damageHead: number;
  spreadHip: number; // radians
  spreadAds: number;
  bloomPerShot: number;
  bloomMax: number;
  adsTime: number;
  adsFov: number;
  reloadTime: number;
  recoilPitch: [number, number]; // degrees
  recoilYaw: [number, number];
}

const DEG = Math.PI / 180;

export const NV4: WeaponDef = {
  name: 'NV-4',
  rpm: 750,
  magSize: 30,
  reserveMax: 120,
  damageBody: 26,
  damageHead: 44,
  spreadHip: 2.2 * DEG,
  spreadAds: 0.35 * DEG,
  bloomPerShot: 0.16 * DEG,
  bloomMax: 2.4 * DEG,
  adsTime: 0.2,
  adsFov: 50,
  reloadTime: 1.85,
  recoilPitch: [0.5, 0.9],
  recoilYaw: [0.15, 0.5],
};

export const FRAG = {
  radius: 6.5,
  damage: 150,
  fuse: 2.6,
  throwSpeed: 16,
  upKick: 3.8,
};
