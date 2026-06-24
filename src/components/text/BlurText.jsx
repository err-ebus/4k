import { Fragment } from "react";
import { motion } from "framer-motion";

// React Bits "BlurText" equivalent: words blur + fade in, staggered.
// The outer element is a PLAIN tag (stable identity) and only the word spans
// are motion components — calling motion(Tag) inside render would create a new
// component type every render and cause remount/re-animation flicker.
// Re-animation on a new line is driven by the `key` the parent passes.
export default function BlurText({
  text = "",
  className = "",
  delay = 0.04,
  as: Tag = "p",
  style,
}) {
  const words = String(text).split(" ");

  return (
    <Tag className={className} style={style}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            style={{ display: "inline-block", willChange: "transform, filter" }}
            initial={{ opacity: 0, filter: "blur(10px)", y: 12 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * delay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {word}
          </motion.span>
          {/* real space BETWEEN inline-block spans so words don't tangle */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
