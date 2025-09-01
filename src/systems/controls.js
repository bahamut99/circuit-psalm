import { useEffect, useRef } from "react";

// Live keyboard/mouse snapshot you can read inside useFrame
export function useInputSnapshot() {
  const keys = useRef(new Set());
  const mouse = useRef({ x: 0, y: 0, down: false });

  useEffect(() => {
    const kd = (e) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
      keys.current.add(e.code);
    };
    const ku = (e) => keys.current.delete(e.code);
    const mm = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    const md = (e) => { if (e.button === 0) mouse.current.down = true; };
    const mu = (e) => { if (e.button === 0) mouse.current.down = false; };

    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mousedown", md);
    window.addEventListener("mouseup", mu);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mousedown", md);
      window.removeEventListener("mouseup", mu);
    };
  }, []);

  return { keys, mouse };
}
