import * as THREE from 'three'
import React from 'react'

export function useInputBindings(){
  const move = React.useRef(new THREE.Vector2())
  const shoot = React.useRef(new THREE.Vector2())
  const mouseAim = React.useRef(new THREE.Vector2())
  const res = { move: move.current, shoot: shoot.current, mouseAim: mouseAim.current }

  React.useEffect(() => {
    const keys = new Set()
    const onKeyDown = (e)=>{ keys.add(e.code) }
    const onKeyUp   = (e)=>{ keys.delete(e.code) }
    const onMouseMove = (e)=>{
      const rect = e.target?.getBoundingClientRect?.()
      if (!rect) return
      // map screen -> world (orthographic with zoom 80 and size ~100x56)
      const x = ((e.clientX - rect.left)/rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top)/rect.height) * 2 - 1)
      mouseAim.current.set(x, y) // not exact world units but direction works fine
    }
    const onMouseDown = ()=>{ /* using Space to shoot with mouse aim */ }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousemove', onMouseMove)

    const loop = ()=>{
      // WASD move
      const x = (keys.has('KeyD')||keys.has('ArrowRight')?1:0) - (keys.has('KeyA')||keys.has('ArrowLeft')?1:0)
      const y = (keys.has('KeyW')?1:0) - (keys.has('KeyS')?1:0)
      move.current.set(x, y)

      // Arrow keys shoot (or Space uses mouse)
      const sx = (keys.has('ArrowRight')?1:0) - (keys.has('ArrowLeft')?1:0)
      const sy = (keys.has('ArrowUp')?1:0) - (keys.has('ArrowDown')?1:0)
      if (sx||sy) shoot.current.set(sx, sy)
      else if (keys.has('Space')) shoot.current.copy(mouseAim.current)
      else shoot.current.set(0,0)

      raf = requestAnimationFrame(loop)
    }
    let raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('mousemove', onMouseMove); }
  }, [])

  return res
}
