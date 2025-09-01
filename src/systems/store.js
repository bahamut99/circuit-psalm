import React, { createContext, useContext, useState } from "react";

const GameCtx = createContext(null);

export function GameProvider({ children }) {
  const [ui, setUI] = useState({
    state: "intro",      // intro | playing | paused | interlude | gameover
    level: 1,
    time: 60,
    lives: 3,
    enemies: 0,
    boss: false,
    powerRapid: 0,
    powerShield: 0,
  });
  return <GameCtx.Provider value={{ ui, setUI }}>{children}</GameCtx.Provider>;
}

export const useGame = () => useContext(GameCtx);
