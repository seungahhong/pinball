import type { MapData } from '@/types/game';
import { tokens } from '@/styles/tokens';

export const potOfGreed: MapData = {
  title: 'Pot of Greed',
  goalY: 57.5,
  zoomY: 45,
  spawnArea: { x: -3, y: -6, width: 6, height: 3 },
  entities: [
    // Walls
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-8, -8],
        [-8, 58],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [8, -8],
        [8, 58],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.accent,
      vertices: [
        [-8, 58],
        [8, 58],
      ],
    },
    // Narrow corridors
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.secondary,
      vertices: [
        [-8, 5],
        [-1, 8],
        [-1, 12],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.secondary,
      vertices: [
        [8, 5],
        [1, 8],
        [1, 12],
      ],
    },
    // Windmill cascade
    {
      shape: 'box',
      type: 'kinematic',
      position: [-3, 16],
      width: 4,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 2.0 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [-3, 16],
      width: 0.3,
      height: 4,
      color: tokens.color.primary,
      props: { angularVelocity: 2.0 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [3, 22],
      width: 4,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: -1.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [3, 22],
      width: 0.3,
      height: 4,
      color: tokens.color.primary,
      props: { angularVelocity: -1.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [-2, 28],
      width: 3,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 1.8 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [-2, 28],
      width: 0.3,
      height: 3,
      color: tokens.color.primary,
      props: { angularVelocity: 1.8 },
    },
    // Pegs scatter
    ...Array.from({ length: 7 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-6 + i * 2, 34] as [number, number],
      radius: 0.35,
      color: tokens.color.accent,
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-5 + i * 2, 38] as [number, number],
      radius: 0.35,
      color: tokens.color.secondary,
    })),
    // Funnel
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-8, 43],
        [-1, 48],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [8, 43],
        [1, 48],
      ],
    },
    // Final obstacle
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 52],
      width: 3,
      height: 0.3,
      color: tokens.color.danger,
      props: { angularVelocity: -2.5 },
    },
  ],
};
