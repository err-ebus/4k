import { useEffect, useRef, useState } from "react";

// One shared pointer tracker (section 3 of BUILD_SPEC).
// Input priority: touch (primary) -> mouse (desktop fallback) -> gyro (bonus).
// All normalized to { x, y } in range -1..1.
export function usePointer() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const raf = useRef(null);
  const next = useRef({ x: 0, y: 0 });

  // rAF-throttled commit — never setState on raw events (main jank source)
  const commit = () => {
    setPos(next.current);
    raf.current = null;
  };
  const schedule = () => {
    if (raf.current == null) raf.current = requestAnimationFrame(commit);
  };

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return; // characters stay at idle position

    const norm = (v, size) => (v / size) * 2 - 1; // 0..size -> -1..1

    const onMouse = (e) => {
      next.current = {
        x: norm(e.clientX, window.innerWidth),
        y: norm(e.clientY, window.innerHeight),
      };
      schedule();
    };
    const onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      next.current = {
        x: norm(t.clientX, window.innerWidth),
        y: norm(t.clientY, window.innerHeight),
      };
      schedule();
    };
    const onTilt = (e) => {
      // gamma: left/right tilt (-90..90), beta: front/back (-180..180)
      if (e.gamma == null) return;
      next.current = {
        x: Math.max(-1, Math.min(1, e.gamma / 45)),
        y: Math.max(-1, Math.min(1, (e.beta - 45) / 45)),
      };
      schedule();
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("deviceorientation", onTilt);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return pos; // { x: -1..1, y: -1..1 }
}

// iOS Safari gates deviceorientation behind a user-gesture permission call.
// Call this inside the Yes button onClick, BEFORE setScreen("playing").
export async function unlockMotion() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    try {
      await DOE.requestPermission();
    } catch {
      /* denied -> touch + idle still work */
    }
  }
}
