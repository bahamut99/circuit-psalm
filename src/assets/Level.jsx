import React, { useEffect, useMemo, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import Player from "./Player.jsx";
import Enemy from "./Enemy.jsx";
import Bullet from "./Bullet.jsx";
import PowerUp from "./PowerUp.jsx";
import { useGame } from "../systems/store.js";
import { useInputSnapshot } from "../systems/controls.js";
import {
  TAU, clamp, lerp, rand, dist2, anglerp, circleRectColl,
} from "../systems/collision.js";
import { makeLevel, pickBoss } from "../systems/levels.js";
import { enemyStats, updateEnemy } from "../systems/enemies.js";

const COLORS = {
  wallFill: "#0f172a",
  wallInner: "#0b1222",
  wallEdge: "#6ee7ff",
};

export default function Level() {
  const { ui, setUI } = useGame();
  const { size, viewport } = useThree();
  const { keys, mouse } = useInputSnapshot();

  // World sizes in “scene units”
  const W = viewport.width, H = viewport.height;

  // ----- refs: mutable game state -----
  const player = useRef({ x: -W * 0.35, y: 0, vx: 0, vy: 0, acc: 6.8, max: 8.5, fric: 6, r: 0.12, cd: 0, rate: 0.10, ifr: 0, aim: 0 });
  const enemies = useRef([]);   // {x,y,vx,vy,hp,type,r,t,cd,base}
  const bullets = useRef([]);   // {x,y,vx,vy,life,enemy}
  const pickups = useRef([]);   // {x,y,kind,life,t,blink}
  const walls = useRef([]);     // {x,y,w,h} center-based

  // Build a level from index
  const buildLevel = (idx) => {
    enemies.current.length = 0;
    bullets.current.length = 0;
    pickups.current.length = 0;
    walls.current.length = 0;

    const L = makeLevel(idx);
    setUI((s) => ({ ...s, time: L.time, state: "playing", boss: false }));

    // Convert normalized walls into world units (centered at 0,0)
    for (const w of L.walls) {
      walls.current.push({ x: w.x * W, y: w.y * H, w: w.w * W, h: w.h * H });
    }

    // Player start
    Object.assign(player.current, { x: -W * 0.35, y: 0, vx: 0, vy: 0, cd: 0, ifr: 1.2 });

    // Spawns
    const SAFE = Math.min(W, H) * 0.18;
    for (const s of L.spawns) {
      for (let k = 0; k < s.count; k++) {
        // normalized → world
        let ex = s.x * W + rand(-0.2, 0.2);
        let ey = s.y * H + rand(-0.2, 0.2);
        const dx = ex - player.current.x, dy = ey - player.current.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < SAFE) { const m = SAFE / d; ex = player.current.x + dx * m; ey = player.current.y + dy * m; }
        const st = enemyStats(s.type, idx);
        enemies.current.push({ x: ex, y: ey, vx: 0, vy: 0, hp: st.hp, type: s.type, r: st.r, base: st.base, t: 0, cd: 0 });
      }
    }
  };

  // Keyboard UI controls
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Enter" && (ui.state === "intro" || ui.state === "interlude" || ui.state === "gameover")) {
        if (ui.state === "gameover") setUI({ state: "playing", level: 1, time: 60, lives: 3, enemies: 0, boss: false, powerRapid: 0, powerShield: 0 });
        buildLevel(ui.level - 1);
      }
      if (e.code === "KeyP") setUI((s) => ({ ...s, state: s.state === "playing" ? "paused" : s.state === "paused" ? "playing" : s.state }));
      if (e.code === "KeyR") { setUI({ state: "playing", level: 1, time: 60, lives: 3, enemies: 0, boss: false, powerRapid: 0, powerShield: 0 }); buildLevel(0); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.state, ui.level]);

  // Start in intro
  useEffect(() => { setUI((s) => ({ ...s, state: "intro" })); }, []);

  // ---- helper to add bullets
  const addBullet = (x, y, vx, vy, life, enemy, colorName) => {
    bullets.current.push({ x, y, vx, vy, life, enemy, color: colorName });
  };

  // ---- rendering meshes for walls
  function Wall({ rect }) {
    const { x, y, w, h } = rect;
    return (
      <group position={[x, y, 0]}>
        <mesh position={[0, 0, -0.5]}>
          <boxGeometry args={[w, h, 1]} />
          <meshStandardMaterial color={COLORS.wallFill} roughness={1} metalness={0} />
        </mesh>
        <mesh>
          <boxGeometry args={[w - 0.06, h - 0.06, 0.6]} />
          <meshStandardMaterial color={COLORS.wallInner} roughness={1} metalness={0} />
        </mesh>
        <mesh position={[0, 0, 0.4]}>
          <boxGeometry args={[w, h, 0.02]} />
          <meshStandardMaterial emissive={COLORS.wallEdge} emissiveIntensity={0.35} color={COLORS.wallFill} />
          <Edges color={COLORS.wallEdge} />
        </mesh>
      </group>
    );
  }

  // ---- main frame loop
  useFrame((state, rawDt) => {
    let dt = Math.min(rawDt, 1 / 30);

    if (ui.state !== "playing") return;

    // Timer
    setUI((s) => ({ ...s, time: Math.max(0, s.time - dt) }));

    const P = player.current;
    const mouseVec = state.pointer; // -1..1 in NDC
    const mouseWorld = { x: mouseVec.x * (W / 2), y: mouseVec.y * (H / 2) };

    // ----- movement (WASD)
    let mx = 0, my = 0;
    if (keys.current.has("KeyD")) mx += 1;
    if (keys.current.has("KeyA")) mx -= 1;
    if (keys.current.has("KeyS")) my += 1;
    if (keys.current.has("KeyW")) my -= 1;
    if (mx || my) {
      const L = Math.hypot(mx, my) || 1;
      P.vx += (mx / L) * P.acc * dt;
      P.vy += (my / L) * P.acc * dt;
    }
    // clamp + friction + stop
    const sp = Math.hypot(P.vx, P.vy);
    if (sp > P.max) { P.vx *= P.max / sp; P.vy *= P.max / sp; }
    P.vx *= 1 - P.fric * dt;
    P.vy *= 1 - P.fric * dt;
    if (Math.hypot(P.vx, P.vy) < 0.05) { P.vx = 0; P.vy = 0; }
    P.x += P.vx * dt; P.y += P.vy * dt;

    // wall collide for player
    for (const w of walls.current) {
      if (circleRectColl(P.x, P.y, P.r, w.x, w.y, w.w, w.h)) {
        const left = Math.abs(P.x + P.r - (w.x - w.w / 2));
        const right = Math.abs(w.x + w.w / 2 - (P.x - P.r));
        const top = Math.abs(P.y + P.r - (w.y - w.h / 2));
        const bottom = Math.abs(w.y + w.h / 2 - (P.y - P.r));
        const m = Math.min(left, right, top, bottom);
        if (m === left) P.x = w.x - w.w / 2 - P.r - 0.001;
        else if (m === right) P.x = w.x + w.w / 2 + P.r + 0.001;
        else if (m === top) P.y = w.y - w.h / 2 - P.r - 0.001;
        else P.y = w.y + w.h / 2 + P.r + 0.001;
        P.vx *= 0.5; P.vy *= 0.5;
      }
    }
    // bounds
    P.x = clamp(P.x, -W / 2 + P.r, W / 2 - P.r);
    P.y = clamp(P.y, -H / 2 + P.r, H / 2 - P.r);

    // ----- aim: mouse (if pressed/space) else arrows else movement dir
    const usingMouse = keys.current.has("Space") || mouse.current.down;
    let targetAim = P.aim;
    if (usingMouse) {
      targetAim = Math.atan2(mouseWorld.y - P.y, mouseWorld.x - P.x);
    } else {
      let sx = 0, sy = 0;
      if (keys.current.has("ArrowUp")) sy -= 1;
      if (keys.current.has("ArrowDown")) sy += 1;
      if (keys.current.has("ArrowLeft")) sx -= 1;
      if (keys.current.has("ArrowRight")) sx += 1;
      if (sx || sy) targetAim = Math.atan2(sy, sx);
      else if (sp > 0.01) targetAim = Math.atan2(P.vy, P.vx);
    }
    P.aim = anglerp(P.aim, targetAim, Math.min(1, dt * 12));

    // ----- shoot
    P.cd -= dt;
    const fireGap = (ui.powerRapid > 0) ? P.rate * 0.5 : P.rate;
    if (P.cd <= 0) {
      let fired = false;
      let sx = 0, sy = 0;
      if (keys.current.has("ArrowUp")) sy -= 1;
      if (keys.current.has("ArrowDown")) sy += 1;
      if (keys.current.has("ArrowLeft")) sx -= 1;
      if (keys.current.has("ArrowRight")) sx += 1;
      if (sx || sy) {
        const L = Math.hypot(sx, sy) || 1, dx = sx / L, dy = sy / L;
        bullets.current.push({ x: P.x + dx * (P.r + 0.06), y: P.y + dy * (P.r + 0.06), vx: dx * 9.5, vy: dy * 9.5, life: 1.2, enemy: false });
        fired = true; P.aim = Math.atan2(dy, dx);
      } else if (usingMouse) {
        const dx = Math.cos(P.aim), dy = Math.sin(P.aim);
        bullets.current.push({ x: P.x + dx * (P.r + 0.06), y: P.y + dy * (P.r + 0.06), vx: dx * 9.5, vy: dy * 9.5, life: 1.2, enemy: false });
        fired = true;
      }
      if (fired) P.cd = fireGap;
    }

    // power-up timers
    setUI((s) => ({
      ...s,
      powerRapid: Math.max(0, s.powerRapid - dt),
      powerShield: Math.max(0, s.powerShield - dt),
    }));
    if (P.ifr > 0) P.ifr = Math.max(0, P.ifr - dt);

    // ----- enemies AI + walls
    for (const e of enemies.current) {
      updateEnemy(e, dt, P, addBullet);
      // collide with walls
      for (const w of walls.current) {
        if (circleRectColl(e.x, e.y, e.r, w.x, w.y, w.w, w.h)) {
          const left = Math.abs(e.x + e.r - (w.x - w.w / 2));
          const right = Math.abs(w.x + w.w / 2 - (e.x - e.r));
          const top = Math.abs(e.y + e.r - (w.y - w.h / 2));
          const bottom = Math.abs(w.y + w.h / 2 - (e.y - e.r));
          const m = Math.min(left, right, top, bottom);
          if (m === left) e.x = w.x - w.w / 2 - e.r - 0.001;
          else if (m === right) e.x = w.x + w.w / 2 + e.r + 0.001;
          else if (m === top) e.y = w.y - w.h / 2 - e.r - 0.001;
          else e.y = w.y + w.h / 2 + e.r + 0.001;
          e.vx *= 0.5; e.vy *= 0.5;
        }
      }
      // touch damage
      if (dist2(e.x, e.y, P.x, P.y) < (e.r + P.r + 0.02) ** 2) {
        if (ui.powerShield <= 0 && P.ifr <= 0) {
          P.ifr = 1.0;
          setUI((s) => ({ ...s, lives: s.lives - 1 }));
        }
      }
    }

    // ----- bullets
    const Wm = W / 2 + 0.5, Hm = H / 2 + 0.5;
    for (let i = bullets.current.length - 1; i >= 0; i--) {
      const b = bullets.current[i];
      b.life -= dt;
      if (b.life <= 0) { bullets.current.splice(i, 1); continue; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -Wm || b.x > Wm || b.y < -Hm || b.y > Hm) { bullets.current.splice(i, 1); continue; }

      // walls: reflect enemy, remove player
      for (const w of walls.current) {
        if (circleRectColl(b.x, b.y, 0.03, w.x, w.y, w.w, w.h)) {
          if (b.enemy) {
            b.vx *= -0.35; b.vy *= -0.35;
            const spd = Math.hypot(b.vx, b.vy), MIN = 4.5;
            if (spd < MIN) { const nx = b.vx / (spd || 1), ny = b.vy / (spd || 1); b.vx = nx * MIN; b.vy = ny * MIN; }
          } else {
            bullets.current.splice(i, 1);
          }
          break;
        }
      }

      // hits
      if (!b.enemy) {
        for (let j = enemies.current.length - 1; j >= 0; j--) {
          const e = enemies.current[j];
          if (dist2(b.x, b.y, e.x, e.y) < (0.03 + e.r) ** 2) {
            e.hp -= 1;
            bullets.current.splice(i, 1);
            if (e.hp <= 0) {
              // 5% drop
              if (Math.random() < 0.05) {
                const r = Math.random();
                const kind = r < 0.34 ? "rapid" : r < 0.67 ? "shield" : "life";
                pickups.current.push({ x: e.x, y: e.y, kind, life: 5.0, t: 0 });
              }
              enemies.current.splice(j, 1);
            }
            break;
          }
        }
      } else {
        if (dist2(b.x, b.y, P.x, P.y) < (0.03 + P.r) ** 2) {
          if (ui.powerShield <= 0 && P.ifr <= 0) {
            P.ifr = 1.0;
            setUI((s) => ({ ...s, lives: s.lives - 1 }));
          }
          bullets.current.splice(i, 1);
        }
      }
    }

    // ----- pickups: blink and collect
    for (let i = pickups.current.length - 1; i >= 0; i--) {
      const p = pickups.current[i];
      p.t += dt; p.life -= dt;
      if (p.life <= 2.0) p.blink = (Math.sin((2.0 - p.life) * 10) > 0) ? 0.35 : 1.0;
      if (dist2(p.x, p.y, P.x, P.y) < (0.16 + P.r) ** 2) {
        if (p.kind === "rapid") setUI((s) => ({ ...s, powerRapid: 8.0 }));
        if (p.kind === "shield") setUI((s) => ({ ...s, powerShield: Math.max(s.powerShield, 5.0) }));
        if (p.kind === "life") setUI((s) => ({ ...s, lives: s.lives + 1 }));
        pickups.current.splice(i, 1);
      } else if (p.life <= 0) {
        pickups.current.splice(i, 1);
      }
    }

    // ----- progress: spawn boss or advance
    const regularLeft = enemies.current.filter((e) => !e.type.startsWith("boss")).length;
    if (regularLeft === 0) {
      const hasBoss = enemies.current.some((e) => e.type.startsWith("boss"));
      if (!hasBoss) {
        const t = pickBoss(ui.level);
        const st = enemyStats(t, ui.level);
        enemies.current.push({ x: W * 0.25, y: 0, vx: 0, vy: 0, hp: st.hp, type: t, r: st.r, base: 0, t: 0, cd: 0 });
        setUI((s) => ({ ...s, boss: true }));
      } else {
        const bossAlive = enemies.current.some((e) => e.type.startsWith("boss"));
        if (!bossAlive) {
          setUI((s) => ({ ...s, boss: false, state: "interlude", level: s.level + 1 }));
        }
      }
    }

    // ----- lose conditions
    if (ui.time <= 0) setUI((s) => ({ ...s, lives: s.lives - 1, time: 10 }));
    if (ui.lives < 0) setUI((s) => ({ ...s, state: "gameover" }));

    // Update HUD enemy count
    setUI((s) => ({ ...s, enemies: enemies.current.filter((e) => !e.type.startsWith("boss")).length }));
  });

  // ---- render scene
  return (
    <>
      {/* walls */}
      {walls.current.map((w, i) => <Wall key={i} rect={w} />)}

      {/* player */}
      <Player position={[player.current.x, player.current.y, 0]} rotation={player.current.aim} />

      {/* enemies */}
      {enemies.current.map((e, i) => (
        <Enemy key={i} type={e.type} position={[e.x, e.y, 0]} />
      ))}

      {/* bullets */}
      {bullets.current.map((b, i) => (
        <Bullet key={i} position={[b.x, b.y, 0]} enemy={b.enemy} />
      ))}

      {/* pickups */}
      {pickups.current.map((p, i) => (
        <group key={i} position={[p.x, p.y, 0]} scale={p.blink || 1}>
          <PowerUp kind={p.kind} />
        </group>
      ))}
    </>
  );
}
