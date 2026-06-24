import { useEffect, useState } from "react";
import ColorBends from "./backgrounds/ColorBends.jsx";
import BlurText from "./text/BlurText.jsx";
import LyricsDebug from "./LyricsDebug.jsx";
import { lyrics } from "../config/lyrics.js";
import "./lyrics.css";

const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug");

// ColorBends + dark overlay + karaoke-style synced lyrics (section 7).
// Shows the previous + next lines dimmed around the bright current line.
// Driven off audio.currentTime via timeupdate (~4x/sec, fine for line sync).
export default function LyricsScreen({ audioRef }) {
  // Only re-render when the displayed line changes — not on every timeupdate
  // (~4x/sec) — so the active line's blur-in animation isn't restarted.
  const [{ anchor, active }, setView] = useState({ anchor: -1, active: -1 });

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      const t = a.currentTime;
      // active = line whose [start,end) window contains t (bright)
      const nextActive = lyrics.findIndex((l) => t >= l.start && t < l.end);
      // anchor = last line that has started (stays put during instrumental gaps)
      let nextAnchor = -1;
      for (let i = 0; i < lyrics.length; i++) {
        if (t >= lyrics[i].start) nextAnchor = i;
        else break;
      }
      setView((v) =>
        v.anchor === nextAnchor && v.active === nextActive
          ? v
          : { anchor: nextAnchor, active: nextActive }
      );
    };
    a.addEventListener("timeupdate", onTime);
    onTime();
    return () => a.removeEventListener("timeupdate", onTime);
  }, [audioRef]);

  const started = anchor >= 0;
  const isActive = active !== -1 && active === anchor;

  const prevText = started && anchor - 1 >= 0 ? lyrics[anchor - 1].text : "";
  const curText = started ? lyrics[anchor].text : "";
  const nextText = started
    ? anchor + 1 < lyrics.length
      ? lyrics[anchor + 1].text
      : ""
    : lyrics[0]?.text ?? "";

  return (
    <div className="screen">
      {DEBUG && <LyricsDebug audioRef={audioRef} />}
      <ColorBends speed={0.15} />
      <div className="overlay-dark" />

      <div className="content lyrics-content">
        <p className="lyric-adj">{prevText}</p>

        {started ? (
          isActive ? (
            <BlurText
              key={`a-${anchor}`}
              className="lyric-active"
              text={curText}
            />
          ) : (
            <p className="lyric-active lyric-dim">{curText}</p>
          )
        ) : (
          <p className="lyric-rest">♪</p>
        )}

        <p className="lyric-adj">{nextText}</p>
      </div>
    </div>
  );
}
