export function Verification() {
  return (
    <section id="verify" className="product-section verification-section">
      <div className="section-header">
        <div className="status-label mono">
          VERIFICATION EXPERIENCE &middot; IN DEVELOPMENT
        </div>
        <h2 className="section-title">Verify without seeing everything.</h2>
        <p className="section-subtitle">
          Confirm qualification claims while receiving only the information
          necessary for the verification.
        </p>
      </div>
      <div className="mockup-container">
        <div className="mockup-card verification-result">
          <div className="mockup-header">
            <span className="mono">VERIFICATION_RESULT</span>
            <span className="status-valid">Valid</span>
          </div>
          <div className="mockup-body">
            <div className="data-row">
              <span className="data-label">Qualification</span>
              <span className="data-value">Midnight Certified Builder</span>
            </div>
            <div className="data-row">
              <span className="data-label">Issuer</span>
              <span className="data-value">
                Qualification Proof Certification Authority
              </span>
            </div>
            <div className="divider"></div>
            <div className="check-list">
              <div className="check-item">
                <span className="check-icon">✓</span> Issuer recognized
              </div>
              <div className="check-item">
                <span className="check-icon">✓</span> Credential authentic
              </div>
              <div className="check-item">
                <span className="check-icon">✓</span> Credential active
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
