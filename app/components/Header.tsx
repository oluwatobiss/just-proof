import { configLinks } from "../config/links";

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <a href="/" className="logo-text">JustProof</a>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span className="status-text">IN ACTIVE DEVELOPMENT</span>
          </div>
        </div>
        <a href="/demo" className="btn btn-secondary">Try demo</a>
        <nav className="primary-nav">
          <a href="/demo" className="nav-link">
            Verify
          </a>
          <a href="/demo#demo-progress" className="nav-link">
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
