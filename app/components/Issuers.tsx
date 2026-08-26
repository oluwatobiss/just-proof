export function Issuers() {
  return (
    <section id="issuers" className="product-section issuers-section">
      <div className="section-header">
        <div className="status-label mono">
          ISSUER EXPERIENCE &middot; IN DEVELOPMENT
        </div>
        <h2 className="section-title">Trust starts with the issuer.</h2>
        <p className="section-subtitle">
          Organizations register to establish a verifiable identity before their
          issued credentials can be trusted.
        </p>
      </div>
      <div className="process-flow vertical-flow">
        <div className="step">
          <div className="step-number">01</div>
          <h3 className="step-title">Organization</h3>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">02</div>
          <h3 className="step-title">Issuer Registration</h3>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">03</div>
          <h3 className="step-title">Issuer Verification</h3>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">04</div>
          <h3 className="step-title">Recognized Issuer</h3>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">05</div>
          <h3 className="step-title">Credential Issuance</h3>
        </div>
      </div>
    </section>
  );
}
