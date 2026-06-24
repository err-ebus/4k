import { useEffect, useState } from "react";
import ColorBends from "./backgrounds/ColorBends.jsx";
import BlurText from "./text/BlurText.jsx";
import LyricsDebug from "./LyricsDebug.jsx";
import { lyrics } from "../config/lyrics.js";
import "./lyrics.css";

const DEBUG =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("debug");

// ColorBends + dark overlay + synced BlurText (section 7).
// Drives off audio.currentTime via the timeupdate event (~4x/sec, fine for
// line-level sync). Active line blurs in; previous line ghosts up & fades.
export default function LyricsScreen({ audioRef }) {
  const [active, setActive] = useState(null);
  const [prev, setPrev] = useState(null);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      const t = a.currentTime;
      const line = lyrics.findIndex((l) => t >= l.start && t < l.end);
      const idx = line === -1 ? null : line;
      setActive((cur) => {
        if (cur !== idx) setPrev(cur);
        return idx;
      });
    };
    a.addEventListener("timeupdate", onTime);
    return () => a.removeEventListener("timeupdate", onTime);
  }, [audioRef]);

  return (
    <div className="screen">
      {DEBUG && <LyricsDebug audioRef={audioRef} />}
      <ColorBends speed={0.15} />
      <div className="overlay-dark" />

      <div className="content lyrics-content">
        {prev != null && prev !== active && (
          <p key={`ghost-${prev}`} className="lyric-ghost">
            {lyrics[prev].text}
          </p>
        )}

        {active != null ? (
          <BlurText
            key={`active-${active}`}
            className="lyric-active"
            text={lyrics[active].text}
          />
        ) : (
          <p className="lyric-rest">♪</p>
        )}
      </div>
    </div>
  );
}
