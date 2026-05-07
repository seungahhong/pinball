import type { MapData } from '@/types/game';
import { tokens } from '@/styles/tokens';

export const wadizOriginal: MapData = {
  title: 'WADIZ FE Challenge',
  goalY: 57.5,
  zoomY: 45,
  spawnArea: { x: -4, y: -6, width: 8, height: 3 },
  entities: [
    // Walls - wadiz mint colored
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
    // "W" deflectors (wide gaps for larger balls)
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-7, 3],
        [-5, 7],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-2, 7],
        [0, 4],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [2, 7],
        [5, 3],
      ],
    },
    // Bouncy bumpers in mint
    ...Array.from({ length: 3 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-4 + i * 4, 15] as [number, number],
      radius: 1.0,
      color: tokens.color.primary,
      props: { restitution: 0.8 },
    })),
    // Dual windmills
    {
      shape: 'box',
      type: 'kinematic',
      position: [-4, 22],
      width: 4,
      height: 0.25,
      color: tokens.color.secondary,
      props: { angularVelocity: 2.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [-4, 22],
      width: 0.25,
      height: 4,
      color: tokens.color.secondary,
      props: { angularVelocity: 2.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [4, 22],
      width: 4,
      height: 0.25,
      color: tokens.color.secondary,
      props: { angularVelocity: -2.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [4, 22],
      width: 0.25,
      height: 4,
      color: tokens.color.secondary,
      props: { angularVelocity: -2.5 },
    },
    // Staggered peg grid
    ...Array.from({ length: 6 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-5 + i * 2, 28] as [number, number],
      radius: 0.3,
      color: tokens.color.accent,
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-4 + i * 2, 31] as [number, number],
      radius: 0.3,
      color: tokens.color.accent,
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      shape: 'circle' as const,
      type: 'static' as const,
      position: [-5 + i * 2, 34] as [number, number],
      radius: 0.3,
      color: tokens.color.secondary,
    })),
    // Chaos zone - triple spinner
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 39],
      width: 6,
      height: 0.3,
      color: tokens.color.primary,
      props: { angularVelocity: 1.5 },
    },
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 39],
      width: 0.3,
      height: 6,
      color: tokens.color.primary,
      props: { angularVelocity: 1.5 },
    },
    // Narrowing funnel with teeth
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [-8, 44],
        [-1.5, 50],
      ],
    },
    {
      shape: 'polyline',
      type: 'static',
      position: [0, 0],
      color: tokens.color.primary,
      vertices: [
        [8, 44],
        [1.5, 50],
      ],
    },
    // Teeth inside funnel (positioned to not block larger balls)
    {
      shape: 'box',
      type: 'static',
      position: [-3, 46],
      width: 0.8,
      height: 0.2,
      angle: -0.3,
      color: tokens.color.danger,
    },
    {
      shape: 'box',
      type: 'static',
      position: [3, 46],
      width: 0.8,
      height: 0.2,
      angle: 0.3,
      color: tokens.color.danger,
    },
    // Final gate spinner
    {
      shape: 'box',
      type: 'kinematic',
      position: [0, 53],
      width: 3,
      height: 0.25,
      color: tokens.color.danger,
      props: { angularVelocity: -3.0 },
    },
  ],
};
