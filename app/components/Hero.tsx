export function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-eyebrow">
          PRIVACY-PRESERVING CREDENTIAL VERIFICATION
        </div>
        <h1 className="hero-title">
          Prove your qualifications.
          <br />
          Keep your credentials private.
        </h1>
        <p className="hero-subtitle">
          JustProof allows qualification claims to be verified without
          unnecessarily exposing the underlying credential or sensitive
          information.
        </p>
        <div className="hero-actions">
          <a href="#verify" className="btn btn-primary">
            Explore Verification
          </a>
          <a href="#issuers" className="btn btn-secondary">
            For Issuers
          </a>
        </div>
      </div>
      <div className="hero-visual">
        <div className="abstract-proof-visual">
          <div className="visual-credential">
            <div className="cred-header"></div>
            <div className="cred-lines">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="cred-mask"></div>
          </div>
          <div className="visual-transformation">
            <div className="transform-path"></div>
            <div className="transform-node"></div>
            <div className="transform-path"></div>
          </div>
          <div className="visual-claim">
            <div className="claim-icon"></div>
            <div className="claim-bar"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
