import endingImg from "../assets/images/ending.gif";
import "./ending.css";

// Static CSS gradient (no WebGL — GPU cooldown) + image slot + message + restart.
export default function EndingScreen({ onRestart }) {
  return (
    <div className="screen ending-bg">
      <div className="content ending-content">
        <img className="ending-img" src={endingImg} alt="" />

        <p className="ending-credit">made by errebus</p>

        <button className="btn btn-yes ending-restart" onClick={onRestart}>
          Restart
        </button>
      </div>
    </div>
  );
}
