import React from 'react'
import { useGameStore } from '../systems/store.js'

export default function HUD() {
  const { state, level, lives, timer, enemies, powerRapid, powerShield } = useGameStore(s => ({
    state: s.state,
    level: s.level,
    lives: s.lives,
    timer: s.timer,
    enemies: s.enemies.length,
    powerRapid: s.powerRapid,
    powerShield: s.powerShield
  }))
  const setState = useGameStore(s => s.setState)
  const reset = useGameStore(s => s.reset)

  return (
    <div className="hud">
      <div className="top">
        <div className="row">
          <div className="pill">LEVEL: {level}</div>
          <div className="pill">TIME: {Math.max(0, timer).toFixed(1)}</div>
          <div className="pill">LIVES: {lives}</div>
          <div className="pill">ENEMIES: {enemies}</div>
          <div className="pill">
            {powerShield>0 ? `🛡 ${powerShield.toFixed(1)}s ` : ''}
            {powerRapid>0 ? `⚡ ${powerRapid.toFixed(1)}s` : (powerShield<=0 ? '—' : '')}
          </div>
        </div>
        <div className="row">
          <div className="pill">WASD move</div>
          <div className="pill">Arrows or Mouse+Space shoot</div>
          <div className="pill">P pause · R restart</div>
        </div>
      </div>

      <div className="center">
        {state === 'intro' && (
          <>
            <h1>Circuit Psalm</h1>
            <p>Clear hostiles before time runs out. Boss at the end of each level.</p>
            <p>Press <b>Enter</b> to start.</p>
          </>
        )}
        {state === 'paused' && (
          <>
            <h1>PAUSED</h1>
            <p>Press <b>P</b> to resume.</p>
          </>
        )}
        {state === 'interlude' && (
          <>
            <h1>ACCESS GRANTED</h1>
            <p>Level cleared. Press <b>Enter</b> to continue.</p>
          </>
        )}
        {state === 'gameover' && (
          <>
            <h1>TRACE REJECTED</h1>
            <p>Out of lives. Press <b>Enter</b> to retry.</p>
          </>
        )}
      </div>

      <div className="foot">React Three Fiber • lightweight pooling • © you</div>
    </div>
  )
}
