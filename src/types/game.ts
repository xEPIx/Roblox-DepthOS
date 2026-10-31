export type GameMode = 'title' | 'playing' | 'paused' | 'victory';

export type GearType = 'none' | 'sword' | 'speed_coil' | 'gravity_coil' | 'bloxy_cola';

export type EmoteType = 'none' | 'dance1' | 'dance2' | 'cheer' | 'wave';

export interface AvatarCustomization {
  skinColor: string;
  torsoColor: string;
  leftArmColor: string;
  rightArmColor: string;
  leftLegColor: string;
  rightLegColor: string;
  hat: 'none' | 'visor' | 'fedora' | 'tophat' | 'crown' | 'headphones';
  face: 'smile' | 'chill' | 'determined' | 'derp' | 'cool';
  backAccessory: 'none' | 'swords' | 'wings' | 'cape';
}

export interface PlayerStats {
  currentStage: number;
  totalStages: number;
  coins: number;
  deaths: number;
  timeElapsed: number; // in seconds
  health: number; // 0 - 100
  isSprinting: boolean;
  equippedGear: GearType;
  currentEmote: EmoteType;
}

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  checkpointPosition: [number, number, number];
  themeColor: string;
  skyColor: string;
  fogColor: string;
}

export interface BlockObject {
  id: string;
  type: 'ground' | 'killbrick' | 'disappearing' | 'moving' | 'conveyor' | 'jumppad' | 'checkpoint' | 'coin' | 'target_dummy' | 'laser';
  position: [number, number, number];
  size: [number, number, number];
  color?: number | string;
  emissive?: number | string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
  conveyorSpeed?: number;
  jumpVelocity?: number;
  moveRange?: [number, number, number];
  moveSpeed?: number;
  stageId: number;
  initialPos?: [number, number, number];
  // Internal state tracking
  state?: {
    fadeTimer?: number;
    active?: boolean;
    collected?: boolean;
    hp?: number;
    laserAngle?: number;
    laserSpeed?: number;
  };
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  action: boolean; // sword swing / use gear
  justJumped: boolean;
  justActioned: boolean;
  shiftLock: boolean;
}
