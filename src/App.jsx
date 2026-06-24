import { useCallback, useRef, useState } from "react";
import IntroScreen from "./components/IntroScreen.jsx";
import LyricsScreen from "./components/LyricsScreen.jsx";
import EndingScreen from "./components/EndingScreen.jsx";
import { lyrics } from "./config/lyrics.js";
import audioUrl from "./assets/audio/por-que.mp3";

// Start the song at the first "Por que" chorus (skip the intro + Verse 1).
// Derived from the lyrics so it stays correct if timings are re-synced.
// Set to 0 to play from the very beginning instead.
const firstChorus = lyrics.find((l) => /^por\s*que/i.test(l.text));
const START_AT = firstChorus ? Math.max(0, firstChorus.start - 0.4) : 0;

// Screen state machine (section 2). Single source of truth.
// "intro" | "playing" | "ending"
// Screens are CONDITIONALLY RENDERED — never display:none — so only one
// WebGL background is ever mounted at a time.
export default function App() {
  const [screen, setScreen] = useState("intro");
  const audioRef = useRef(null);

  // intro -> Yes clicked -> start audio (gyro perm unlocked in IntroScreen) -> playing
  const handleYes = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.currentTime = START_AT; // start at the chorus
      a.play().catch(() => {
        /* autoplay block is unlikely here — Yes is a user gesture */
      });
    }
    setScreen("playing");
  }, []);

  // playing -> audio "ended" -> ending
  const handleEnded = useCallback(() => setScreen("ending"), []);

  // ending -> Restart -> reset audio -> intro
  const handleRestart = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setScreen("intro");
  }, []);

  return (
    <>
      {/* Single shared <audio>. Lives outside the screens so it survives the
          intro -> playing render swap without re-mounting. */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="auto"
        onEnded={handleEnded}
      />

      {screen === "intro" && <IntroScreen onYes={handleYes} />}
      {screen === "playing" && <LyricsScreen audioRef={audioRef} />}
      {screen === "ending" && <EndingScreen onRestart={handleRestart} />}
    </>
  );
}
