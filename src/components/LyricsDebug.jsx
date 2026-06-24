import { useEffect, useRef, useState } from "react";
import { lyrics } from "../config/lyrics.js";
import "./debug.css";

// Tap-to-sync tool. Enabled with ?debug in the URL — never renders otherwise.
// Workflow:
//   1. Click Yes so the song is playing.
//   2. (Optional) Jump to a section — e.g. the "Porque" chorus — instead of
//      waiting through the intro. Marking continues from the line you jump to.
//   3. Press SPACE (or Mark) exactly when each lyric line STARTS.
//   4. Hit Export and paste the generated RAW array into src/config/lyrics.js.
// Undo (Z) fixes a mistimed tap; Reset clears everything.

// indices of lines that begin the "Porque" chorus, for the quick-jump button
const PORQUE_LINES = lyrics
  .map((l, i) => (/^porque/i.test(l.text) ? i : -1))
  .filter((i) => i >= 0);

export default function LyricsDebug({ audioRef }) {
  const [t, setT] = useState(0);
  // marks[i] = start time for line i (null = not marked yet, keeps estimate)
  const [marks, setMarks] = useState(() => lyrics.map(() => null));
  const [cursor, setCursor] = useState(0); // next line to mark
  const [showOut, setShowOut] = useState(false);
  const ref = useRef({ marks, cursor });
  ref.current = { marks, cursor };

  // live clock
  useEffect(() => {
    let raf;
    const tick = () => {
      const a = audioRef.current;
      if (a) setT(a.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioRef]);

  const mark = () => {
    const a = audioRef.current;
    if (!a) return;
    const { cursor: c } = ref.current;
    if (c >= lyrics.length) return;
    setMarks((m) => {
      const next = m.slice();
      next[c] = +a.currentTime.toFixed(1);
      return next;
    });
    setCursor((c2) => Math.min(lyrics.length, c2 + 1));
  };

  const undo = () => {
    const c = Math.max(0, ref.current.cursor - 1);
    setMarks((m) => {
      const next = m.slice();
      next[c] = null;
      return next;
    });
    setCursor(c);
  };

  const reset = () => {
    setMarks(lyrics.map(() => null));
    setCursor(0);
    setShowOut(false);
  };

  const seek = (d) => {
    const a = audioRef.current;
    if (a) a.currentTime = Math.max(0, a.currentTime + d);
  };

  // Jump audio to a line and set the marking cursor there.
  const jumpTo = (idx) => {
    const a = audioRef.current;
    if (!a) return;
    const { marks: m } = ref.current;
    const time = m[idx] ?? lyrics[idx].start;
    a.currentTime = Math.max(0, time - 1); // start 1s early so you catch the cue
    setCursor(idx);
  };

  // SPACE = mark, Z = undo
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        mark();
      } else if (e.key === "z" || e.key === "Z") {
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nextLine =
    cursor < lyrics.length ? lyrics[cursor].text : "— all lines marked —";
  const markedCount = marks.filter((x) => x != null).length;
  const fmt = (s) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const out =
    "const RAW = [\n" +
    lyrics
      .map((l, idx) => {
        const start = marks[idx];
        const text = l.text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return start == null
          ? `  ["${text}", ${l.start}], // estimate`
          : `  ["${text}", ${start}],`;
      })
      .join("\n") +
    "\n];";

  return (
    <div className="dbg">
      <div className="dbg-clock">
        {fmt(t)} <span>({t.toFixed(1)}s)</span>
        <span className="dbg-count">
          {markedCount}/{lyrics.length} marked
        </span>
      </div>

      <div className="dbg-next">
        <span>mark line {cursor + 1}:</span>
        <b>{nextLine}</b>
      </div>

      <div className="dbg-row">
        <button onClick={mark}>Mark ␣</button>
        <button onClick={undo}>Undo Z</button>
        <button onClick={() => seek(-5)}>-5s</button>
        <button onClick={() => seek(5)}>+5s</button>
        <button onClick={reset}>Reset</button>
        <button onClick={() => setShowOut((s) => !s)}>
          {showOut ? "Hide" : "Export"}
        </button>
      </div>

      <div className="dbg-row">
        {PORQUE_LINES.map((idx, n) => (
          <button key={idx} className="dbg-jump" onClick={() => jumpTo(idx)}>
            ⤓ Porque {n + 1}
          </button>
        ))}
        <select
          className="dbg-select"
          value=""
          onChange={(e) => e.target.value !== "" && jumpTo(+e.target.value)}
        >
          <option value="">jump to line…</option>
          {lyrics.map((l, idx) => (
            <option key={idx} value={idx}>
              {idx + 1}. {l.text.slice(0, 32)}
            </option>
          ))}
        </select>
      </div>

      {showOut && (
        <textarea
          className="dbg-out"
          readOnly
          value={out}
          onFocus={(e) => e.target.select()}
        />
      )}
    </div>
  );
}
