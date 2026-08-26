export function Progress() {
  return (
    <section className="progress-section">
      <h2 className="section-title">Development Status</h2>
      <div className="progress-list">
        <div className="progress-item">
          <span className="progress-name">Protocol architecture</span>
          <span className="progress-status complete">✓</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Cryptographic primitives</span>
          <span className="progress-status complete">✓</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Issuer registry design</span>
          <span className="progress-status complete">✓</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Verification protocol</span>
          <span className="progress-status complete">✓</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Revocation protocol</span>
          <span className="progress-status complete">✓</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Compact implementation</span>
          <span className="progress-status pending">In progress</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Contract tests</span>
          <span className="progress-status pending">In progress</span>
        </div>
        <div className="progress-item">
          <span className="progress-name">Frontend experiences</span>
          <span className="progress-status pending">In progress</span>
        </div>
      </div>
    </section>
  );
}
