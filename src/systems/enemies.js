import { TAU, lerp, rand } from "./collision";

export function enemyStats(type, levelIndex) {
  if (type === "chaser")   return { hp: 2 + Math.floor(levelIndex * 0.2), r: 0.12, base: 3.2 };
  if (type === "spinner")  return { hp: 3 + Math.floor(levelIndex * 0.25), r: 0.12, base: 2.6 };
  if (type === "turret")   return { hp: 4 + Math.floor(levelIndex * 0.3), r: 0.14, base: 0 };
  // bosses
  return { hp: 18 + levelIndex * 6, r: 0.22, base: 0 };
}

export function updateEnemy(e, dt, P, addBullet) {
  e.t += dt; e.cd -= dt;

  if (e.type === "chaser") {
    const dx = P.x - e.x, dy = P.y - e.y;
    const L = Math.hypot(dx, dy) || 1;
    e.vx = lerp(e.vx, (dx / L) * e.base, 0.8 * dt);
    e.vy = lerp(e.vy, (dy / L) * e.base, 0.8 * dt);
    e.x += e.vx * dt; e.y += e.vy * dt;

  } else if (e.type === "spinner") {
    const s = 2.4;
    e.vx = lerp(e.vx, Math.cos(e.t * 0.8) * s, 0.6 * dt);
    e.vy = lerp(e.vy, Math.sin(e.t * 0.8) * s, 0.6 * dt);
    e.x += e.vx * dt; e.y += e.vy * dt;

    if (e.cd <= 0) {
      const n = 10, base = e.t * 0.8, spd = 7.5;
      for (let k = 0; k < n; k++) {
        const a = base + (k / n) * TAU;
        addBullet(e.x, e.y, Math.cos(a) * spd, Math.sin(a) * spd, 2.2, true, "gold");
      }
      e.cd = 1.2;
    }

  } else if (e.type === "turret") {
    if (e.cd <= 0) {
      const dx = P.x - e.x, dy = P.y - e.y;
      const a = Math.atan2(dy, dx) + rand(-0.1, 0.1);
      const spd = 8;
      addBullet(e.x + Math.cos(a) * 0.16, e.y + Math.sin(a) * 0.16, Math.cos(a) * spd, Math.sin(a) * spd, 3.2, true, "red");
      e.cd = 0.8;
    }

  } else if (e.type === "boss1") {
    const s = 1.4;
    e.vx = lerp(e.vx, Math.cos(e.t * 0.6) * s, 0.6 * dt);
    e.vy = lerp(e.vy, Math.sin(e.t * 0.5) * s, 0.6 * dt);
    e.x += e.vx * dt; e.y += e.vy * dt;

    if (e.cd <= 0) {
      const n = 16, base = e.t * 0.8, spd = 7.5;
      for (let k = 0; k < n; k++) {
        const a = base + (k / n) * TAU;
        addBullet(e.x, e.y, Math.cos(a) * spd, Math.sin(a) * spd, 3.0, true, "red");
      }
      e.cd = 0.9;
    }

  } else if (e.type === "boss2") {
    if (e.cd <= 0) {
      const a = Math.atan2(P.y - e.y, P.x - e.x), spd = 10;
      for (let j = -2; j <= 2; j++) {
        const aa = a + j * 0.08;
        addBullet(e.x, e.y, Math.cos(aa) * spd, Math.sin(aa) * spd, 3.0, true, "red");
      }
      e.cd = 0.7;
    }

  } else if (e.type === "boss3") {
    if (e.cd <= 0) {
      const n = 20, base = e.t * 1.5, spd = 8.5;
      for (let k = 0; k < n; k++) {
        const a = base + (k / n) * TAU;
        addBullet(e.x, e.y, Math.cos(a) * spd, Math.sin(a) * spd, 2.6, true, "gold");
      }
      e.cd = 0.85;
    }
  }
}
