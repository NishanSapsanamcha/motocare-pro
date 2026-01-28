import logo from "../../assets/logo.png";
import "./SplashScreen.css";

export default function SplashScreen({ label = "Loading..." }) {
  return (
    <div className="splash-screen" role="status" aria-live="polite">
      <div className="splash-card">
        <img src={logo} alt="Motocare Pro" className="splash-logo" />
        <div className="splash-title">Motocare Pro</div>
        <div className="splash-subtitle">{label}</div>
        <div className="splash-spinner" aria-hidden="true" />
      </div>
    </div>
  );
}
