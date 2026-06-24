import BlurText from "./text/BlurText.jsx";
import endingImg from "../assets/images/ending.gif";
import "./ending.css";

// Static CSS gradient (no WebGL — GPU cooldown) + image slot + message + restart.
export default function EndingScreen({ onRestart }) {
  return (
    <div className="screen ending-bg">
      <div className="content ending-content">
        <img className="ending-img" src={endingImg} alt="" />

        <BlurText
          as="h2"
          className="ending-msg"
          text="te amo 💗"
        />
        <p className="ending-sub">thanks for choosing 4K</p>

        <button className="btn btn-yes ending-restart" onClick={onRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}
