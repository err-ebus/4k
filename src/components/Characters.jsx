import { usePointer } from "../hooks/usePointer.js";

// Decorative parallax sprites (section 4). pointer-events: none so finger
// drags pass straight through to the buttons underneath.
// Different `depth` per sprite = parallax (higher depth = feels closer).
const SPRITES = [
  { emoji: "💗", depth: 30, base: { left: "15%", top: "20%" } },
  { emoji: "⭐", depth: 18, base: { left: "75%", top: "28%" } },
  { emoji: "🫧", depth: 45, base: { left: "62%", top: "70%" } },
  { emoji: "💫", depth: 24, base: { left: "22%", top: "72%" } },
  { emoji: "🌸", depth: 36, base: { left: "85%", top: "60%" } },
];

export default function Characters() {
  const { x, y } = usePointer();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {SPRITES.map((s, i) => (
        <span
          key={i}
          className="floaty" /* idle bob keyframe (translate channel) */
          style={{
            position: "absolute",
            ...s.base,
            fontSize: 40,
            willChange: "transform",
            // parallax uses transform; idle bob uses translate — separate channels
            transform: `translate(${x * s.depth}px, ${y * s.depth}px)`,
            transition: "transform 0.15s ease-out",
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {s.emoji}
        </span>
      ))}
    </div>
  );
}
