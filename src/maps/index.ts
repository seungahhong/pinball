import { wheelOfFortune } from './classic/wheelOfFortune';
import { bubblePop } from './classic/bubblePop';
import { potOfGreed } from './classic/potOfGreed';
import { yoruNiKakeru } from './classic/yoruNiKakeru';
import { wadizOriginal } from './wadiz/wadizOriginal';
import type { MapData, MapEntity } from '@/types/game';

const MAP_SCALE = 2.5;

function extendMapY(map: MapData, scale: number): MapData {
  const newGoalY = map.goalY * scale;
  const bottomY = newGoalY + 0.5;

  const resultEntities: MapEntity[] = [];
  const obstacles: MapEntity[] = [];

  // Separate walls/floor from obstacles
  for (const e of map.entities) {
    if (e.shape === 'polyline' && e.vertices && e.vertices.length === 2) {
      const [v1, v2] = e.vertices;
      const dy = Math.abs(v1[1] - v2[1]);
      const maxVertY = Math.max(v1[1], v2[1]);

      // Vertical wall: large Y span
      if (dy > 20) {
        const topY = Math.min(v1[1], v2[1]);
        resultEntities.push({
          ...e,
          vertices: [
            [v1[0], topY],
            [v2[0], bottomY],
          ],
        });
        continue;
      }
      // Horizontal floor near bottom
      if (dy < 1 && maxVertY > map.goalY * 0.8) {
        resultEntities.push({
          ...e,
          vertices: [
            [v1[0], bottomY],
            [v2[0], bottomY],
          ],
        });
        continue;
      }
    }
    obstacles.push(e);
  }

  // Calculate obstacle section height
  const getYValues = (e: MapEntity): number[] => {
    const ys: number[] = [];
    if (e.position[1] !== 0) ys.push(e.position[1]);
    if (e.vertices) {
      for (const v of e.vertices) ys.push(v[1]);
    }
    if (ys.length === 0 && e.position[1] === 0) ys.push(0);
    return ys;
  };

  let minY = Infinity;
  let maxY = -Infinity;
  for (const o of obstacles) {
    for (const y of getYValues(o)) {
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const sectionH = maxY - minY + 3;

  // Replicate obstacle sections to fill the extended map, but only before GOAL
  const copies = Math.round(scale);
  for (let c = 0; c < copies; c++) {
    const yOff = c * sectionH;
    for (const o of obstacles) {
      const entityMaxY = Math.max(o.position[1], ...(o.vertices?.map((v) => v[1]) || []));
      if (entityMaxY + yOff > newGoalY - 2) continue;
      resultEntities.push({
        ...o,
        position: [o.position[0], o.position[1] + yOff] as [number, number],
      });
    }
  }

  return {
    ...map,
    goalY: newGoalY,
    zoomY: map.zoomY * scale,
    spawnArea: map.spawnArea,
    entities: resultEntities,
  };
}

export const maps: MapData[] = [
  extendMapY(wadizOriginal, MAP_SCALE),
  extendMapY(wheelOfFortune, MAP_SCALE),
  extendMapY(bubblePop, MAP_SCALE),
  extendMapY(potOfGreed, MAP_SCALE),
  extendMapY(yoruNiKakeru, MAP_SCALE),
];

export { wadizOriginal, wheelOfFortune, bubblePop, potOfGreed, yoruNiKakeru };
