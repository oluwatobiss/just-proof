import { configLinks } from "../config/links";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="logo-text">JustProof</span>
          <span className="tagline">Proof without unnecessary disclosure.</span>
        </div>
        <div className="footer-links">
          <a
            href={configLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            GitHub
          </a>
          <a
            href={configLinks.x}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            𝕏
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="mono">BUILT ON MIDNIGHT</span>
        <span className="mono">
          &copy; {new Date().getFullYear()} JustProof
        </span>
      </div>
    </footer>
  );
}
