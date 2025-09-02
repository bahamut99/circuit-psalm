import { dist2 } from './collision.js'

// spawn plan per level (easy first)
export function planSpawns(L, W, H){
  const list = []
  for (const s of L.spawns){
    for (let i=0;i<s.count;i++){
      const jx = (Math.random()-0.5)*8
      const jy = (Math.random()-0.5)*8
      list.push({
        kind: s.type,
        x: (s.x*W - W/2) + jx,
        y: (H/2 - s.y*H) + jy,
        hp: s.type==='turret' ? 5 : s.type==='spinner' ? 4 : 3,
        cd: 0
      })
    }
  }
  // boss at end of level
  if (L.boss){
    list.push({
      kind: 'boss',
      x:  W*0.25 - W/2,
      y:  0,
      hp: 30,
      cd: 0
    })
  }
  return list
}

export function updateAll(ctx){
  const { W,H, walls, dt, enemies, bullets, powerups,
    addBullet, addPowerUp, setArrays, setLives, powerRapid, powerShield } = ctx

  // move bullets
  const nb = []
  for (const b of bullets){
    const bb = { ...b, x: b.x + b.vx*dt, y: b.y + b.vy*dt, life: b.life - dt }
    if (bb.life > 0){
      // simple boundary check; let them stick at edge but not mid-screen
      if (Math.abs(bb.x) > W/2-0.5 || Math.abs(bb.y) > H/2-0.5){
        // delete when hits outer boundary
      } else nb.push(bb)
    }
  }

  // player proxy for homing etc (always 0,0 from Player.jsx start)
  const px = 0, py = 0
  const ne = []
  for (const e of enemies){
    const en = { ...e }
    en.cd -= dt
    if (e.kind==='chaser'){
      const dx = px - e.x, dy = py - e.y
      const l = Math.hypot(dx,dy) || 1
      const s = 12
      en.x += (dx/l)*s*dt; en.y += (dy/l)*s*dt
    } else if (e.kind==='spinner'){
      const t = performance.now()/1000
      en.x += Math.cos(t*1.2)*8*dt
      en.y += Math.sin(t*1.2)*8*dt
      if (en.cd<=0){
        const n=12, base=Math.random()*Math.PI*2, sp=30
        for(let k=0;k<n;k++){
          const a=base+(k/n)*Math.PI*2
          addBullet({ owner:'enemy', x:en.x, y:en.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, r:0.6, life:2.2, color:0xff5a5a })
        }
        en.cd=1.2
      }
    } else if (e.kind==='turret'){
      if (en.cd<=0){
        const a = Math.atan2(py-en.y, px-en.x) + (Math.random()*0.2-0.1)
        const sp = 28
        addBullet({ owner:'enemy', x:en.x, y:en.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, r:0.6, life:3.0, color:0xff5a5a })
        en.cd=0.7
      }
    } else if (e.kind==='boss'){
      // simple boss: slow orbit + burst
      const t = performance.now()/1000
      en.x += Math.cos(t*0.6)*6*dt
      en.y += Math.sin(t*0.9)*6*dt
      if (en.cd<=0){
        const n=24, base=Math.random()*Math.PI*2, sp=32
        for(let k=0;k<n;k++){
          const a=base+(k/n)*Math.PI*2
          addBullet({ owner:'enemy', x:en.x, y:en.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, r:0.7, life:3.2, color:0xffa54d })
        }
        en.cd=0.8
      }
    }
    ne.push(en)
  }

  // collisions: player at (0,0)
  const nEnemies = []
  for (const e of ne){
    let dead=false
    // player bullets -> enemies
    for (const b of nb){
      if (b.owner!=='player') continue
      if (dist2(b.x,b.y,e.x,e.y) < (1.6 + b.r)**2){
        e.hp -= 1
        b.life = 0
        if (e.hp<=0){ dead=true; break }
      }
    }
    if (!dead) nEnemies.push(e)
    else {
      // 5% drop
      if (Math.random()<0.05){
        const roll = Math.random()
        const kind = roll < 0.5 ? 'rapid' : (roll < 0.8 ? 'shield' : 'life')
        powerups.push({ id: -1, x:e.x, y:e.y, t:0, kind })
      }
    }
  }

  // enemy bullets -> player
  for (const b of nb){
    if (b.owner==='enemy' && dist2(b.x,b.y,0,0) < (1.6 + b.r)**2){
      // shield first
      if (powerShield<=0){
        setLives(l => l-1)
      }
      b.life = 0
    }
  }

  // update powerups timers
  const np = []
  for (const p of powerups){
    const t = p.t + dt
    if (t>5) continue
    // pickup?
    if (dist2(p.x,p.y,0,0) < (1.6+1.0)**2){
      if (p.kind==='rapid') ctx.setPowerRapid(8)
      else if (p.kind==='shield') ctx.setPowerShield(5)
      else ctx.addLife?.()
      continue
    }
    np.push({ ...p, t })
  }

  setArrays({ enemies: nEnemies, bullets: nb.filter(b=>b.life>0), powerups: np })
}
