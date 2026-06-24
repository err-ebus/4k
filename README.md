# Por Que 💗

Mobile-first interactive site. Vite + React, deploy on Vercel.
Flow: **Intro ("Do you want 4K?")** → **Lyrics** (after Yes) → **Ending**.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Add your real content

| What | Where |
|---|---|
| Song MP3 | `src/assets/audio/por-que.mp3` (replace the silent placeholder; 128–192 kbps) |
| Lyrics + timestamps | `src/config/lyrics.js` — `{ text, start, end }` in seconds |
| Ending image | `src/assets/images/` — then point the import in `EndingScreen.jsx` at it |
| Ending message | `EndingScreen.jsx` (`te amo 💗` / subtitle) |

## Notes

- **Backgrounds** (`Orb`, `ColorBends`) and **text animations** (`BlurText`,
  `SplitText`) are hand-written ogl / framer-motion equivalents of the React
  Bits components named in the spec. Swap in the official copy-pasted versions
  any time — the props/usage line up.
- Only one WebGL background is mounted at a time (screens are conditionally
  rendered, never `display:none`). Shaders pause on `visibilitychange`.
- `usePointer()` drives the parallax characters: touch → mouse → gyro, all
  normalized to `-1..1`. iOS gyro permission is requested on the Yes tap.
- Respects `prefers-reduced-motion` (kills chase, parallax, idle float).

## Deploy

Push to GitHub → import in Vercel (auto-detects Vite). Test on a real iPhone
via the preview URL. Touch-drag the characters, try the No button, let the
song finish to reach the ending.
