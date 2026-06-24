# Por Que — Build Spec

Mobile-first interactive site. Vite + React. Deploy on Vercel.
Flow: **Intro (Do you want 4K?)** → **Lyrics (after Yes)** → **Ending**.

---

## 0. Legal / asset notes

- **Audio + lyrics text are yours to supply.** Drop your MP3 in `src/assets/audio/`. Put the real lyric lines + timestamps in `src/config/lyrics.js`. The repo ships with a placeholder so nothing breaks before you fill it in.
- Keep the MP3 at 128–192 kbps (Vercel free-tier bandwidth).
- Ending image goes in `src/assets/images/`.

---

## 1. Stack & dependencies

```
React + Vite (already scaffolded)
ogl                      → Orb + Color Bends backgrounds (lightweight WebGL)
framer-motion            → BlurText / SplitText (CSS-composited, cheap)
```

React Bits components are **copy-pasted**, not npm-installed. Pull each from reactbits.dev (pick JS-CSS or TS-CSS variant to match your project):

- `Orb` (Backgrounds) — intro
- `Color Bends` (Backgrounds) — lyrics
- `BlurText` (Text Animations) — lyric lines + ending message
- `SplitText` (Text Animations) — "Do you want 4K?" title

---

## 2. Screen state machine (`App.jsx`)

Single source of truth. **Conditional-render screens — never `display:none`** (a hidden WebGL background still burns GPU; unmounting kills it).

```
type Screen = "intro" | "playing" | "ending"

intro   → Yes clicked → start audio + request gyro perm → "playing"
playing → audio "ended" event → "ending"
ending  → Restart button → reset audio, → "intro"
```

Only ONE WebGL background mounted at any time, enforced by this conditional render.

---

## 3. The load-bearing piece: `usePointer()` hook

One shared pointer tracker. Feeds the cute characters. Input priority: **touch (primary) → mouse (desktop fallback) → gyro (bonus)**, all normalized to the same `{x, y}` in range `-1..1`. Idle float lives in the character CSS, not here, so characters are never static even with zero input.

```js
// src/hooks/usePointer.js
import { useEffect, useRef, useState } from "react";

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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // characters stay at idle position

    const norm = (v, size) => (v / size) * 2 - 1; // 0..size → -1..1

    const onMouse = (e) => {
      next.current = { x: norm(e.clientX, innerWidth), y: norm(e.clientY, innerHeight) };
      schedule();
    };
    const onTouch = (e) => {
      const t = e.touches[0];
      if (!t) return;
      next.current = { x: norm(t.clientX, innerWidth), y: norm(t.clientY, innerHeight) };
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
```

### iOS gyro permission — fire on the Yes tap

iOS Safari gates `deviceorientation` behind a user-gesture permission call. The Yes click already needs a user gesture (for audio), so unlock both there:

```js
// inside the Yes button onClick, BEFORE setScreen("playing")
async function unlockMotion() {
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === "function") {
    try { await DOE.requestPermission(); } catch { /* denied → touch+idle still work */ }
  }
}
```

Denial is silent and harmless — touch-drag + idle float cover everyone.

---

## 4. Cute characters

3–6 sprites (SVG/emoji blobs, hearts, a mascot). Decorative layer, **`pointer-events: none`** so finger drags pass through to buttons.

```jsx
function Characters() {
  const { x, y } = usePointer();
  const sprites = [
    { emoji: "💗", depth: 30, base: { left: "15%", top: "20%" } },
    { emoji: "⭐", depth: 18, base: { left: "75%", top: "30%" } },
    { emoji: "🫧", depth: 45, base: { left: "60%", top: "70%" } },
    // 3–6 max
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      {sprites.map((s, i) => (
        <span
          key={i}
          className="floaty"            /* idle bob keyframe */
          style={{
            position: "absolute",
            ...s.base,
            fontSize: 40,
            willChange: "transform",   /* GPU layer */
            transform: `translate(${x * s.depth}px, ${y * s.depth}px)`,
            transition: "transform 0.15s ease-out",
          }}
        >{s.emoji}</span>
      ))}
    </div>
  );
}
```

```css
@keyframes floaty { 0%,100% { translate: 0 0 } 50% { translate: 0 -8px } }
.floaty { animation: floaty 3s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .floaty { animation: none; } }
```

> Note: idle uses the `translate` property, parallax uses `transform` — separate channels so they don't overwrite each other. (Or compose both in one transform if you prefer.)

**Different `depth` per sprite = parallax.** Higher depth = moves more = feels closer.

