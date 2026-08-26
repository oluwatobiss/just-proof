export function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2 className="section-title">How It Works</h2>
      <div className="process-flow">
        <div className="step">
          <div className="step-number">01</div>
          <h3 className="step-title">Issuer</h3>
          <p className="step-desc">A recognized issuer creates a credential.</p>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">02</div>
          <h3 className="step-title">Credential</h3>
          <p className="step-desc">
            The holder retains their credential privately.
          </p>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">03</div>
          <h3 className="step-title">Private Proof</h3>
          <p className="step-desc">
            The holder generates a zero-knowledge proof about the credential.
          </p>
        </div>
        <div className="step-connector"></div>
        <div className="step">
          <div className="step-number">04</div>
          <h3 className="step-title">Verification</h3>
          <p className="step-desc">
            A verifier confirms the qualification without seeing the private
            credential.
          </p>
        </div>
      </div>
    </section>
  );
}
