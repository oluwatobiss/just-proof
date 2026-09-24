import { useReducer, useState } from "react";
import {
  demoReducer,
  initialDemo,
  feedbackPrompts,
  feedbackRecord,
  feedbackUrl,
  liveStatus,
  resetMessage,
} from "./state";
import "./demo.css";

export function Demo() {
  const [state, dispatch] = useReducer(demoReducer, initialDemo);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [copying, setCopying] = useState(false);
  const live = liveStatus(
    import.meta.env.VITE_DEMO_STATUS_NETWORK,
    import.meta.env.VITE_DEMO_CONTRACT_ADDRESS,
  );
  const link = feedbackUrl(import.meta.env.VITE_FEEDBACK_URL);
  const steps = [
    {
      role: "01 · Issuer",
      title: "Recognize an issuer",
      circuit: "registerIssuerV2",
      text: "Demo Academy joins the registry. This fictional issuer can issue our sample qualification.",
      action: "register" as const,
      label: "Register demo issuer",
      enabled: state.stage === "start",
    },
    {
      role: "02 · Holder",
      title: "Receive a credential",
      circuit: "registerCredentialV2",
      text: "Sample Holder receives a fictional Builder qualification. The intended protocol keeps the full certificate private.",
      action: "issue" as const,
      label: "Issue sample credential",
      enabled: state.stage === "issuer",
    },
    {
      role: "03 · Verifier",
      title: "Ask only what matters",
      circuit: "proveQualificationV2",
      text: "The verifier asks: “Do you hold a valid Builder qualification?” The holder would prove eligibility without sharing the certificate.",
      action: "present" as const,
      label:
        state.stage === "revoked"
          ? "Try presentation again"
          : "Simulate presentation",
      enabled: ["credential", "presented", "revoked"].includes(state.stage),
    },
    {
      role: "04 · Issuer",
      title: "Withdraw the credential",
      circuit: "revokeCredentialV2",
      text: "Revocation changes the current simulated outcome. A previous presentation is not a promise of future validity.",
      action: "revoke" as const,
      label: "Revoke sample credential",
      enabled: state.stage === "presented",
    },
  ];

  async function copy() {
    if (link) return;
    const record = JSON.stringify(feedbackRecord(answers), null, 2);
    setCopying(true);
    try {
      await navigator.clipboard.writeText(record);
      setNotice("Feedback copied. Share it with the project team.");
    } catch {
      setNotice("Clipboard unavailable. Use Download feedback instead.");
    } finally {
      setCopying(false);
    }
  }
  function download() {
    if (link) return;
    const record = JSON.stringify(feedbackRecord(answers), null, 2);
    const url = URL.createObjectURL(
      new Blob([record], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "justproof-demo-feedback.json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice(
      "Feedback download requested. Share the file with the project team.",
    );
  }
  return (
    <div className="demo-page">
      <div className="demo-mode">
        <strong>Interactive demonstration · Simulation only</strong>
        {link ? <a href={link} target="_blank" rel="noopener noreferrer">Give feedback</a> : <a href="#demo-feedback">Give feedback</a>}
      </div>
      <section className="demo-intro">
        <p className="mono">ONE QUALIFICATION. LESS DISCLOSURE.</p>
        <h1>
          Show you qualify.
          <br />
          <span>Keep the certificate yours.</span>
        </h1>
        <p>
          Explore an issuer → holder → verifier journey in four small steps. All
          identities and credentials here are fictional. No wallet or connection
          is needed after the page loads.
        </p>
        <div className="demo-disclosure">
          No cryptographic proof was generated. No cryptographic verification
          occurred. No ledger transaction was submitted.
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            dispatch("reset");
            if (!link) setAnswers({});
            setNotice(resetMessage(link));
          }}
        >
          Reset demonstration
        </button>
      </section>
      <section
        className="demo-workspace"
        aria-label="Simulated credential lifecycle"
      >
        <div className="demo-steps">
          {steps.map((step, i) => (
            <article
              className={`demo-card ${step.enabled ? "demo-card-active" : ""}`}
              key={step.circuit}
            >
              <p className="mono">{step.role}</p>
              <h2>{step.title}</h2>
              <p>{step.text}</p>
              <code>{step.circuit}</code>
              <button
                className="btn btn-primary"
                disabled={!step.enabled}
                onClick={() => dispatch(step.action)}
              >
                {step.label}
              </button>
              {!step.enabled && (
                <small>
                  {state.stage === "start" && i > 0
                    ? "Start with issuer registration."
                    : "Follow the steps in order; reset to start again."}
                </small>
              )}
            </article>
          ))}
        </div>
        <aside
          className="demo-card demo-result"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="mono">VERIFIER VIEW · SIMULATED</p>
          <h2>
            {state.outcome === "simulated-qualified"
              ? "Simulated: qualified"
              : state.outcome === "simulated-rejected"
                ? "Simulated: rejected"
                : "Waiting for presentation"}
          </h2>
          <p>
            {state.outcome === "simulated-rejected"
              ? "The sample credential is revoked. It can no longer satisfy this simulated qualification request."
              : state.outcome === "simulated-qualified"
                ? "The sample meets the demo rule. This is a browser-local illustration, not a verified proof."
                : "Register the issuer, issue the sample credential, then simulate a presentation."}
          </p>
          <dl>
            <dt>Requested qualification</dt>
            <dd>Builder · fictional sample</dd>
            <dt>Current demo state</dt>
            <dd>{state.stage}</dd>
            <dt>Certificate disclosed to verifier</dt>
            <dd>No — illustrated privacy boundary</dd>
          </dl>
        </aside>
      </section>
      <section className="demo-explain">
        <h2>Privacy is the point</h2>
        <div className="demo-columns">
          <article>
            <h3>Stays private in the intended protocol</h3>
            <p>
              The complete credential, subject secret, credential opening,
              issuance nonce, private timestamps and membership paths. This demo
              holds no real credential or secret.
            </p>
          </article>
          <article>
            <h3>Public in the intended protocol</h3>
            <p>
              Registry commitments and roots, the qualification request
              including its challenge and time window, and two returned digests
              binding the request and current state. Privacy does not mean every
              interaction is invisible.
            </p>
          </article>
        </div>
      </section>
      <section className="demo-explain" id="demo-progress">
        <h2>What is real today?</h2>
        <p>
          Checking a certificate often means collecting more personal
          information than needed. Midnight’s programmable privacy and
          zero-knowledge technology are intended to let a holder demonstrate a
          specific claim while keeping the underlying credential private.
        </p>
        <ul>
          <li>
            <strong>Implemented:</strong> all four named lifecycle circuits,
            generated simulation and atomicity checks.
          </li>
          <li>
            <strong>Completed artifact work:</strong> four-circuit key
            generation and verifier-key serialization checks. Serialization
            checks are not cryptographic proof verification.
          </li>
          <li>
            <strong>Available here:</strong> an interactive browser simulation,
            with no backend.
          </li>
          <li>
            <strong>Still unfinished:</strong> actual proof generation,
            cryptographic verification, ledger execution and release
            integration. The remaining R61 work stays open.
          </li>
        </ul>
        <h3>Live integration · disabled</h3>
        <p>
          Optional configuration status:{" "}
          {live.status === "unavailable"
            ? "Unavailable — no valid Preprod configuration provided."
            : "Preprod configured, not contacted or verified."}
        </p>
        {live.address && (
          <p className="demo-address">Configured address: {live.address}</p>
        )}
        <p>
          Wallet: not connected or requested. Active mode remains simulation.
        </p>
        <div className="demo-actions">
          <button className="btn btn-secondary" disabled>
            Generate live proof — unavailable
          </button>
          <button className="btn btn-secondary" disabled>
            Submit transaction — unavailable
          </button>
        </div>
      </section>
      <section className="demo-explain" id="demo-feedback">
        <h2>Help shape JustProof</h2>
        {link ? <>
          <p>The external form has its own privacy policy and may request your public Midnight Preprod wallet address. The address and its public on-chain activity may be checked to verify participation and included in the program submission’s user-address list. A public address does not grant wallet access, but it is linkable information. Submit only an address you control and consent to associate with your feedback. Never provide a seed or recovery phrase, private key, spending or viewing key, wallet password, signing material, credential secret or other authentication secret. Nothing is transmitted to the form until you explicitly open it; feedback is sent only when you submit it. Submitting an address after this browser-local simulation does not prove an on-chain MVP interaction.</p>
          <a className="btn btn-secondary" href={link} target="_blank" rel="noopener noreferrer">Open feedback and participation form ↗</a>
        </> : <>
        <p>
          Development fallback only: this does not satisfy the mandatory Google Sheet or verified-Preprod-user requirements. Do not enter wallet addresses or personal information,
          credentials, wallet details or secrets. Nothing is submitted
          automatically.
        </p>
        <div className="demo-feedback">
          {feedbackPrompts.map((prompt) => (
            <label key={prompt}>
              {prompt}
              <select
                value={answers[prompt] ?? "Not sure"}
                onChange={(e) =>
                  setAnswers({ ...answers, [prompt]: e.target.value })
                }
              >
                {(prompt === "Ease of understanding" ||
                prompt === "Privacy clarity"
                  ? ["Not sure", "Clear", "Needs explanation"]
                  : prompt === "General comments"
                    ? ["Not sure", "Useful", "Needs explanation"]
                    : [
                        "Not sure",
                        "Issuer registration",
                        "Credential issuance",
                        "Private presentation",
                        "Revocation",
                        "Live integration",
                        "More examples",
                        "None",
                      ]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="demo-actions">
          <button className="btn btn-primary" disabled={copying} onClick={copy}>
            {copying ? "Copying…" : "Copy feedback"}
          </button>
          <button className="btn btn-secondary" onClick={download}>
            Download feedback
          </button>

        </div>
        </>}
        <p role="status">{notice}</p>
      </section>
    </div>
  );
}
