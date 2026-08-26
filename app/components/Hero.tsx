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
        {/* Abstract cryptographic visual */}
        <div className="abstract-proof">
          <div className="proof-layer layer-1"></div>
          <div className="proof-layer layer-2"></div>
          <div className="proof-layer layer-3"></div>
          <div className="proof-core"></div>
        </div>
      </div>
    </section>
  );
}
