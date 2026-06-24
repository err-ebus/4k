import { useCallback, useRef, useState } from "react";
import IntroScreen from "./components/IntroScreen.jsx";
import LyricsScreen from "./components/LyricsScreen.jsx";
import EndingScreen from "./components/EndingScreen.jsx";
import audioUrl from "./assets/audio/por-que.mp3";

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
      a.currentTime = 0;
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
