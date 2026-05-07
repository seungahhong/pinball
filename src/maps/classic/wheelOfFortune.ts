import type { MapData } from '@/types/game';
import { tokens } from '@/styles/tokens';

export const wheelOfFortune: MapData = {
  title: 'Wheel of Fortune',
  goalY: 47.5,
  zoomY: 35,
  spawnArea: { x: -3, y: -5, width: 6, height: 3 },
  entities: [
    // Left wall
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-6, -8],
        [-6, 48],
      ],
    },
    // Right wall
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [6, -8],
        [6, 48],
      ],
    },
    // Bottom
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.accent,
      vertices: [
        [-6, 48],
        [6, 48],
      ],
    },
    // Pegs row 1
    ...Array.from({ length: 5 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-4 + i * 2, 5] as [number, number],
      radius: 0.3,
      color: tokens.color.secondary,
    })),
    // Pegs row 2
    ...Array.from({ length: 4 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-3 + i * 2, 9] as [number, number],
      radius: 0.3,
      color: tokens.color.secondary,
    })),
    // Windmill 1 (cross shape)
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 14],
      width: 5,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 1.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 14],
      width: 0.3,
      height: 5,
      color: tokens.color.primary,
      props: { angularVelocity: 1.5 },
    },
    // Diamond obstacles
    {
      shape: 'box',
      type: 'static',
      position: [-3, 19],
      width: 1.5,
      height: 1.5,
      angle: Math.PI / 4,
      color: tokens.color.accent,
    },
    {
      shape: 'box',
      type: 'static',
      position: [3, 19],
      width: 1.5,
      height: 1.5,
      angle: Math.PI / 4,
      color: tokens.color.accent,
    },
    // Pegs row 3
    ...Array.from({ length: 5 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-4 + i * 2, 24] as [number, number],
      radius: 0.3,
      color: tokens.color.secondary,
    })),
    // Windmill 2 (cross shape, reverse)
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 29],
      width: 4,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: -2.0 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 29],
      width: 0.3,
      height: 4,
      color: tokens.color.primary,
      props: { angularVelocity: -2.0 },
    },
    // Funnel
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-6, 34],
        [-2, 38],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [6, 34],
        [2, 38],
      ],
    },
    // Final pegs
    ...Array.from({ length: 3 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-2 + i * 2, 41] as [number, number],
      radius: 0.25,
      color: tokens.color.accent,
    })),
  ],
};
