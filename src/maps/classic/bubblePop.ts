import type { MapData } from '@/types/game';
import { tokens } from '@/styles/tokens';

export const bubblePop: MapData = {
  title: 'Bubble Pop',
  goalY: 52.5,
  zoomY: 40,
  spawnArea: { x: -4, y: -6, width: 8, height: 3 },
  entities: [
    // Walls
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-7, -8],
        [-7, 53],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [7, -8],
        [7, 53],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.accent,
      vertices: [
        [-7, 53],
        [7, 53],
      ],
    },
    // Large bubbles
    {
      shape: 'circle',
      type: 'static',
      position: [-3, 6],
      radius: 2,
      color: `${tokens.color.primary}40`,
    },
    {
      shape: 'circle',
      type: 'static',
      position: [3, 10],
      radius: 2.5,
      color: `${tokens.color.secondary}40`,
    },
    {
      shape: 'circle',
      type: 'static',
      position: [0, 17],
      radius: 1.8,
      color: `${tokens.color.accent}40`,
    },
    // Zigzag ramps
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.secondary,
      vertices: [
        [-7, 22],
        [4, 25],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.secondary,
      vertices: [
        [7, 28],
        [-4, 31],
      ],
    },
    // Windmill (cross shape)
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 36],
      width: 6,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 1.0 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 36],
      width: 0.3,
      height: 6,
      color: tokens.color.primary,
      props: { angularVelocity: 1.0 },
    },
    // Small pegs
    ...Array.from({ length: 6 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-5 + i * 2, 40] as [number, number],
      radius: 0.3,
      color: tokens.color.accent,
    })),
    // Final obstacles
    {
      shape: 'box',
      type: 'static',
      position: [-3, 45],
      width: 0.3,
      height: 3,
      color: tokens.color.primary,
    },
    {
      shape: 'box',
      type: 'static',
      position: [0, 45],
      width: 0.3,
      height: 3,
      color: tokens.color.primary,
    },
    {
      shape: 'box',
      type: 'static',
      position: [3, 45],
      width: 0.3,
      height: 3,
      color: tokens.color.primary,
    },
  ],
};
