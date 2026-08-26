import { configLinks } from "../config/links";

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <span className="logo-text">JustProof</span>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">IN ACTIVE DEVELOPMENT</span>
          </div>
        </div>
        <nav className="primary-nav">
          <a href="#verify" className="nav-link">
            Verify
          </a>
          <a href="#issuers" className="nav-link">
            Become an Issuer
          </a>
          <a
            href={configLinks.x}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link icon-link"
          >
            𝕏
          </a>
        </nav>
      </div>
    </header>
  );
}
