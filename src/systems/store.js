// src/systems/store.js
import { create } from 'zustand';

const initial = {
  state: 'intro',   // 'intro' | 'playing' | 'paused' | 'interlude' | 'gameover'
  level: 1,
  lives: 3,
  score: 0,
  timer: 60,
  powerRapid: 0,
  powerShield: 0,
};

export const useGameStore = create((set, get) => ({
  ...initial,

  // setters
  setState: (state) => set({ state }),
  setLevel: (level) => set({ level }),
  setTimer: (timer) => set({ timer }),
  setLives: (lives) => set({ lives }),

  // counters
  addScore: (v) => set({ score: get().score + v }),
  addLife: () => set({ lives: get().lives + 1 }),
  loseLife: () => set({ lives: Math.max(0, get().lives - 1) }),

  // power ups
  setPowerRapid: (t) => set({ powerRapid: t }),
  setPowerShield: (t) => set({ powerShield: t }),

  // reset everything
  reset: () => set({ ...initial }),
}));

// Back-compat alias in case other files import `useStore`
export const useStore = useGameStore;
export default useGameStore;
