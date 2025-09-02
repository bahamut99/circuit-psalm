import { create } from 'zustand'

/**
 * Central game state used by Level/HUD and the asset renderers.
 * Matches all calls made from Level.jsx and Player.jsx.
 */
export const useGameStore = create((set, get) => ({
  // meta
  state: 'intro',         // 'intro' | 'playing' | 'paused' | 'interlude' | 'gameover'
  level: 1,
  lives: 3,
  timer: 60,

  // powers
  powerRapid: 0,
  powerShield: 0,

  // world arrays
  enemies: [],
  bullets: [],
  powerups: [],

  // ---- setters / helpers ----
  setState: (s) => set({ state: s }),
  setLevel: (n) => set({ level: n }),
  setTimer: (v) =>
    set((st) => ({ timer: typeof v === 'function' ? v(st.timer) : v })),
  setLives: (v) =>
    set((st) => ({ lives: typeof v === 'function' ? v(st.lives) : v })),
  addLife: () => set((st) => ({ lives: st.lives + 1 })),

  setPowerRapid: (v) => set({ powerRapid: v }),
  setPowerShield: (v) => set({ powerShield: v }),

  addEnemy: (e) => set((st) => ({ enemies: [...st.enemies, e] })),
  addBullet: (b) => set((st) => ({ bullets: [...st.bullets, b] })),
  addPowerUp: (p) => set((st) => ({ powerups: [...st.powerups, p] })),

  setArrays: (o) =>
    set((st) => ({
      enemies: o.enemies ?? st.enemies,
      bullets: o.bullets ?? st.bullets,
      powerups: o.powerups ?? st.powerups,
    })),

  clearArrays: () => set({ enemies: [], bullets: [], powerups: [] }),

  reset: () =>
    set({
      state: 'intro',
      level: 1,
      lives: 3,
      timer: 60,
      powerRapid: 0,
      powerShield: 0,
      enemies: [],
      bullets: [],
      powerups: [],
    }),
}))
