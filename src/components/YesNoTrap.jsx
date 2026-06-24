import { useCallback, useRef, useState } from "react";

const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const isTouch =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;
const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// A fleeing target is unusable with VoiceOver/AssistiveTouch, so reduced-motion
// always falls back to the shrink/grow behavior on both platforms.
const useChase = !isTouch && !reduceMotion;

let heartId = 0;

export default function YesNoTrap({ onYes }) {
  const [noPos, setNoPos] = useState({ x: 0, y: 0 }); // desktop dodge offset
  const [attempts, setAttempts] = useState(0); // mobile taps / dodge count
  const [hearts, setHearts] = useState([]); // floating sparkles (desktop)
  const [yesBounce, setYesBounce] = useState(false);
  const [noShake, setNoShake] = useState(false);
  const noRef = useRef(null);

  // mobile: each No tap shrinks No, grows Yes
  const noScale = isTouch ? Math.max(0.25, 1 - attempts * 0.18) : 1;
  const yesScale = isTouch ? Math.min(2.2, 1 + attempts * 0.22) : 1;

  const spawnHeart = useCallback((clientX, clientY) => {
    const id = heartId++;
    const emoji = ["💗", "✨", "💖", "⭐"][id % 4];
    setHearts((h) => [...h, { id, x: clientX, y: clientY, emoji }]);
    setTimeout(() => {
      setHearts((h) => h.filter((p) => p.id !== id));
    }, 900);
  }, []);

  // Desktop: No runs away from the cursor on near-miss.
  const dodge = useCallback(
    (e) => {
      if (!useChase) return;
      const el = noRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist > 110) return; // only flee on near-miss

      spawnHeart(cx, cy);
      const angle = Math.atan2(cy - e.clientY, cx - e.clientX);
      const jump = 130 + Math.random() * 60;
      // keep it roughly on screen
      const maxX = window.innerWidth / 2 - 80;
      const maxY = window.innerHeight / 2 - 80;
      const nx = Math.max(
        -maxX,
        Math.min(maxX, noPos.x + Math.cos(angle) * jump)
      );
      const ny = Math.max(
        -maxY,
        Math.min(maxY, noPos.y + Math.sin(angle) * jump)
      );
      setNoPos({ x: nx, y: ny });
      setAttempts((a) => a + 1);
    },
    [noPos, spawnHeart]
  );

  const onNoTap = useCallback(() => {
    // Mobile (or reduced-motion desktop): No just shrinks, Yes grows.
    setAttempts((a) => a + 1);
    setNoShake(true);
    setTimeout(() => setNoShake(false), 260);
  }, []);

  const onYesClick = useCallback(() => {
    setYesBounce(true);
    onYes();
  }, [onYes]);

  const caption = attempts >= 3 ? "the answer was always yes 🤭" : " ";

  return (
    <>
      <div className="trap-row">
        <button
          className="btn btn-yes"
          onClick={onYesClick}
          style={{
            transform: `scale(${yesScale})`,
            transition: `transform 0.3s ${OVERSHOOT}`,
            animation: yesBounce ? "yes-bounce 0.4s" : "none",
          }}
        >
          Yes
        </button>

        <button
          ref={noRef}
          className="btn btn-no"
          onPointerMove={dodge}
          onClick={onNoTap}
          style={{
            transform: `translate(${noPos.x}px, ${noPos.y}px) scale(${noScale})`,
            transition: `transform 0.25s ${OVERSHOOT}`,
            animation: noShake ? "no-shake 0.26s" : "none",
            opacity: noScale < 0.3 ? 0.5 : 1,
            position: useChase ? "relative" : "static",
            zIndex: 5,
          }}
        >
          No
        </button>
      </div>

      <p className="trap-caption">{caption}</p>

      {/* desktop near-miss sparkles */}
      {hearts.map((h) => (
        <span
          key={h.id}
          className="spark"
          style={{ left: h.x, top: h.y }}
        >
          {h.emoji}
        </span>
      ))}
    </>
  );
}