---

## 5. The "No" button trap

Desktop and mobile diverge (decided earlier):

- **Desktop:** No runs from the cursor. On each near-miss, spawn a heart/sparkle that floats up & fades.
- **Mobile:** No shrinks on each tap, Yes grows — repeat until No is tiny and Yes dominates. Add a tiny recoil shake on No, bounce on Yes.
- **Both:** Yes is always clickable. After ~3 No attempts, optional caption: *"the answer was always yes 🤭"*.
- **`prefers-reduced-motion`:** disable the chase; fall back to the shrink/grow on both platforms (a fleeing target is unusable with VoiceOver/AssistiveTouch).

Detect platform with a pointer-type check, not screen width:
```js
const isTouch = window.matchMedia("(pointer: coarse)").matches;
```

Easing for all the cute motion: `cubic-bezier(0.34, 1.56, 0.64, 1)` (soft overshoot).

---

## 6. Backgrounds

| Screen | Component | Key props | Notes |
|---|---|---|---|
| Intro | `Orb` | `hue={280}` `hoverIntensity={0.4}` `rotateOnHover` | Buttons + characters overlay above it |
| Lyrics | `Color Bends` | low speed | Dark overlay `rgba(0,0,0,.45)` on top for text legibility |
| Ending | — | — | Static CSS gradient, GPU cooldown |

Pause shaders when tab hidden:
```js
useEffect(() => {
  const onVis = () => { /* set a paused flag the shader's rAF loop checks */ };
  document.addEventListener("visibilitychange", onVis);
  return () => document.removeEventListener("visibilitychange", onVis);
}, []);
```

---

## 7. Lyrics sync

Drive off `audio.currentTime` via the `timeupdate` event, matched to `src/config/lyrics.js` (`{ text, start, end }` in seconds). Active line animates in with `BlurText`; previous line ghosts up & fades.

```jsx
const [active, setActive] = useState(null);
useEffect(() => {
  const a = audioRef.current;
  const onTime = () => {
    const t = a.currentTime;
    const line = lyrics.findIndex((l) => t >= l.start && t < l.end);
    setActive(line === -1 ? null : line);
  };
  a.addEventListener("timeupdate", onTime);
  return () => a.removeEventListener("timeupdate", onTime);
}, []);
```

`timeupdate` fires ~4×/sec — fine for line-level sync. For tighter per-word timing later, swap to a rAF loop reading `currentTime`.

---

## 8. File structure

```
src/
  App.jsx                  # screen state machine
  hooks/
    usePointer.js          # ← section 3
  components/
    backgrounds/
      Orb.jsx              # from React Bits
      ColorBends.jsx       # from React Bits
    text/
      BlurText.jsx         # from React Bits
      SplitText.jsx        # from React Bits
    Characters.jsx         # ← section 4
    IntroScreen.jsx        # Orb + title + Yes/No trap + Characters
    LyricsScreen.jsx       # ColorBends + overlay + synced BlurText
    EndingScreen.jsx       # gradient + image slot + message + restart
  config/
    lyrics.js              # ← YOU fill timestamps
  assets/
    audio/por-que.mp3      # ← YOU add
    images/ending.png      # ← YOU add
```

---

## 9. Performance rules (the non-negotiables)

1. One WebGL background mounted at a time (conditional render, not hidden).
2. No `three.js` components — `ogl`-based only (Orb, Color Bends both qualify).
3. rAF-throttle ALL pointer/tilt handlers — never `setState` on raw events.
4. `transform` only for movement (never `top`/`left`); `will-change: transform` on animated nodes.
5. `prefers-reduced-motion` → kill chase + parallax + idle; static fallbacks everywhere.
6. Pause shaders on `visibilitychange`.
7. Characters capped at 6; particles (if used) intro-only, count ≤ 50.
8. Character layer `pointer-events: none` so it never blocks buttons.

---

## 10. Build order (suggested)

1. State machine in `App.jsx` with 3 placeholder screens + transitions working.
2. Drop in `Orb` on intro, `Color Bends` on lyrics — confirm mount/unmount swaps cleanly.
3. `usePointer()` + `Characters` — verify touch-drag moves them on a real phone.
4. Yes/No trap (platform split).
5. Audio wiring + iOS gyro unlock on Yes tap.
6. Lyrics sync with placeholder timestamps, then fill real ones.
7. Ending screen.
8. Pass over the 9 performance rules.
9. Push to GitHub → import in Vercel (auto-detects Vite). Test on your actual iPhone via the preview URL before merging.
```
