export interface Participant {
  name: string;
  weight: number;
}

export type GameState = 'idle' | 'ready' | 'running' | 'finished';

export type WinMode = 'first' | 'last' | 'custom';

export type SpecialMode = 'none' | 'mapFlip' | 'gravityReverse';

export interface MarbleData {
  id: number;
  name: string;
  color: string;
  weight: number;
}

export interface GoalEvent {
  marbleId: number;
  playerName: string;
  rank: number;
}

export interface ObstacleEvent {
  id: string;
  type: 'bar' | 'block' | 'bumper';
  x: number;
  y: number;
}

export type EntityType = 'static' | 'kinematic';

export interface MapEntity {
  shape: 'polyline' | 'box' | 'circle';
  type: EntityType;
  position: [number, number];
  angle?: number;
  color?: string;
  props?: {
    density?: number;
    restitution?: number;
    angularVelocity?: number;
  };
  vertices?: number[][];
  width?: number;
  height?: number;
  radius?: number;
  life?: number;
}

export interface MapData {
  title: string;
  goalY: number;
  zoomY: number;
  spawnArea: { x: number; y: number; width: number; height: number };
  entities: MapEntity[];
}
