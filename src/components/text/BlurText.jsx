import { motion } from "framer-motion";

// React Bits "BlurText" equivalent: words blur + fade in, staggered.
// CSS-composited (filter + transform), cheap. Re-keys per text so each new
// lyric line re-animates.
export default function BlurText({
  text = "",
  className = "",
  delay = 0.04,
  as: Tag = "p",
  style,
}) {
  const words = String(text).split(" ");
  const MotionTag = motion(Tag);

  return (
    <MotionTag
      key={text}
      className={className}
      style={{ display: "inline-block", ...style }}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ display: "inline-block", willChange: "transform, filter" }}
          variants={{
            hidden: { opacity: 0, filter: "blur(10px)", y: 12 },
            visible: { opacity: 1, filter: "blur(0px)", y: 0 },
          }}
          transition={{
            duration: 0.5,
            delay: i * delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </MotionTag>
  );
}
