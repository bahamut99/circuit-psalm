import { create } from 'zustand'

let nextId = 1
const uid = () => nextId++

const initial = {
  state: 'intro',
  level: 1,
  lives: 3,
  timer: 60,
  powerRapid: 0,
  powerShield: 0,
  enemies: [],
  bullets: [],
  powerups: [],
}

export const useGameStore = create((set, get) => ({
  ...initial,

  setState: (state) => set({ state }),
  setLevel: (level) => set({ level }),
  setTimer: (timerOrFn) => set(s => ({ timer: typeof timerOrFn==='function' ? timerOrFn(s.timer) : timerOrFn })),
  setLives: (livesOrFn) => set(s => ({ lives: typeof livesOrFn==='function' ? livesOrFn(s.lives) : livesOrFn })),
  addLife: () => set(s => ({ lives: s.lives + 1 })),

  setPowerRapid: (v) => set({ powerRapid: v }),
  setPowerShield: (v) => set({ powerShield: v }),

  addEnemy: (e) => set(s => ({ enemies: [...s.enemies, { id: uid(), ...e }] })),
  addBullet: (b) => set(s => ({ bullets: [...s.bullets, { id: uid(), ...b }] })),
  addPowerUp: (p) => set(s => ({ powerups: [...s.powerups, { id: uid(), ...p }] })),

  setArrays: (obj) => set(obj),
  clearArrays: () => set({ enemies: [], bullets: [], powerups: [] }),

  reset: () => set({ ...initial }),
}))
