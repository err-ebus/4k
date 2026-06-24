import { useCallback, useRef, useState } from "react";
import IntroScreen from "./components/IntroScreen.jsx";
import LyricsScreen from "./components/LyricsScreen.jsx";
import EndingScreen from "./components/EndingScreen.jsx";
import { SONG_START, SONG_END } from "./config/lyrics.js";
import audioUrl from "./assets/audio/por-que.mp3";

// Play only the chorus->end slice of the song.
const START_AT = SONG_START;

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

  // We stop early at SONG_END (the slice end) instead of the real file end,
  // so transition to the ending screen as soon as currentTime passes it.
  const handleTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime >= SONG_END) {
      a.pause();
      handleEnded();
    }
  }, [handleEnded]);

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
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {screen === "intro" && <IntroScreen onYes={handleYes} />}
      {screen === "playing" && <LyricsScreen audioRef={audioRef} />}
      {screen === "ending" && <EndingScreen onRestart={handleRestart} />}
    </>
  );
}
