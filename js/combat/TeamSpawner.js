import { Fighter } from '../fighter.js';

export function normalizeTeamIds(ids) {
  return typeof ids === 'string' ? [ids] : ids;
}

export function createTeam(characterIds, team, arena) {
  const fighters = [];
  const maxSpacing = 70;
  const spawnX = team === 'left'
    ? arena.x + 80
    : arena.x + arena.width - 80;
  const centerY = arena.y + arena.height / 2;
  const count = characterIds.length;
  const spacing = count > 1 ? Math.min(maxSpacing, (arena.height - 80) / (count - 1)) : maxSpacing;
  const startY = centerY - ((count - 1) * spacing) / 2;

  for (let i = 0; i < count; i++) {
    fighters.push(new Fighter(characterIds[i], spawnX, startY + i * spacing, team));
  }

  return fighters;
}
