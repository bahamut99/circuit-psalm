import React from "react";
import { useGame } from "../systems/store.js";

const Pill = ({ children }) => (
  <div style={{
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.15)",
    borderRadius: 999, padding: "6px 10px", fontSize: 14, pointerEvents: "none"
  }}>{children}</div>
);

const Center = ({ children }) => (
  <div style={{ textTransform: "uppercase", letterSpacing: 1 }}>
    <h1 style={{ margin: "0 0 10px", fontSize: "clamp(22px,3vw,36px)" }}>{children[0].props.children}</h1>
    {children.slice(1)}
  </div>
);

export default function HUD() {
  const { ui } = useGame();
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", color: "#fff",
      display: "grid", gridTemplateRows: "auto 1fr auto", fontFamily: "ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill>LEVEL: {ui.level}</Pill>
          <Pill>TIME: {ui.time.toFixed(1)}</Pill>
          <Pill>LIVES: {ui.lives}</Pill>
          <Pill>{ui.boss ? "BOSS" : `ENEMIES: ${ui.enemies}`}</Pill>
          <Pill>{ui.powerShield>0 ? `🛡 ${ui.powerShield.toFixed(1)}s` : "—"} {ui.powerRapid>0 ? ` ⚡ ${ui.powerRapid.toFixed(1)}s` : ""}</Pill>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill>Move: WASD</Pill>
          <Pill>Shoot: Arrows / Mouse+Space</Pill>
          <Pill>P pause · R restart</Pill>
        </div>
      </div>

      <div style={{ placeSelf: "center", textAlign: "center", maxWidth: "min(90vw, 820px)" }}>
        {ui.state === "intro" && (
          <Center>
            <h1>CIRCUIT PSALM</h1>
            <p>NieR-style cyberspace hack shooter. Clear waves → fight a boss.</p>
            <p>Power-ups: ⚡ Rapid, 🛡 Shield, ❤️ Life (5% drop, blink at 3s, despawn at 5s).</p>
            <p>Press <b>Enter</b> to jack in.</p>
          </Center>
        )}
        {ui.state === "interlude" && (
          <Center>
            <h1>ACCESS GRANTED</h1>
            <p>Level {ui.level - 1} cleared. Press <b>Enter</b> to continue.</p>
          </Center>
        )}
        {ui.state === "paused" && (
          <Center>
            <h1>PAUSED</h1>
            <p>Press <b>P</b> to resume.</p>
          </Center>
        )}
        {ui.state === "gameover" && (
          <Center>
            <h1>TRACE REJECTED</h1>
            <p>Out of lives. Press <b>Enter</b> to retry from Level 1.</p>
          </Center>
        )}
      </div>

      <div style={{ alignSelf: "end", padding: "8px 14px", opacity: 0.65, fontSize: 12 }}>
        Circuit Psalm — React Three Fiber
      </div>
    </div>
  );
}
