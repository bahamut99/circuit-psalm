import React, { useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// NOTE: Option A — gameplay components live in src/assets/
import Player   from './Player.jsx'
import Enemy    from './Enemy.jsx'
import Bullet   from './Bullet.jsx'
import PowerUp  from './PowerUp.jsx'

// Systems & store are in ../systems/
import * as Levels    from '../systems/levels.js'
import * as Enemies   from '../systems/enemies.js'
import * as Controls  from '../systems/controls.js'
import * as Collision from '../systems/collision.js'
import { useGameStore } from '../systems/store.js'

export default function Level(){
  const { size } = useThree()
  const W = 100, H = 56 // world units for an ~16:9 arena

  // game state & setters
  const state          = useGameStore(s => s.state)
  const setState       = useGameStore(s => s.setState)
  const level          = useGameStore(s => s.level)
  const setLevel       = useGameStore(s => s.setLevel)
  const lives          = useGameStore(s => s.lives)
  const setLives       = useGameStore(s => s.setLives)
  const setTimer       = useGameStore(s => s.setTimer)

  const powerRapid     = useGameStore(s => s.powerRapid)
  const powerShield    = useGameStore(s => s.powerShield)
  const setPowerRapid  = useGameStore(s => s.setPowerRapid)
  const setPowerShield = useGameStore(s => s.setPowerShield)
  const addLife        = useGameStore(s => s.addLife)

  // arrays
  const enemies   = useGameStore(s => s.enemies)
  const bullets   = useGameStore(s => s.bullets)
  const powerups  = useGameStore(s => s.powerups)
  const setArrays = useGameStore(s => s.setArrays)
  const addEnemy  = useGameStore(s => s.addEnemy)
  const addBullet = useGameStore(s => s.addBullet)
  const addPowerUp= useGameStore(s => s.addPowerUp)
  const clearArrays = useGameStore(s => s.clearArrays)

  // input bindings (WASD move, Arrows shoot, Space=mouse-aim shoot)
  const input = Controls.useInputBindings()

  // build wall boxes for collisions
  const walls = useMemo(() => Levels.buildWalls(level, W, H), [level])
  const wallBoxes = useMemo(
    () => walls.map(w => new THREE.Box2(
      new THREE.Vector2(w.x, w.y),
      new THREE.Vector2(w.x + w.w, w.y + w.h)
    )),
    [walls]
  )

  // start / advance / restart
  useEffect(() => {
    function onKey(e){
      if (e.code === 'Enter'){
        if (state === 'intro'){ setState('playing'); bootLevel(1) }
        else if (state === 'interlude'){ setState('playing'); bootLevel(level + 1) }
        else if (state === 'gameover'){ setState('intro'); setLevel(1); setLives(3); clearArrays() }
      }
      if (e.code === 'KeyP' && state==='playing') setState('paused')
      else if (e.code==='KeyP' && state==='paused') setState('playing')

      if (e.code === 'KeyR'){ setState('intro'); setLevel(1); setLives(3); clearArrays() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, level])

  function bootLevel(idx){
    setLevel(idx)
    clearArrays()
    const L = Levels.LEVELS[(idx-1) % Levels.LEVELS.length]
    setTimer(L.time)

    // spawn enemies as planned for this level
    const spawns = Enemies.planSpawns(L, W, H)
    for (const s of spawns) addEnemy(s)
  }

  // main loop
  useFrame((_, dt) => {
    if (dt > 0.05) dt = 0.05
    if (state !== 'playing') return

    // countdown
    setTimer(t => {
      const nt = t - dt
      if (nt <= 0 && enemies.length > 0){
        // time-out costs a life but gives a small grace timer
        setLives(l => l - 1)
        return 10
      }
      return nt
    })

    // power-up timers
    setPowerRapid(Math.max(0, powerRapid - dt))
    setPowerShield(Math.max(0, powerShield - dt))

    // update everything (movement, shooting, collisions, powerups, drops)
    Enemies.updateAll({
      W, H, walls: wallBoxes, dt, input,
      enemies, bullets, powerups,
      addBullet, addPowerUp, setArrays, setLives,
      powerRapid, powerShield,
      setPowerRapid, setPowerShield, addLife
    })

    // level clear
    if (enemies.length === 0) setState('interlude')
    // out of lives
    if (lives < 0) setState('gameover')
  })

  // render: beveled wall meshes + lights + entities
  return (
    <group>
      {walls.map((w,i)=>(
        <group
          key={i}
          position={[w.x + w.w/2 - W/2, H/2 - (w.y + w.h/2), 0]}
        >
          <mesh>
            <boxGeometry args={[w.w, w.h, 2]} />
            <meshStandardMaterial color="#2b2b2b" emissive="#222" metalness={0.2} roughness={0.8}/>
          </mesh>
          <mesh position={[0,0,1]}>
            <boxGeometry args={[w.w-1, w.h-1, 0.5]} />
            <meshStandardMaterial color="#5a5a5a" emissive="#444" metalness={0.1} roughness={0.9} />
          </mesh>
        </group>
      ))}

      <ambientLight intensity={0.6}/>
      <directionalLight position={[2,4,6]} intensity={0.6}/>

      <Player W={W} H={H} walls={wallBoxes} input={input} />
      {enemies.map(e => <Enemy key={e.id} data={e} />)}
      {bullets.map(b => <Bullet key={b.id} data={b} />)}
      {powerups.map(p => <PowerUp key={p.id} data={p} />)}
    </group>
  )
}
