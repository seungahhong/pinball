import type { MapData } from '@/types/game';
import { tokens } from '@/styles/tokens';

export const yoruNiKakeru: MapData = {
  title: 'Yoru ni Kakeru',
  goalY: 67.5,
  zoomY: 55,
  spawnArea: { x: -4, y: -7, width: 8, height: 3 },
  entities: [
    // Walls
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-9, -10],
        [-9, 68],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [9, -10],
        [9, 68],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.accent,
      vertices: [
        [-9, 68],
        [9, 68],
      ],
    },
    // Multi-level platforms
    // Level 1 - scatter pegs
    ...Array.from({ length: 7 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-6 + i * 2, 4] as [number, number],
      radius: 0.4,
      color: `hsl(${i * 50}, 70%, 60%)`,
    })),
    // Level 2 - ramps
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.secondary,
      vertices: [
        [-9, 10],
        [5, 14],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.secondary,
      vertices: [
        [9, 17],
        [-5, 21],
      ],
    },
    // Level 3 - windmill pair
    {
      shape: 'box',
      type: 'kinematic',
      position: [-4, 26],
      width: 5,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 1.2 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [-4, 26],
      width: 0.3,
      height: 5,
      color: tokens.color.primary,
      props: { angularVelocity: 1.2 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [4, 26],
      width: 5,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: -1.2 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [4, 26],
      width: 0.3,
      height: 5,
      color: tokens.color.primary,
      props: { angularVelocity: -1.2 },
    },
    // Level 4 - gradient circles
    ...Array.from({ length: 5 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-4 + i * 2, 32 + (i % 2) * 2] as [number, number],
      radius: 0.8 + i * 0.2,
      color: `hsl(${170 + i * 30}, 70%, 50%)`,
    })),
    // Level 5 - more pegs
    ...Array.from({ length: 8 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-7 + i * 2, 40] as [number, number],
      radius: 0.3,
      color: tokens.color.accent,
    })),
    ...Array.from({ length: 7 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-6 + i * 2, 44] as [number, number],
      radius: 0.3,
      color: tokens.color.secondary,
    })),
    // Level 6 - rotating cascade
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 49],
      width: 8,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 0.8 },
    },
    // Funnel
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-9, 54],
        [-2, 60],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [9, 54],
        [2, 60],
      ],
    },
    // Final rotating
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 63],
      width: 4,
      height: 0.3,
      color: tokens.color.danger,
      props: { angularVelocity: -3.0 },
    },
  ],
};
