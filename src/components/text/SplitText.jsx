import { motion } from "framer-motion";

// React Bits "SplitText" equivalent: characters drop + fade in, staggered.
// Used for the "Do you want 4K?" title.
export default function SplitText({
  text = "",
  className = "",
  delay = 0.045,
  style,
}) {
  const chars = Array.from(String(text));

  return (
    <motion.h1
      className={className}
      style={{ display: "inline-block", ...style }}
      initial="hidden"
      animate="visible"
      aria-label={text}
    >
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          style={{ display: "inline-block", willChange: "transform" }}
          variants={{
            hidden: { opacity: 0, y: 24, rotateZ: -6 },
            visible: { opacity: 1, y: 0, rotateZ: 0 },
          }}
          transition={{
            duration: 0.45,
            delay: i * delay,
            ease: [0.34, 1.56, 0.64, 1],
          }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </motion.h1>
  );
}
