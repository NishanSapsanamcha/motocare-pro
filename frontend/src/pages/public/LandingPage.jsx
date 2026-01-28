import { Link } from "react-router-dom";
import { useState } from "react";
import logo from "../../assets/logo.png";
import "./LandingPage.css";

import Login from "../public/Login";
import Register from "../public/Register";

import re from "../../assets/brands/re.jpg";
import yamaha from "../../assets/brands/yamaha.jpg";
import tvs from "../../assets/brands/tvs.jpg";
import hero from "../../assets/brands/hero.jpg";
import honda from "../../assets/brands/honda.jpg";
import vespa from "../../assets/brands/vespa.jpg";
import triumph from "../../assets/brands/triumph.jpg";
import suzuki from "../../assets/brands/suzuki.jpg";
import ktm from "../../assets/brands/ktm.jpg";
import bajaj from "../../assets/brands/bajaj.jpg";
import bmw from "../../assets/brands/bmw.jpg";
import benelli from "../../assets/brands/benelli.jpg";
import ducati from "../../assets/brands/ducati.jpg";
import aprilia from "../../assets/brands/apriliajpg.jpg";
import husqvarna from "../../assets/brands/husqvarna.jpg";
import med from "../../assets/med.png";

export default function LandingPage() {
  const brands = [
    { src: re, name: "Royal Enfield" },
    { src: yamaha, name: "yamaha" },
    { src: tvs, name: "tvs" },
    { src: hero, name: "hero" },
    { src: honda, name: "honda" },
    { src: vespa, name: "vespa" },
    { src: triumph, name: "triumph" },
    { src: suzuki, name: "suzuki" },
    { src: ktm, name: "ktm" },
    { src: bajaj, name: "bajaj" },
    { src: bmw, name: "bmw" },
    { src: benelli, name: "benelli" },
    { src: ducati, name: "ducati" },
    { src: aprilia, name: "aprilia" },
    { src: husqvarna, name: "husqvarna" },
  ];

  const marqueeItems = [...brands, ...brands, ...brands];

  // null | "login" | "register"
  const [open, setOpen] = useState(null);

  return (
    <div className={`lp ${open ? "lp-modal-open" : ""}`}>
      <div className="lp-content">
        {/* NAV */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Link to="/" className="lp-brand">
            <img src={logo} alt="Motocare Pro" className="lp-logo" />
            <span className="lp-brand-text">Motocare Pro</span>
          </Link>

          <div className="lp-auth">
            <button
              type="button"
              className="lp-link"
              onClick={() => setOpen("login")}
            >
              Log In
            </button>

            <button
              type="button"
              className="lp-btn"
              onClick={() => setOpen("register")}
            >
              Register Now
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-inner">
          <h1 className="lp-hero-title">Premium Bike Service, Fast & Transparent</h1>
          <p className="lp-hero-sub">
            Book trusted mechanics, track service updates, and get transparent pricing — all in one place.
          </p>

          <button
            type="button"
            className="lp-cta"
            onClick={() => setOpen("register")}
          >
            Explore Now
          </button>
        </div>
      </section>

      <section className="lp-warranty">
        <div className="lp-container">
          <h2 className="lp-section-title">Service Warranty</h2>
          <p className="lp-section-sub">Book from your home or office, fair and transparent pricing</p>

          <div className="lp-warranty-grid">
            <div className="lp-warranty-card">
              <div className="lp-warranty-badge" aria-hidden="true">✓</div>

              <div className="lp-warranty-card-top">
                <div className="lp-warranty-big">3 MONTHS</div>
                <div className="lp-warranty-or">or</div>
                <div className="lp-warranty-big">3000 KM</div>
              </div>

              <div className="lp-warranty-word">WARRANTY</div>
            </div>

            <div className="lp-warranty-points">
              <div className="lp-point ok">
                <span className="lp-point-icon">✓</span>
                <span>3 Months or 3,000 KM whichever comes first.</span>
              </div>

              <div className="lp-point ok">
                <span className="lp-point-icon">✓</span>
                <span>Warranty on parts and labour.</span>
              </div>

              <div className="lp-point ok">
                <span className="lp-point-icon">✓</span>
                <span>Hassle-free claim process.</span>
              </div>

              <div className="lp-point no">
                <span className="lp-point-icon">✕</span>
                <span>Wear and tear excluded (Accidental Cases).</span>
              </div>
            </div>

            <div className="lp-warranty-illus">
              <img src={med} alt="med c" />
            </div>
          </div>

          <p className="lp-warranty-note">
            We provide a 3 months / 3,000 KM warranty with every bike/scooter service. You have to buy our
            recommended parts for parts warranty policy. The labour is also covered under the warranty.
          </p>

          <div className="lp-warranty-cta-wrap">
            {/* keep route navigation here if you want */}
            <p className="lp-warranty-cta">
              Available on every service
            </p>
          </div>
        </div>
      </section>

      {/* BRANDS SLIDER */}
      <section className="lp-brands">
        <div className="lp-container">
          <h2 className="lp-section-title">Brands We Serve</h2>

          <div className="lp-marquee">
            <div className="lp-marquee-track">
              {marqueeItems.map((b, idx) => (
                <div className="lp-brand-card" key={`${b.name}-${idx}`}>
                  <img className="lp-brand-logo" src={b.src} alt={b.name} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-col">
            <div className="lp-footer-brand">
              <img src={logo} className="lp-footer-logo" alt="Motocare Pro" />
              <div>
                <div className="lp-footer-title">Motocare Pro</div>
                <div className="lp-footer-muted">Fast, transparent bike servicing.</div>
              </div>
            </div>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-head">Contact</div>
            <div className="lp-footer-item">Budhanilkantha-2, Kathmandu</div>
            <div className="lp-footer-item">+977 9800000000</div>
            <div className="lp-footer-item">support@motocare-pro.com</div>
          </div>

          <div className="lp-footer-col">
            <div className="lp-footer-head">Company</div>
            <Link className="lp-footer-link" to="/about">About Us</Link>
            <Link className="lp-footer-link" to="/contact">Contact Us</Link>
            <Link className="lp-footer-link" to="/terms">Terms & Policy</Link>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <div className="lp-container lp-footer-bottom-inner">
            <span>© {new Date().getFullYear()} Motocare Pro. All rights reserved.</span>
          </div>
        </div>
      </footer>
      </div>

      {/* MODAL */}
      {open && (
        <div className="auth-overlay" onClick={() => setOpen(null)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="auth-close" onClick={() => setOpen(null)}>
              ✕
            </button>

            {open === "login" ? (
              <Login onSwitch={() => setOpen("register")} />
            ) : (
              <Register onSwitch={() => setOpen("login")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
