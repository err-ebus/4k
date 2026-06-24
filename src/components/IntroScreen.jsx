import { useCallback } from "react";
import Orb from "./backgrounds/Orb.jsx";
import Characters from "./Characters.jsx";
import YesNoTrap from "./YesNoTrap.jsx";
import SplitText from "./text/SplitText.jsx";
import { unlockMotion } from "../hooks/usePointer.js";
import "./intro.css";

// Orb + title + Yes/No trap + Characters.
export default function IntroScreen({ onYes }) {
  // Unlock iOS gyro on the Yes tap (user gesture) BEFORE transitioning,
  // alongside the audio start that App handles.
  const handleYes = useCallback(async () => {
    await unlockMotion();
    onYes();
  }, [onYes]);

  return (
    <div className="screen">
      <Orb hue={290} hoverIntensity={0.4} rotateOnHover />
      <div className="intro-scrim" />
      <Characters />

      <div className="content">
        <SplitText className="intro-title" text="4K?" />
        <YesNoTrap onYes={handleYes} />
      </div>
    </div>
  );
}
